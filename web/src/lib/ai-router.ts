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

export interface ProviderStatus {
  name: string;
  displayName: string;
  isEnabled: boolean;
  todayUsed: number;
  maxRPD: number;
  percentUsed: number;
  quality: number;
}

export type AlertLevel = 'ok' | 'warning' | 'critical' | 'exhausted';

export interface AIAlert {
  level: AlertLevel;
  message: string;
  providers: ProviderStatus[];
  totalUsed: number;
  totalCapacity: number;
  percentUsed: number;
}

// ==================== BALANCED ROUND-ROBIN ====================
// Instead of draining one provider then moving to next,
// distribute requests proportionally across providers of similar quality.
// This reduces quality discrepancy for users.

export async function selectProvider(userPlan: UserPlan): Promise<ProviderInfo | null> {
  const qualityConfig = await prisma.aIConfig.findUnique({ where: { key: 'minQualityPerPlan' } });
  const minQuality = qualityConfig?.value as Record<string, number> | undefined;
  const requiredQuality = minQuality?.[userPlan] ?? 1;

  // Reset daily counters if new day
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  await prisma.aIProvider.updateMany({
    where: { lastResetAt: { lt: todayStart } },
    data: { todayUsed: 0, lastResetAt: now },
  });

  // Get all enabled providers that meet quality requirements
  const providers = await prisma.aIProvider.findMany({
    where: {
      isEnabled: true,
      quality: { gte: requiredQuality },
    },
    orderBy: { priority: 'asc' },
  });

  // Filter to those with API keys and remaining quota
  const available = providers.filter(p => {
    const hasKey = !!process.env[p.apiKeyEnv];
    const hasQuota = p.todayUsed < p.maxRPD;
    return hasKey && hasQuota;
  });

  if (available.length === 0) {
    // Fallback: try any enabled provider ignoring quality
    const fallback = await prisma.aIProvider.findFirst({
      where: { isEnabled: true },
      orderBy: { priority: 'asc' },
    });
    if (fallback && fallback.todayUsed < fallback.maxRPD && process.env[fallback.apiKeyEnv]) {
      return toProviderInfo(fallback);
    }
    return null;
  }

  // Balanced selection: pick the provider with the LOWEST usage percentage
  // This naturally distributes load across providers proportionally to their capacity
  const selected = available.reduce((best, current) => {
    const bestPercent = best.todayUsed / best.maxRPD;
    const currentPercent = current.todayUsed / current.maxRPD;
    // If similar usage %, prefer higher quality; if tied, prefer lower priority number
    if (Math.abs(bestPercent - currentPercent) < 0.05) {
      if (current.quality > best.quality) return current;
      if (current.quality === best.quality && current.priority < best.priority) return current;
      return best;
    }
    return currentPercent < bestPercent ? current : best;
  });

  return toProviderInfo(selected);
}

// Select a provider excluding specific ones (for fallback retry)
export async function selectProviderExcluding(userPlan: UserPlan, excludeNames: string[]): Promise<ProviderInfo | null> {
  const providers = await prisma.aIProvider.findMany({
    where: {
      isEnabled: true,
      name: { notIn: excludeNames },
    },
    orderBy: { priority: 'asc' },
  });

  const available = providers.filter(p => {
    const hasKey = !!process.env[p.apiKeyEnv];
    const hasQuota = p.todayUsed < p.maxRPD;
    return hasKey && hasQuota;
  });

  if (available.length === 0) return null;

  // Pick lowest usage percentage
  const selected = available.reduce((best, current) => {
    const bestPercent = best.todayUsed / best.maxRPD;
    const currentPercent = current.todayUsed / current.maxRPD;
    return currentPercent < bestPercent ? current : best;
  });

  return toProviderInfo(selected);
}

function toProviderInfo(p: { id: string; name: string; displayName: string; baseUrl: string; model: string; apiKeyEnv: string; maxRPM: number }): ProviderInfo {
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

// ==================== USAGE TRACKING ====================

export async function incrementProviderUsage(providerId: string) {
  await prisma.aIProvider.update({
    where: { id: providerId },
    data: { todayUsed: { increment: 1 } },
  });
}

// ==================== ALERT SYSTEM ====================
// Called by admin API to show real-time status

export async function getAIAlerts(): Promise<AIAlert> {
  const providers = await prisma.aIProvider.findMany({ orderBy: { priority: 'asc' } });

  const statuses: ProviderStatus[] = providers.map(p => ({
    name: p.name,
    displayName: p.displayName,
    isEnabled: p.isEnabled,
    todayUsed: p.todayUsed,
    maxRPD: p.maxRPD,
    percentUsed: p.maxRPD > 0 ? Math.round((p.todayUsed / p.maxRPD) * 100) : 0,
    quality: p.quality,
  }));

  const enabledProviders = statuses.filter(p => p.isEnabled);
  const totalUsed = enabledProviders.reduce((sum, p) => sum + p.todayUsed, 0);
  const totalCapacity = enabledProviders.reduce((sum, p) => sum + p.maxRPD, 0);
  const percentUsed = totalCapacity > 0 ? Math.round((totalUsed / totalCapacity) * 100) : 0;

  // Determine alert level
  const exhaustedCount = enabledProviders.filter(p => p.percentUsed >= 100).length;
  const criticalCount = enabledProviders.filter(p => p.percentUsed >= 90).length;
  const warningCount = enabledProviders.filter(p => p.percentUsed >= 70).length;

  let level: AlertLevel = 'ok';
  let message = `IA operando normalmente. ${totalUsed}/${totalCapacity} requests hoje (${percentUsed}%)`;

  if (exhaustedCount === enabledProviders.length) {
    level = 'exhausted';
    message = `TODOS os providers esgotados! IA offline. ${totalUsed}/${totalCapacity} requests.`;
  } else if (exhaustedCount > 0 || criticalCount >= enabledProviders.length - 1) {
    level = 'critical';
    message = `${exhaustedCount} provider(s) esgotado(s), ${criticalCount} em estado crítico. ${totalUsed}/${totalCapacity} requests (${percentUsed}%)`;
  } else if (warningCount > 0 || percentUsed >= 60) {
    level = 'warning';
    message = `Uso elevado: ${percentUsed}% da capacidade. ${warningCount} provider(s) acima de 70%.`;
  }

  return { level, message, providers: statuses, totalUsed, totalCapacity, percentUsed };
}
