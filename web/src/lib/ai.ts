import { prisma } from './prisma';
import type { UserPlan } from '@prisma/client';
import { classifyIntent, getBlockedMessage } from './ai-intent';
import type { AIIntent } from './ai-intent';

// ==================== CONFIG ====================

export async function getAIConfig(): Promise<Record<string, unknown>> {
  const rows = await prisma.aIConfig.findMany();
  const config: Record<string, unknown> = {};
  for (const row of rows) {
    config[row.key] = row.value;
  }
  return config;
}

async function getConfigValue<T>(key: string): Promise<T | null> {
  const row = await prisma.aIConfig.findUnique({ where: { key } });
  return row ? (row.value as T) : null;
}

// ==================== ACCESS CHECK ====================

interface AccessResult {
  allowed: boolean;
  reason?: string;
  remaining?: number;
  plan?: UserPlan;
}

export async function checkUserAIAccess(userId: string): Promise<AccessResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, aiEnabled: true, aiLimitOverride: true },
  });

  if (!user) return { allowed: false, reason: 'Usuário não encontrado' };

  // Global kill switch
  const globalEnabled = await getConfigValue<boolean>('globalEnabled');
  if (globalEnabled === false) return { allowed: false, reason: 'IA temporariamente indisponível' };

  // Per-user disable
  if (!user.aiEnabled) return { allowed: false, reason: 'IA desabilitada para sua conta' };

  // Get daily limit
  const limits = await getConfigValue<Record<string, number>>('limits');
  const dailyLimit = user.aiLimitOverride ?? limits?.[user.plan] ?? 5;

  // Check today's usage
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const usage = await prisma.aIUsageDaily.findUnique({
    where: { userId_date: { userId, date: today } },
  });

  const used = usage?.requestCount ?? 0;
  if (used >= dailyLimit) {
    return {
      allowed: false,
      reason: `Limite diário atingido (${dailyLimit} mensagens). Volte amanhã ou faça upgrade!`,
      remaining: 0,
      plan: user.plan,
    };
  }

  return { allowed: true, remaining: dailyLimit - used, plan: user.plan };
}

// ==================== FEATURE GATING ====================

interface FeatureResult {
  allowed: boolean;
  intent: AIIntent;
  blockedMessage?: string;
}

export async function checkFeatureAccess(userPlan: UserPlan, message: string): Promise<FeatureResult> {
  const intent = classifyIntent(message);

  const features = await getConfigValue<Record<string, Record<string, boolean>>>('features');
  if (!features) return { allowed: true, intent };

  const planFeatures = features[userPlan];
  if (!planFeatures) return { allowed: true, intent };

  const isAllowed = planFeatures[intent];
  if (isAllowed === false) {
    return {
      allowed: false,
      intent,
      blockedMessage: getBlockedMessage(intent),
    };
  }

  return { allowed: true, intent };
}

// ==================== USAGE TRACKING ====================

export async function incrementUsage(userId: string, tokensUsed: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.aIUsageDaily.upsert({
    where: { userId_date: { userId, date: today } },
    update: {
      requestCount: { increment: 1 },
      tokensUsed: { increment: tokensUsed },
    },
    create: {
      userId,
      date: today,
      requestCount: 1,
      tokensUsed,
    },
  });
}

export async function getUserUsage(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, aiLimitOverride: true },
  });

  const limits = await getConfigValue<Record<string, number>>('limits');
  const dailyLimit = user?.aiLimitOverride ?? limits?.[user?.plan || 'FREE'] ?? 5;

  const usage = await prisma.aIUsageDaily.findUnique({
    where: { userId_date: { userId, date: today } },
  });

  return {
    used: usage?.requestCount ?? 0,
    limit: dailyLimit,
    remaining: Math.max(0, dailyLimit - (usage?.requestCount ?? 0)),
    plan: user?.plan || 'FREE',
  };
}

// ==================== SYSTEM PROMPT BUILDER ====================

