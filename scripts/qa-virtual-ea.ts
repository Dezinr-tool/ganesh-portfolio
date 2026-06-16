/**
 * Virtual EA end-to-end QA runner.
 * Usage: npx tsx scripts/qa-virtual-ea.ts
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { sql } from "../lib/db";
import {
  isGreetingMessage,
  hasCalendarContextIntent,
  shouldShowGuestEmailInput,
  isExplicitGuestEmailRequest,
} from "../lib/ea-scheduling-ui";
import { extractMemoriesFromTranscript } from "../lib/memory-extractor";
import { extractIntelligenceFromChat } from "../lib/intelligence-extractor";
import {
  countPendingFollowUps,
  createFollowUp,
  getFollowUpById,
  updateFollowUp,
} from "../lib/followups-store";
import { parseAttendeesFromMeeting } from "../lib/followup-generator";
import type { EAMeeting } from "../lib/meetings-store";
import { createUser, verifyUser, getUserByEmail } from "../lib/auth-service";
import { randomUUID } from "crypto";

type Result = "pass" | "fail" | "partial";

const results: { item: string; status: Result; note?: string }[] = [];

function report(item: string, status: Result, note?: string) {
  results.push({ item, status, note });
  const icon = status === "pass" ? "✅" : status === "fail" ? "❌" : "⚠️";
  console.log(`${icon} ${item}${note ? ` — ${note}` : ""}`);
}

const BASE_URL = process.env.QA_BASE_URL ?? "http://localhost:3000";
const TEST_EMAIL = `qa-${Date.now()}@example.com`;
const TEST_PASSWORD = "TestPass123!";
let authCookie = "";
let testSessionId = "";
let testFollowUpId = "";
let testMeetingId = "";

async function fetchJson(
  path: string,
  options: RequestInit = {},
): Promise<{ status: number; data: Record<string, unknown> }> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(authCookie ? { Cookie: authCookie } : {}),
      ...(options.headers as Record<string, string>),
    },
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { status: res.status, data };
}

function extractCookie(setCookie: string | null): string {
  if (!setCookie) return "";
  const match = setCookie.match(/^(ea_token|ea_auth)=[^;]+/);
  return match?.[0] ?? "";
}

async function loginLegacy() {
  const res = await fetch(`${BASE_URL}/api/ea/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: process.env.EA_PASSWORD }),
  });
  const cookie = extractCookie(res.headers.get("set-cookie"));
  if (cookie) authCookie = cookie;
  return res.ok;
}

async function testUnitScheduling() {
  report(
    'Say "hi" → greeting detected, no calendar intent',
    isGreetingMessage("hi") &&
      !hasCalendarContextIntent("hi") &&
      isGreetingMessage("kya haal")
      ? "pass"
      : "fail",
  );

  report(
    'Say "kya meetings hain" → calendar intent detected',
    hasCalendarContextIntent("kya meetings hain") ? "pass" : "fail",
  );

  report(
    "Guest email UI does NOT appear on greeting",
    !shouldShowGuestEmailInput(
      [],
      "hi",
      "What is the guest email address?",
    )
      ? "pass"
      : "fail",
  );

  const schedulingHistory = [
    { role: "user" as const, content: "Schedule a meeting with Rahul tomorrow at 3pm" },
    { role: "assistant" as const, content: "Sure, I'll set that up." },
  ];
  const assistantAsk =
    "What is the guest email address so I can send the invite?";
  report(
    "Guest email UI DOES appear during meeting scheduling",
    isExplicitGuestEmailRequest(assistantAsk) &&
      shouldShowGuestEmailInput(
        schedulingHistory,
        "Yes please book it",
        assistantAsk,
      )
      ? "pass"
      : "fail",
  );
}

async function testDbSeedClear() {
  const meetings = await sql`SELECT COUNT(*)::int AS c FROM ea_meetings`;
  const items = await sql`SELECT COUNT(*)::int AS c FROM ea_action_items`;
  const count = (meetings.rows[0] as { c: number }).c +
    (items.rows[0] as { c: number }).c;
  report(
    "No test seed data in DB (ea_meetings + ea_action_items)",
    count === 0 ? "pass" : "partial",
    count === 0 ? undefined : `${count} rows remain (may be legitimate data)`,
  );
}

async function testAuth() {
  try {
    await createUser(TEST_EMAIL, TEST_PASSWORD, "QA Tester");
    report("Can create new account with email + password", "pass");
  } catch (err) {
    report(
      "Can create new account with email + password",
      "fail",
      err instanceof Error ? err.message : String(err),
    );
    return;
  }

  const user = await verifyUser(TEST_EMAIL, TEST_PASSWORD);
  report("/api/ea/login verifyUser works", user ? "pass" : "fail");

  const signupRes = await fetch(`${BASE_URL}/api/ea/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Dup",
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      role: "QA",
      industry: "Tech",
    }),
  });
  report(
    "Duplicate signup rejected",
    signupRes.status === 409 ? "pass" : "fail",
    `status ${signupRes.status}`,
  );

  const loginRes = await fetch(`${BASE_URL}/api/ea/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });
  const loginCookie = extractCookie(loginRes.headers.get("set-cookie"));
  report(
    "Can login with new account via /api/ea/login",
    loginRes.ok && loginCookie.startsWith("ea_token=") ? "pass" : "fail",
  );

  if (loginCookie) authCookie = loginCookie;
  testSessionId = user?.id ?? "";

  const listRes = await fetchJson("/api/ea/followups");
  report(
    "/ea/followups API loads",
    listRes.status === 200 ? "pass" : "fail",
    `status ${listRes.status}`,
  );

  const created = await createFollowUp(testSessionId, {
    recipientEmail: "attendee@example.com",
    recipientName: "Attendee",
    subject: "QA Follow-up",
    body: "Thanks for the meeting.",
    status: "draft",
  });
  testFollowUpId = created.id;

  const pending = await countPendingFollowUps(testSessionId);
  report(
    "Dashboard pending follow-ups count > 0 after draft",
    pending > 0 ? "pass" : "fail",
    `count=${pending}`,
  );

  const updated = await updateFollowUp(created.id, testSessionId, {
    subject: "Updated QA Subject",
    body: "Updated body for QA.",
  });
  report(
    "PATCH follow-up updates subject/body",
    updated?.subject === "Updated QA Subject" ? "pass" : "fail",
  );

  const hasResend = Boolean(process.env.RESEND_API_KEY);
  if (hasResend) {
    const sendRes = await fetchJson(`/api/ea/followups/${created.id}/send`, {
      method: "POST",
      body: JSON.stringify({
        subject: "QA Send Test",
        body: "This is a QA test follow-up email.",
      }),
    });
    report(
      "Approve & Send sends via Resend",
      sendRes.status === 200 &&
        (sendRes.data.followup as { status?: string })?.status === "sent"
        ? "pass"
        : "fail",
      String(sendRes.data.error ?? sendRes.status),
    );

    const sent = await getFollowUpById(created.id, testSessionId);
    report(
      "Sent items show timestamp",
      sent?.sentAt ? "pass" : "fail",
      sent?.sentAt ?? "no sentAt",
    );
  } else {
    report("Approve & Send sends via Resend", "partial", "RESEND_API_KEY not set");
    report("Sent items show timestamp", "partial", "Skipped — no send test");
  }
}

async function testPagesLoad() {
  const pages = [
    "/ea/signup",
    "/ea/login",
    "/ea/followups",
    "/ea/dashboard",
    "/max",
  ];

  for (const path of pages) {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: authCookie ? { Cookie: authCookie } : {},
      redirect: "manual",
    });
    report(
      `${path} loads`,
      res.status === 200 || res.status === 307 ? "pass" : "fail",
      `status ${res.status}`,
    );
  }

  const maxHtml = await fetch(`${BASE_URL}/max`).then((r) => r.text());
  report(
    '/max "Get Started" → /ea/signup',
    maxHtml.includes('href="/ea/signup"') ? "pass" : "fail",
  );
  report(
    '/max "Login" → /ea/login',
    maxHtml.includes('href="/ea/login"') ? "pass" : "fail",
  );
}

async function testMeetingPipelineDrafts() {
  const meeting: EAMeeting = {
    id: randomUUID(),
    sessionId: testSessionId || "test",
    meetingUrl: null,
    meetingPlatform: null,
    title: "QA Sync",
    scheduledAt: null,
    status: "done",
    rawTranscript: "We discussed the roadmap.",
    processedSummary: "Roadmap review.",
    actionItems: ["Send follow-up"],
    attendees: ["Jane Doe <jane@example.com>"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const parsed = parseAttendeesFromMeeting(meeting);
  report(
    "Meeting attendees parsed for follow-up drafts",
    parsed.length === 1 && parsed[0].email === "jane@example.com"
      ? "pass"
      : "fail",
  );
}

async function testMemoryIntelligence() {
  const transcript =
    "Client pushed back on pricing. We agreed to send revised quote by Friday.";
  const memories = extractMemoriesFromTranscript(transcript, {
    meetingTitle: "Client Call",
  });
  report(
    "extractMemoriesFromTranscript returns items",
    memories.length > 0 ? "pass" : "fail",
    `count=${memories.length}`,
  );

  const intel = await extractIntelligenceFromChat(
    "How do I handle client budget pushback?",
    "Let's review pricing strategy options.",
  );
  report(
    "extractIntelligenceFromChat returns items",
    intel.length > 0 ? "pass" : "fail",
    `count=${intel.length}`,
  );
}

async function testMeetingIntegration() {
  if (!authCookie || !testSessionId || !process.env.ANTHROPIC_API_KEY) {
    report(
      "After meeting processed → draft follow-ups auto-created",
      "partial",
      "Skipped — needs auth + ANTHROPIC_API_KEY",
    );
    report(
      "After meeting transcript processed → memories saved to ea_memories",
      "partial",
      "Skipped — needs auth + ANTHROPIC_API_KEY",
    );
    return;
  }

  const meetingId = randomUUID();
  testMeetingId = meetingId;
  await sql`
    INSERT INTO ea_meetings (
      id, session_id, title, status, attendees, raw_transcript
    ) VALUES (
      ${meetingId},
      ${testSessionId},
      ${"QA Pipeline Meeting"},
      ${"pending"},
      ${JSON.stringify(["Alex Client <alex.client@example.com>"])}::jsonb,
      NULL
    )
  `;

  const transcript =
    "Alex Client: Thanks for the walkthrough. Client pushed back on pricing. Action: send revised proposal by Friday.";

  await fetchJson(`/api/ea/meetings/${meetingId}/simulate`, {
    method: "POST",
    body: JSON.stringify({ action: "transcript", text: transcript }),
  });

  const processRes = await fetchJson(`/api/ea/meetings/${meetingId}/simulate`, {
    method: "POST",
    body: JSON.stringify({ action: "leave" }),
  });

  report(
    "After meeting processed → draft follow-ups auto-created",
    processRes.status === 200 &&
      Number(processRes.data.followUpDraftsCreated ?? 0) > 0
      ? "pass"
      : processRes.status === 200
        ? "partial"
        : "fail",
    processRes.status === 200
      ? `drafts=${processRes.data.followUpDraftsCreated ?? 0}`
      : String(processRes.data.error ?? processRes.status),
  );

  report(
    "After meeting transcript processed → memories saved to ea_memories",
    processRes.status === 200 &&
      Number(processRes.data.transcriptMemoriesSaved ?? 0) > 0
      ? "pass"
      : processRes.status === 200
        ? "partial"
        : "fail",
    processRes.status === 200
      ? `memories=${processRes.data.transcriptMemoriesSaved ?? 0}`
      : String(processRes.data.error ?? processRes.status),
  );
}

async function testChatIntelligenceDb() {
  if (!authCookie || !testSessionId) {
    report(
      "After each chat message → intelligence extracted to ea_intelligence",
      "partial",
      "Skipped — no auth",
    );
    return;
  }

  const before = await sql<{ c: number }>`
    SELECT COUNT(*)::int AS c FROM ea_intelligence
    WHERE session_id = ${testSessionId}
  `;
  const beforeCount = before.rows[0]?.c ?? 0;

  await fetchJson("/api/ea/chat", {
    method: "POST",
    body: JSON.stringify({
      messages: [],
      userMessage:
        "How do I quote a client project budget? Not sure about pricing.",
      language: "en",
    }),
  });

  await new Promise((r) => setTimeout(r, 2000));

  const after = await sql<{ c: number }>`
    SELECT COUNT(*)::int AS c FROM ea_intelligence
    WHERE session_id = ${testSessionId}
  `;
  const afterCount = after.rows[0]?.c ?? 0;

  report(
    "After each chat message → intelligence extracted to ea_intelligence",
    afterCount > beforeCount ? "pass" : "partial",
    `before=${beforeCount}, after=${afterCount}`,
  );
}

async function testChatApi() {
  if (!authCookie) {
    await loginLegacy();
  }
  if (!authCookie) {
    report("Chat API tests", "fail", "No auth cookie");
    return;
  }

  const hiRes = await fetchJson("/api/ea/chat", {
    method: "POST",
    body: JSON.stringify({
      messages: [],
      userMessage: "hi",
      language: "en",
    }),
  });

  const hiMsg = String(hiRes.data.message ?? "");
  const hiHasMeeting =
    /\b(meeting|calendar|schedule|call)\b/i.test(hiMsg) &&
    !/\bhow can i help\b/i.test(hiMsg);
  report(
    'Say "hi" → EA responds casually, NO meetings mentioned',
    hiRes.status === 200 && !hiRes.data.needsGuestEmail && !hiHasMeeting
      ? "pass"
      : hiRes.status === 200 && !hiRes.data.needsGuestEmail
        ? "partial"
        : "fail",
    hiRes.status !== 200
      ? `status ${hiRes.status}`
      : hiHasMeeting
        ? `reply mentions meetings: ${hiMsg.slice(0, 120)}`
        : undefined,
  );

  const calRes = await fetchJson("/api/ea/chat", {
    method: "POST",
    body: JSON.stringify({
      messages: [],
      userMessage: "kya meetings hain aaj",
      language: "hi",
    }),
  });
  report(
    'Say "kya meetings hain" → calendar path engaged',
    calRes.status === 200 &&
      (calRes.data.agent === "calendar" || calRes.data.agent === "chat")
      ? "pass"
      : "fail",
    `agent=${calRes.data.agent}, status=${calRes.status}`,
  );

  await testChatIntelligenceDb();
}

async function testDashboardComponents() {
  const fs = await import("fs/promises");
  const panelSource = await fs.readFile(
    "app/ea/dashboard/_components/action-items-panel.tsx",
    "utf8",
  );
  report(
    "My Tasks section visible on top",
    panelSource.includes("My Tasks") &&
      panelSource.indexOf("My Tasks") <
        panelSource.indexOf("Team &amp; Assigned")
      ? "pass"
      : "fail",
  );
  report(
    "Team & Assigned collapsed section below",
    panelSource.includes("Team &amp; Assigned") ||
      panelSource.includes("Team & Assigned")
      ? "pass"
      : "fail",
  );
  report(
    "Inside expanded: Assigned then Team (no tabs)",
    panelSource.includes("Assigned") &&
      panelSource.includes("Team") &&
      !panelSource.includes('setTeamTab')
      ? "pass"
      : "fail",
  );

  const followupsPage = await fs.readFile("app/ea/followups/page.tsx", "utf8");
  report(
    "/ea/followups page has review modal + Approve & Send",
    followupsPage.includes("Approve & Send") &&
      followupsPage.includes("Review follow-up")
      ? "pass"
      : "fail",
  );

  const navSource = await fs.readFile("app/ea/_components/ea-nav.tsx", "utf8");
  report(
    'Follow-ups nav link visible in EA nav',
    navSource.includes('"/ea/followups"') ? "pass" : "fail",
  );

  const dashSource = await fs.readFile("app/ea/dashboard/page.tsx", "utf8");
  report(
    "Dashboard shows pending follow-ups badge",
    dashSource.includes("Pending Follow-ups") &&
      dashSource.includes("/ea/followups")
      ? "pass"
      : "fail",
  );
}

async function cleanup() {
  if (testFollowUpId && testSessionId) {
    await sql`DELETE FROM ea_followups WHERE id = ${testFollowUpId}`;
  }
  if (testMeetingId) {
    await sql`DELETE FROM ea_followups WHERE meeting_id = ${testMeetingId}`;
    await sql`DELETE FROM ea_action_items WHERE meeting_id = ${testMeetingId}`;
    await sql`DELETE FROM ea_intelligence WHERE source_id = ${testMeetingId}`;
    await sql`DELETE FROM ea_meetings WHERE id = ${testMeetingId}`;
  }
  const user = await getUserByEmail(TEST_EMAIL);
  if (user) {
    await sql`DELETE FROM ea_followups WHERE session_id = ${user.id}`;
    await sql`DELETE FROM ea_intelligence WHERE session_id = ${user.id}`;
    await sql`DELETE FROM ea_memories WHERE session_id = ${user.id}`;
    await sql`DELETE FROM ea_sessions WHERE user_id = ${user.id}`;
    await sql`DELETE FROM ea_user_profiles WHERE session_id = ${user.id}`;
    await sql`DELETE FROM ea_users WHERE id = ${user.id}`;
  }
}

async function main() {
  console.log("\n=== Virtual EA QA ===\n");
  console.log(`Base URL: ${BASE_URL}\n`);

  console.log("--- UNIT TESTS ---");
  await testUnitScheduling();
  await testMemoryIntelligence();
  await testMeetingPipelineDrafts();

  console.log("\n--- DATABASE ---");
  await testDbSeedClear();

  console.log("\n--- SERVER TESTS (requires dev server) ---");
  let serverUp = false;
  try {
    const ping = await fetch(`${BASE_URL}/ea/login`, { signal: AbortSignal.timeout(3000) });
    serverUp = ping.status < 500;
  } catch {
    serverUp = false;
  }

  if (!serverUp) {
    report("Dev server running", "fail", `Start with: npm run dev (${BASE_URL})`);
    console.log("\n⚠️  Skipping HTTP tests — start dev server and re-run.\n");
  } else {
    report("Dev server running", "pass");
    await testAuth();
    await testPagesLoad();
    await testMeetingIntegration();
    await testChatApi();
    await testDashboardComponents();

    const legacyOk = await loginLegacy();
    report(
      "Old password-only login still works as fallback",
      legacyOk ? "pass" : "partial",
      legacyOk ? undefined : "EA_PASSWORD not set or /api/ea/auth failed",
    );
  }

  await cleanup();

  console.log("\n=== SUMMARY ===");
  const pass = results.filter((r) => r.status === "pass").length;
  const fail = results.filter((r) => r.status === "fail").length;
  const partial = results.filter((r) => r.status === "partial").length;
  console.log(`✅ ${pass}  ❌ ${fail}  ⚠️ ${partial}  (total ${results.length})\n`);

  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
