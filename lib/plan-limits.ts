export const LIMITS = {
  free: {
    messagesPerDay: 20,
    meetingsPerMonth: 5,
    followupsPerMonth: 10,
    memoryItems: 50,
    voiceOutput: false,
  },
  starter: {
    messagesPerDay: 100,
    meetingsPerMonth: 20,
    followupsPerMonth: 50,
    memoryItems: 500,
    voiceOutput: true,
  },
  pro: {
    messagesPerDay: -1,
    meetingsPerMonth: -1,
    followupsPerMonth: -1,
    memoryItems: -1,
    voiceOutput: true,
  },
} as const;

export type PlanKey = keyof typeof LIMITS;

/** Billing disabled — all users treated as pro (unlimited). */
export const DEFAULT_PLAN: PlanKey = "pro";

export function normalizePlan(_plan: string): PlanKey {
  void _plan;
  return DEFAULT_PLAN;
}

export function checkLimit(
  _plan: PlanKey,
  _feature: keyof typeof LIMITS.free,
  currentUsage: number,
): { allowed: boolean; limit: number; usage: number } {
  void _plan;
  void _feature;
  return { allowed: true, limit: -1, usage: currentUsage };
}