export async function buildSystemPrompt(userId: string, userPlan: UserPlan): Promise<string> {
  const [basePrompt, features, userContext] = await Promise.all([
    getConfigValue<string>('systemPrompt'),
    getConfigValue<Record<string, Record<string, boolean>>>('features'),
    getUserContext(userId),
  ]);

  const parts: string[] = [];

  // Base prompt from admin
  parts.push(basePrompt || 'Você é um personal trainer virtual chamado GymFire AI.');

  // Plan restrictions
  const planFeatures = features?.[userPlan] || {};
  const blocked = Object.entries(planFeatures)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  if (blocked.length > 0) {
    const labels: Record<string, string> = {
      GENERATE_WORKOUT: 'gerar treinos completos',
      SUBSTITUTE_EXERCISE: 'substituir exercícios',
      WEEKLY_PLAN: 'criar planos semanais/mensais',
      PROGRESS_ANALYSIS: 'analisar progresso',
      DIET_NUTRITION: 'criar dietas ou planos nutricionais',
      PERIODIZATION: 'fazer periodização de treinos',
    };
    const blockedLabels = blocked.map(b => labels[b]).filter(Boolean);
    if (blockedLabels.length > 0) {
      parts.push(`\nREGRAS DO PLANO (${userPlan}): Você NÃO deve ${blockedLabels.join(', ')}. Se o usuário pedir, responda gentilmente que essa funcionalidade requer um plano superior e sugira o upgrade.`);
    }
  }

  // User context
  if (userContext) {
    parts.push(`\n## Contexto do Usuário`);
    parts.push(`- Nome: ${userContext.displayName}`);
    parts.push(`- Plano: ${userPlan}`);
    parts.push(`- Streak atual: ${userContext.currentStreak} dias`);

    if (userContext.recentWorkouts.length > 0) {
      parts.push(`\n## Treinos Recentes (últimos 30 dias)`);
      parts.push(`- Total: ${userContext.recentWorkouts.length} treinos`);
      for (const w of userContext.recentWorkouts.slice(0, 5)) {
        parts.push(`  - ${w.date}: ${w.title} (${w.duration})`);
      }
    }

    if (userContext.personalRecords.length > 0) {
      parts.push(`\n## Records Pessoais`);
      for (const pr of userContext.personalRecords.slice(0, 5)) {
        parts.push(`  - ${pr.exercise}: ${pr.value}`);
      }
    }

    parts.push(`\n## Base de Exercícios`);
    parts.push(`O app tem ${userContext.exerciseCount} exercícios cadastrados. Quando sugerir exercícios, prefira nomes do banco de dados.`);
  }

  return parts.join('\n');
}

interface UserContext {
  displayName: string;
  currentStreak: number;
  exerciseCount: number;
  recentWorkouts: Array<{ date: string; title: string; duration: string }>;
  personalRecords: Array<{ exercise: string; value: string }>;
}

async function getUserContext(userId: string): Promise<UserContext | null> {
  const [user, workouts, records, exerciseCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { displayName: true, currentStreak: true },
    }),
    prisma.workout.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: 10,
      select: {
        title: true,
        startedAt: true,
        durationSecs: true,
      },
    }),
    prisma.personalRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        exercise: { select: { name: true } },
      },
    }),
    prisma.exercise.count({ where: { isPublic: true } }),
  ]);

  if (!user) return null;

  return {
    displayName: user.displayName,
    currentStreak: user.currentStreak,
    exerciseCount,
    recentWorkouts: workouts.map(w => ({
      date: w.startedAt?.toLocaleDateString('pt-BR') || '?',
      title: w.title || 'Treino',
      duration: w.durationSecs ? `${Math.floor(w.durationSecs / 60)}min` : '?',
    })),
    personalRecords: records.map(r => ({
      exercise: r.exercise.name,
      value: `${r.value}kg`,
    })),
  };
}
