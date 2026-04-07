import type { ProviderInfo } from './ai-router';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface StreamConfig {
  maxTokens: number;
  temperature: number;
}

// Universal streaming caller - all providers use OpenAI-compatible format
export async function callProviderStream(
  provider: ProviderInfo,
  messages: ChatMessage[],
  config: StreamConfig
): Promise<ReadableStream<Uint8Array>> {
  const apiKey = process.env[provider.apiKeyEnv];
  if (!apiKey) throw new Error(`Missing API key: ${provider.apiKeyEnv}`);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Provider-specific auth headers
  if (provider.name.startsWith('gemini')) {
    // Gemini OpenAI-compatible endpoint uses Bearer token
    headers['Authorization'] = `Bearer ${apiKey}`;
  } else if (provider.name.startsWith('openrouter')) {
    headers['Authorization'] = `Bearer ${apiKey}`;
    headers['HTTP-Referer'] = 'https://gymfire.app';
    headers['X-Title'] = 'GymFire';
  } else {
    // Groq and others use standard Bearer
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const startTime = Date.now();

  const response = await fetch(provider.baseUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: provider.model,
      messages,
      stream: true,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
    }),
  });

  if (!response.ok) {
    const error = await response.text().catch(() => 'Unknown error');
    throw new Error(`Provider ${provider.name} error ${response.status}: ${error}`);
  }

  if (!response.body) {
    throw new Error(`Provider ${provider.name} returned no body`);
  }

  // Transform the provider's SSE stream into our own format
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = response.body.getReader();

  let fullContent = '';
  let buffer = '';

  return new ReadableStream({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();

        if (done) {
          // Send final metadata
          const latencyMs = Date.now() - startTime;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true, fullContent, latencyMs })}\n\n`)
          );
          controller.close();
          return;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              fullContent += delta;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`)
              );
            }
          } catch {
            // Skip malformed JSON chunks
          }
        }
      } catch (error) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`)
        );
        controller.close();
      }
    },
    cancel() {
      reader.cancel();
    },
  });
}
