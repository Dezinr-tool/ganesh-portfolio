import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { sql } from "@/lib/db";
import {
  rowToUser,
  type EAUser,
  type UserRow,
} from "@/lib/auth-types";

export {
  rowToUser,
  publicUser,
  isOnTrial,
  hasAccess,
  type EAUser,
  type UserRow,
} from "@/lib/auth-types";

export {
  createSession,
  getSessionUser,
  deleteSession,
} from "@/lib/session-service";

export async function createUser(
  email: string,
  password: string,
  name: string,
): Promise<EAUser> {
  const hash = await bcrypt.hash(password, 10);
  const id = randomUUID();

  await sql`
    INSERT INTO ea_users (id, email, password_hash, name, plan)
    VALUES (${id}, ${email.toLowerCase()}, ${hash}, ${name}, 'pro')
  `;

  const { rows } = await sql<UserRow>`
    SELECT * FROM ea_users WHERE id = ${id} LIMIT 1
  `;

  return rowToUser(rows[0]);
}

export async function verifyUser(
  email: string,
  password: string,
): Promise<EAUser | null> {
  const { rows } = await sql<UserRow>`
    SELECT * FROM ea_users WHERE email = ${email.toLowerCase()} LIMIT 1
  `;

  if (rows.length === 0) return null;

  const user = rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return null;

  await sql`UPDATE ea_users SET last_seen_at = NOW() WHERE id = ${user.id}`;

  return rowToUser(user);
}

export async function getUserByEmail(email: string): Promise<EAUser | null> {
  const { rows } = await sql<UserRow>`
    SELECT * FROM ea_users WHERE email = ${email.toLowerCase()} LIMIT 1
  `;
  return rows[0] ? rowToUser(rows[0]) : null;
}

export async function markOnboardingComplete(userId: string): Promise<void> {
  await sql`
    UPDATE ea_users SET onboarding_completed = TRUE WHERE id = ${userId}
  `;
}

export async function updateUserPlan(
  userId: string,
  data: {
    plan?: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionStatus?: string;
  },
): Promise<void> {
  const user = await getUserById(userId);
  if (!user) return;

  await sql`
    UPDATE ea_users
    SET
      plan = ${data.plan ?? user.plan},
      stripe_customer_id = ${data.stripeCustomerId ?? user.stripeCustomerId},
      stripe_subscription_id = ${data.stripeSubscriptionId ?? user.stripeSubscriptionId},
      subscription_status = ${data.subscriptionStatus ?? user.subscriptionStatus}
    WHERE id = ${userId}
  `;
}

export async function getUserById(userId: string): Promise<EAUser | null> {
  const { rows } = await sql<UserRow>`
    SELECT * FROM ea_users WHERE id = ${userId} LIMIT 1
  `;
  return rows[0] ? rowToUser(rows[0]) : null;
}
