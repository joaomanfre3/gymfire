import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { checkUserAIAccess, checkFeatureAccess, incrementUsage, buildSystemPrompt, getAIConfig } from '@/lib/ai';
import { selectProvider, selectProviderExcluding, incrementProviderUsage } from '@/lib/ai-router';
import { callProviderStream } from '@/lib/ai-providers';

// POST - send message and get AI response (SSE streaming)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { id: conversationId } = await params;
    const { content } = await request.json();

    if (!content?.trim()) {
      return new Response(JSON.stringify({ error: 'Content required' }), { status: 400 });
    }

    // Verify conversation belongs to user
    const conv = await prisma.aIConversation.findUnique({ where: { id: conversationId } });
    if (!conv || conv.userId !== user.id) {
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    }

    // 1. Check access (plan, limits, enabled)
    const access = await checkUserAIAccess(user.id);
    if (!access.allowed) {
      return new Response(
        JSON.stringify({ error: access.reason, type: 'limit' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Check feature gating (intent classification)
    const feature = await checkFeatureAccess(access.plan!, content);

    if (!feature.allowed) {
      // Save blocked message
      await prisma.aIMessage.create({
        data: {
          conversationId,
          role: 'user',
          content: content.trim(),
          intent: feature.intent,
          blocked: true,
        },
      });

      return new Response(
        JSON.stringify({ error: feature.blockedMessage, type: 'blocked', intent: feature.intent }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Select provider
    const provider = await selectProvider(access.plan!);
    if (!provider) {
      return new Response(
        JSON.stringify({ error: 'IA indisponível no momento. Tente novamente mais tarde.', type: 'unavailable' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Build system prompt
    const systemPrompt = await buildSystemPrompt(user.id, access.plan!);
    const config = await getAIConfig();
    const rawMaxTokens = config.maxTokens;
    const maxTokens = Math.min(Number(rawMaxTokens) || 1024, 4096);
    const temperature = Math.min(Number(config.temperature) || 0.7, 2);

    // 5. Get conversation history (last 20 messages)
    const history = await prisma.aIMessage.findMany({
      where: { conversationId, blocked: false },
      orderBy: { createdAt: 'asc' },
      take: 20,
      select: { role: true, content: true },
    });

    // 6. Save user message
    await prisma.aIMessage.create({
      data: {
        conversationId,
        role: 'user',
        content: content.trim(),
        intent: feature.intent,
      },
    });

    // 7. Build messages array for AI
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user', content: content.trim() },
    ];

    // 8. Call provider with streaming (with fallback retry)
    let stream: ReadableStream<Uint8Array>;
    let activeProvider = provider;
    try {
      stream = await callProviderStream(provider, messages, { maxTokens, temperature });
    } catch (firstError) {
      console.warn(`Provider ${provider.name} failed, trying fallback:`, firstError);
      const fallback = await selectProviderExcluding(access.plan!, [provider.name]);
      if (!fallback) throw firstError;
      activeProvider = fallback;
      stream = await callProviderStream(fallback, messages, { maxTokens, temperature });
    }

    // Wrap stream to save assistant message on completion
    const encoder = new TextEncoder();
    const reader = stream.getReader();
    let fullContent = '';
    let latencyMs = 0;

    const responseStream = new ReadableStream({
      async pull(controller) {
        const { done, value } = await reader.read();

        if (done) {
          controller.close();

          // Save assistant message and update usage (fire-and-forget)
          const estimatedTokens = Math.ceil(fullContent.length / 4);
          Promise.all([
            prisma.aIMessage.create({
              data: {
                conversationId,
                role: 'assistant',
                content: fullContent,
                provider: activeProvider.name,
                tokensUsed: estimatedTokens,
                latencyMs,
              },
            }),
            incrementUsage(user.id, estimatedTokens),
            incrementProviderUsage(activeProvider.id),
            // Update conversation title from first message
            conv.title ? Promise.resolve() : prisma.aIConversation.update({
              where: { id: conversationId },
              data: { title: content.trim().slice(0, 60) },
            }),
            prisma.aIConversation.update({
              where: { id: conversationId },
              data: { updatedAt: new Date() },
            }),
          ]).catch(console.error);

          return;
        }

        // Parse the chunk to accumulate content
        const text = new TextDecoder().decode(value);
        const lines = text.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) fullContent += data.content;
              if (data.latencyMs) latencyMs = data.latencyMs;
            } catch { /* skip */ }
          }
        }

        controller.enqueue(value);
      },
      cancel() {
        reader.cancel();
      },
    });

    return new Response(responseStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('AI message error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno. Tente novamente.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
