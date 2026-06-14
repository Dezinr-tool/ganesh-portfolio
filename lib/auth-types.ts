export type EAUser = {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  subscriptionStatus: string;
  trialEndsAt: string;
  onboardingCompleted: boolean;
  createdAt: string;
  lastSeenAt: string;
};

export type UserRow = {
  id: string;
  email: string;
  name: string | null;
  password_hash: string;
  plan: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string;
  trial_ends_at: Date | string;
  onboarding_completed: boolean;
  created_at: Date | string;
  last_seen_at: Date | string;
};

export function rowToUser(row: UserRow): EAUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    plan: row.plan || "pro",
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    subscriptionStatus: row.subscription_status,
    trialEndsAt:
      row.trial_ends_at instanceof Date
        ? row.trial_ends_at.toISOString()
        : String(row.trial_ends_at),
    onboardingCompleted: row.onboarding_completed,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
    lastSeenAt:
      row.last_seen_at instanceof Date
        ? row.last_seen_at.toISOString()
        : String(row.last_seen_at),
  };
}

export function publicUser(user: EAUser) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    plan: user.plan,
    subscriptionStatus: user.subscriptionStatus,
    trialEndsAt: user.trialEndsAt,
    onboardingCompleted: user.onboardingCompleted,
  };
}

export function isOnTrial(user: EAUser): boolean {
  return new Date(user.trialEndsAt) > new Date();
}

/** Billing disabled — all users have full access. */
export function hasAccess(_user: EAUser): boolean {
  void _user;
  return true;
}
