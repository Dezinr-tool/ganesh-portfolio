// Deterministic secrets so auth helpers behave the same on every machine.
// Real values live in .env.local and are never read by the test suite.
process.env.DASHBOARD_PASSWORD ??= "test-dashboard-password";
process.env.EA_PASSWORD ??= "test-ea-password";
process.env.MOODBOARD_MEMORY_PASSWORD ??= "test-memory-password";
process.env.BRAIN_OWNER_TOKEN ??= "test-brain-owner-token";
process.env.NEXT_PUBLIC_SITE_URL ??= "http://localhost:3000";
