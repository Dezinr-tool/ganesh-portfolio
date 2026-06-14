import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const BASE = process.env.QA_BASE_URL ?? "http://localhost:3000";
const EA_PASSWORD = process.env.EA_PASSWORD;

type CheckResult = { name: string; ok: boolean; detail: string };

const results: CheckResult[] = [];

function record(name: string, ok: boolean, detail: string) {
  results.push({ name, ok, detail });
  const icon = ok ? "✅" : "❌";
  console.log(`${icon} ${name}: ${detail}`);
}

async function main() {
  if (!EA_PASSWORD) {
    console.error("EA_PASSWORD missing from .env.local");
    process.exit(1);
  }

  const authRes = await fetch(`${BASE}/api/ea/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: EA_PASSWORD }),
  });
  const authCookie = authRes.headers.get("set-cookie")?.split(";")[0] ?? "";
  record(
    "EA auth",
    authRes.ok && authCookie.startsWith("ea_auth="),
    authRes.ok ? "session cookie received" : `status ${authRes.status}`,
  );

  if (!authRes.ok) {
    printSummary();
    process.exit(1);
  }

  const headers = {
    Cookie: authCookie,
    "Content-Type": "application/json",
  };

  const getEmpty = await fetch(`${BASE}/api/ea/memory?limit=20`, { headers });
  const getEmptyData = await getEmpty.json();
  record(
    "GET /api/ea/memory",
    getEmpty.ok && Array.isArray(getEmptyData.memories),
    getEmpty.ok
      ? `count=${getEmptyData.count}, items=${getEmptyData.memories.length}`
      : `status ${getEmpty.status}`,
  );

  const testContent = `QA memory ${Date.now()} — remember that I prefer morning meetings`;
  const postRes = await fetch(`${BASE}/api/ea/memory`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      content: testContent,
      category: "instruction",
      source: "manual",
      importance: 9,
    }),
  });
  const postData = await postRes.json();
  record(
    "POST /api/ea/memory",
    postRes.status === 201 && postData.saved === true && Boolean(postData.id),
    postRes.ok ? `id=${postData.id}, count=${postData.count}` : `status ${postRes.status}`,
  );

  const getAfter = await fetch(`${BASE}/api/ea/memory?limit=20`, { headers });
  const getAfterData = await getAfter.json();
  const found = (getAfterData.memories as { content: string }[] | undefined)?.some(
    (m) => m.content === testContent,
  );
  record(
    "Memory persisted in DB",
    getAfter.ok && found === true,
    found ? "saved memory returned on GET" : "memory not found after POST",
  );

  const dupRes = await fetch(`${BASE}/api/ea/memory`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      content: testContent,
      category: "instruction",
      source: "manual",
      importance: 9,
    }),
  });
  const dupData = await dupRes.json();
  record(
    "Duplicate memory deduped",
    dupRes.ok && dupData.id === postData.id,
    dupRes.ok ? `same id=${dupData.id}` : `status ${dupRes.status}`,
  );

  const profileRes = await fetch(`${BASE}/api/ea/profile`, { headers });
  const profileData = await profileRes.json();
  record(
    "GET /api/ea/profile",
    profileRes.ok && profileData.profile?.name,
    profileRes.ok
      ? `needsOnboarding=${profileData.needsOnboarding}`
      : `status ${profileRes.status}`,
  );

  printSummary();
  process.exit(results.every((r) => r.ok) ? 0 : 1);
}

function printSummary() {
  const failed = results.filter((r) => !r.ok).length;
  console.log();
  if (failed === 0) {
    console.log(`All ${results.length} checks passed ✅`);
  } else {
    console.log(`${failed}/${results.length} checks failed ❌`);
  }
}

main().catch((error) => {
  console.error("QA script failed:", error);
  process.exit(1);
});
