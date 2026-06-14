# QA_SKILL — Self-Healing QA Agent
# Drop this file in any project root. Use in Cursor Agent mode.
# Generic + reusable — works for any Next.js product.
# Last updated: P1 + P2 + P3 + P4 + P5 coverage

---

## ROLE
You are a senior QA engineer and developer combined.
Your job: read the PRD, test every feature against it, fix what's broken, re-test until all pass.
You work autonomously. You do not ask for confirmation. You do not stop early.

---

## CORE RULES
1. Always run `npm run build` after every fix — must pass before moving on
2. If a fix breaks something else — revert, try a different approach
3. Log everything in PROGRESS.md (append only, never overwrite)
4. Never delete working code — only extend or fix
5. If stuck on one issue for more than 15 min — skip it, mark ⚠️, move on
6. Priority order: build errors → auth → core feature → secondary features
7. At the end — write a final QA report in PROGRESS.md

---

## TESTING METHOD

For every PRD checklist item:

### Step 1 — Read
Find the relevant source file(s) for this feature.
Understand the current implementation.

### Step 2 — Verify
Check if the code matches what the PRD requires.
Trace the logic — not just "file exists" but "does it actually do the thing?"

### Step 3 — Fix if needed
If missing: implement it.
If wrong: fix it.
If broken: debug and patch.

### Step 4 — Build check
Run `npm run build` — confirm 0 new errors introduced.

### Step 5 — Log
Append to PROGRESS.md:
- What you checked
- What you found
- What you fixed (if anything)
- Build status after fix

---

## PROGRESS.md FORMAT

Append this block after every task:

```
## QA Run — {date} {time}

### ✅ Confirmed working
- feature name — how you verified it

### 🔧 Fixed this session
- what was broken
- what fix was applied
- build status after fix

### ⚠️ Skipped / needs human
- feature — why skipped or why it needs browser/device test

### ❌ Could not fix
- feature — root cause — what was attempted

### 📋 Next steps
- recommended actions for next session
```

---

## ESCALATION RULES
These situations require human review — flag in PROGRESS.md and skip:

- Anything requiring real browser interaction (OAuth flows, audio playback)
- Environment variables or secrets needed
- Third-party API behaviour (rate limits, auth errors)
- Database migrations that could destroy data
- Anything touching payment or auth logic that can't be unit-tested
- Playwright browser automation (needs local browser env)
- Real device testing (iPhone/Android voice, PWA install)

---

## HOW TO USE THIS SKILL

### Every run:
Paste this in Cursor Agent mode:
```
Read QA_SKILL.md in the project root.
Follow the role, rules, and testing method defined there.
Work through the entire PRD checklist autonomously.
Fix issues, run builds, log everything in PROGRESS.md.
Do not stop until all items are attempted.
```

### Adding new features:
Just add a checkbox line to the relevant phase section below.
Agent will automatically include it next run.

---

## PRD CHECKLIST — Max Virtual EA

---

### BUILD HEALTH (check first, always)
- [ ] `npm run build` passes with 0 errors
- [ ] `npm run lint` passes with 0 errors
- [ ] No console.log statements in production API routes
- [ ] No hardcoded secrets or API keys in code
- [ ] All new files follow existing project conventions (lib/ not src/lib/)

---

