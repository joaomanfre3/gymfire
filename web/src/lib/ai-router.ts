import { prisma } from './prisma';
import type { UserPlan } from '@prisma/client';

export interface ProviderInfo {
  id: string;
  name: string;
  displayName: string;
  baseUrl: string;
  model: string;
  apiKeyEnv: string;
  maxRPM: number;
}

// Select the best available provider for the user's plan
export async function selectProvider(userPlan: UserPlan): Promise<ProviderInfo | null> {
  // Get min quality requirement for this plan
  const qualityConfig = await prisma.aIConfig.findUnique({ where: { key: 'minQualityPerPlan' } });
  const minQuality = qualityConfig?.value as Record<string, number> | undefined;
  const requiredQuality = minQuality?.[userPlan] ?? 1;

  // Check if we need to reset daily counters (new day)
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Reset providers whose lastResetAt is before today
  await prisma.aIProvider.updateMany({
    where: { lastResetAt: { lt: todayStart } },
    data: { todayUsed: 0, lastResetAt: now },
  });

  // Find best available provider
  const providers = await prisma.aIProvider.findMany({
    where: {
      isEnabled: true,
      quality: { gte: requiredQuality },
    },
    orderBy: { priority: 'asc' },
  });

  for (const p of providers) {
    // Check if under daily limit
    if (p.todayUsed < p.maxRPD) {
      // Check if API key exists in env
      const apiKey = process.env[p.apiKeyEnv];
      if (apiKey) {
        return {
          id: p.id,
          name: p.name,
          displayName: p.displayName,
          baseUrl: p.baseUrl,
          model: p.model,
          apiKeyEnv: p.apiKeyEnv,
          maxRPM: p.maxRPM,
        };
      }
    }
  }

  // No provider available - try any enabled provider ignoring quality
  const fallback = await prisma.aIProvider.findFirst({
    where: { isEnabled: true },
    orderBy: { priority: 'asc' },
  });

  if (fallback && fallback.todayUsed < fallback.maxRPD && process.env[fallback.apiKeyEnv]) {
    return {
      id: fallback.id,
      name: fallback.name,
      displayName: fallback.displayName,
      baseUrl: fallback.baseUrl,
      model: fallback.model,
      apiKeyEnv: fallback.apiKeyEnv,
      maxRPM: fallback.maxRPM,
    };
  }

  return null;
}

// Increment the provider's daily usage counter
export async function incrementProviderUsage(providerId: string) {
  await prisma.aIProvider.update({
    where: { id: providerId },
    data: { todayUsed: { increment: 1 } },
  });
}