### P1 — AUTH
- [ ] /ea route is password protected
- [ ] Wrong password shows error message
- [ ] Correct password sets cookie and redirects to /ea/chat
- [ ] Cookie persists across browser refresh
- [ ] Unauthenticated access to /ea/* redirects to login

---

### P1 — CHAT
- [ ] User message gets response from claude-haiku-4-5-20251001
- [ ] System prompt includes today's date dynamically
- [ ] Only last 10 messages sent in history (HISTORY_LIMIT = 10)
- [ ] Prompt caching enabled — cache_control ephemeral on system prompt
- [ ] Response time under 4 seconds for simple messages
- [ ] Hinglish messages handled naturally
- [ ] Agent router used — logs which agent handled request
- [ ] API response includes agent field

---

### P1 — VOICE INPUT
- [ ] Microphone button visible on chat page
- [ ] Click starts Web Speech API recognition
- [ ] Recognized text populates input field
- [ ] Works in Chrome desktop (flag as needs-browser-test)

---

### P1 — VOICE OUTPUT
- [ ] ElevenLabs TTS plays Max responses
- [ ] Mobile: "Tap to enable voice" banner shows on first load
- [ ] AudioContext.resume() called after user tap
- [ ] userGestureRef gates autoplay correctly
- [ ] Graceful fallback if ElevenLabs API fails
- [ ] "Tap to hear" fallback button per message retained

---

### P1 — GOOGLE CALENDAR
- [ ] OAuth tokens stored in Neon DB (not filesystem)
- [ ] Calendar API only called when needsCalendarData() returns true
- [ ] CALENDAR_TRIGGERS includes EN + HI keywords
- [ ] Max can read today's events
- [ ] Max can create event with Google Meet link
- [ ] Calendar data cached 5 minutes via lib/calendarCache.ts
- [ ] getCached() and setCache() exported from calendarCache.ts

---

### P1 — CONVERSATION PERSISTENCE
- [ ] ea_conversations table exists in Neon DB
- [ ] Every message (user + assistant) saved on each turn
- [ ] Last 20 messages loaded from DB on page open
- [ ] session_id tied to ea_auth cookie
- [ ] GET /api/ea/conversations returns messages for session
- [ ] Conversation reset endpoint exists (DELETE or POST /clear)
- [ ] /clear returns { cleared: true, count: number }

---

### P1 — AGENT ROUTER
- [ ] lib/agents/router.ts exists
- [ ] routeMessage() exported and used in /api/ea/chat
- [ ] AGENTS registry has: calendar, chat, meeting_analysis
- [ ] calendar agent uses claude-haiku-4-5-20251001
- [ ] meeting_analysis agent uses claude-sonnet-4-6
- [ ] chat agent uses claude-haiku-4-5-20251001
- [ ] Router logs agent name per request

---

### P1 — PWA
- [ ] manifest.json has correct name, icons, start_url
- [ ] App installable on iPhone (flag as needs-device-test)
- [ ] Basic UI works offline (flag as needs-browser-test)

---

### P1 — DASHBOARD
- [ ] /ea/dashboard loads without error
- [ ] Shows today's meeting count
- [ ] Shows next meeting name and time

---

### P2 — CALENDAR INTELLIGENCE
- [ ] Conflict detection checks +/- 30 min before scheduling
- [ ] Conflict warning returned to model before confirming new event
- [ ] /api/ea/briefing endpoint exists
- [ ] Briefing returns: event count, first event, conflicts, summary
- [ ] Briefing triggered by: "aaj kya hai", "brief karo", "today"
- [ ] lib/calendarCache.ts with 5-min TTL working

---

### P3 — MEETING BOT FOUNDATION
- [ ] ea_meetings table exists in Neon DB with correct schema
- [ ] ea_action_items table exists in Neon DB
- [ ] lib/meeting-detector.ts exports detectMeetingLinks()
- [ ] detectMeetingLinks() identifies google_meet / zoom / teams URLs
- [ ] GET /api/ea/meetings returns array for session
- [ ] POST /api/ea/meetings creates a meeting record
- [ ] GET /api/ea/meetings/[id] returns meeting details
- [ ] PATCH /api/ea/meetings/[id] updates status/transcript/summary
- [ ] POST /api/ea/meetings/[id]/simulate works (join/transcript/leave)
- [ ] POST /api/ea/meetings/[id]/process calls claude-sonnet-4-6
- [ ] Process route extracts: summary, action items, decisions, attendees
- [ ] Process route saves to ea_meetings and ea_action_items
- [ ] meeting_analysis agent wired into /api/ea/process-meeting
- [ ] app/ea/meetings/page.tsx loads without error
- [ ] Meetings page shows: title, time, status badge, platform
- [ ] Past meetings show "View summary" button
- [ ] Status badges: pending/recording/processing/done/failed

---

### P4 — WHISPER TRANSCRIPTION
- [ ] lib/transcription.ts exists
- [ ] transcribeAudio() exported from lib/transcription.ts
- [ ] formatTranscriptForAI() exported from lib/transcription.ts
- [ ] Graceful fallback if OPENAI_API_KEY missing
- [ ] POST /api/ea/meetings/[id]/transcript accepts audio upload
- [ ] Validates file size under 25MB
- [ ] Validates audio format (webm, mp4, m4a, wav)
- [ ] Transcript saved to ea_meetings.raw_transcript
- [ ] Process route triggered automatically after transcript save
- [ ] Manual transcript paste option exists in meetings/[id] page
- [ ] GET /api/ea/action-items returns open items for session
- [ ] PATCH /api/ea/action-items/[id] marks item done/cancelled
- [ ] Dashboard shows open action items count

---

### P5 — AI MEMORY
- [ ] pgvector extension enabled in Neon DB
- [ ] ea_memories table exists with correct schema
- [ ] Index on session_id exists
- [ ] lib/memory-store.ts exports: saveMemory, getRecentMemories, searchMemories, deleteMemory, clearMemories
- [ ] GET /api/ea/memory returns memories for session
- [ ] POST /api/ea/memory saves a memory
- [ ] DELETE /api/ea/memory clears all memories for session
- [ ] DELETE /api/ea/memory/[id] deletes single memory
- [ ] lib/memory-extractor.ts exports extractMemoriesFromMessage()
- [ ] Extractor detects: "remember that" — saves as instruction (importance 9)
- [ ] Extractor detects: preference signals — saves as preference (importance 8)
- [ ] Extractor detects: personal facts — saves as fact (importance 7)
- [ ] Chat route injects top 5 memories into system prompt
- [ ] Memory injection section under 200 tokens
- [ ] Auto-save runs after each chat turn via after() hook
- [ ] Memory count badge visible in chat UI
- [ ] Settings page has memory section (list + clear + add)
- [ ] Memories persist across sessions (tied to session_id)