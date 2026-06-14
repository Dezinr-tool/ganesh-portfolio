# Max Virtual EA — Autonomous Build Task 2
# Cursor Agent mode. Work independently. Do not stop for confirmation.
# This will take 2-3 hours. Keep going until all tasks are attempted.

## CONTEXT
Project: Max Virtual EA at designbyganesh.com/ea
Stack: Next.js 14, Tailwind, Neon DB, Vercel, Anthropic API
Completed: P1 fixes, Agent Router, P2 Calendar Intelligence
Now building: P3 (Meeting Bot foundation) + P4 (Whisper Transcription) + QA pass

## WORKING RULES
- Complete one task fully before next
- Run `npm run build` after every task — fix errors before moving on
- Fix pre-existing ESLint errors if you encounter them while in the file
- Log all progress in PROGRESS.md (append only)
- If stuck >15 min on one thing — skip, mark ⚠️, move on
- Never break working features — always test build after changes
- At the end — run full QA checklist and write final report

---

## TASK 1 — Fix Pre-existing Issues (30 min)

### 1a. Fix ESLint errors
Run: `npm run lint`
Find the 8 pre-existing errors in EA/dashboard files.
Fix each one — common patterns:
- `react-hooks/exhaustive-deps` — add missing deps or wrap in useCallback
- `react-hooks/rules-of-hooks` — move hooks to top level
- ref-during-render — move to useEffect
Run lint again after — confirm 0 errors.

### 1b. Wire meeting_analysis agent
File: `app/api/ea/process-meeting/route.ts`
This route likely exists but isn't using the router.
Update it to use `meeting_analysis` agent from `lib/agents/router.ts`
Use `claude-sonnet-4-6` model for this route (already defined in AGENTS registry)

### 1c. Add conversation reset endpoint
Create: `app/api/ea/conversations/clear/route.ts`
- DELETE method
- Clears ea_conversations for current session_id from ea_auth cookie
- Returns { cleared: true, count: number }
Add a "Clear history" button to chat settings or as a slash command (/clear)

**Build check:** `npm run build` must pass ✅

---

## TASK 2 — P3 Meeting Bot Foundation (60-90 min)

Note: Full Playwright browser automation needs human setup of browser env.
Build the architecture and API layer now. Mark browser-specific parts for human review.

### 2a. Meeting bot data model
Create Neon DB table via `scripts/init-meeting-tables.ts`:

```sql
CREATE TABLE IF NOT EXISTS ea_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  meeting_url TEXT,
  meeting_platform TEXT, -- 'google_meet' | 'zoom' | 'teams'
  title TEXT,
  scheduled_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending', -- pending | joining | recording | processing | done | failed
  raw_transcript TEXT,
  processed_summary TEXT,
  action_items JSONB DEFAULT '[]',
  attendees JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ea_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES ea_meetings(id),
  session_id TEXT NOT NULL,
  title TEXT NOT NULL,
  assignee TEXT,
  due_date TIMESTAMPTZ,
  status TEXT DEFAULT 'open', -- open | done | cancelled
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Run the script: `npx ts-node scripts/init-meeting-tables.ts`

### 2b. Meeting detection from calendar
File: `lib/meeting-detector.ts`
Create function `detectMeetingLinks(events: CalendarEvent[])`:
- Scans Google Calendar events for Meet/Zoom/Teams links
- Returns array of { meetingUrl, platform, title, scheduledAt, eventId }
- Platform detection:
  - meet.google.com → 'google_meet'
  - zoom.us → 'zoom'
  - teams.microsoft.com → 'teams'

### 2c. Meeting bot API routes
Create: `app/api/ea/meetings/route.ts`
- GET — list all meetings for session (from ea_meetings table)
- POST — manually add a meeting { meetingUrl, title, scheduledAt }

Create: `app/api/ea/meetings/[id]/route.ts`
- GET — get single meeting with transcript + action items
- PATCH — update meeting status, transcript, summary

Create: `app/api/ea/meetings/[id]/process/route.ts`
- POST — triggers AI processing of raw transcript
- Uses meeting_analysis agent (claude-sonnet-4-6)
- Extracts: summary, action items, key decisions, attendees
- Saves to ea_meetings and ea_action_items tables
- Returns processed result

### 2d. Bot status simulation (for testing without real browser)
Create: `app/api/ea/meetings/[id]/simulate/route.ts`
- POST with body { action: 'join' | 'transcript' | 'leave' }
- 'join' → sets status to 'recording'
- 'transcript' → accepts { text: string }, saves to raw_transcript, sets status 'processing'
- 'leave' → triggers process route, sets status 'done'
This lets us test the full pipeline without Playwright

### 2e. Meetings page
Create: `app/ea/meetings/page.tsx`
- List all meetings (upcoming + past)
- Each meeting shows: title, time, status badge, platform icon
- Past meetings show: "View summary" button → opens transcript + action items
- Status badges: pending (gray), recording (red pulse), processing (amber), done (green)
- Empty state: "No meetings yet. Max will detect them from your calendar."
- Add meeting manually button → simple form (URL + title + time)

**Build check:** `npm run build` must pass ✅

---

## TASK 3 — P4 Whisper Transcription Layer (45 min)

Note: Actual Whisper inference needs GPU server. Build the API contract and processing pipeline.
Use OpenAI Whisper API as interim solution (same API shape as self-hosted).

### 3a. Transcription service
Create: `lib/transcription.ts`

```typescript
export type TranscriptionResult = {
  text: string
  language: string
  duration: number
  segments: Array<{
    start: number
    end: number
    text: string
  }>
}

export async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string = 'audio/webm'
): Promise<TranscriptionResult> {
  // Uses OpenAI Whisper API (whisper-1 model)
  // Falls back to empty transcript with error flag if API fails
  // Add OPENAI_API_KEY to .env.local if available
  // If key missing — return mock transcript for development
}

export function formatTranscriptForAI(result: TranscriptionResult): string {
  // Returns clean text with timestamps for AI processing
  // Format: [00:00] Speaker text here
}
```

### 3b. Audio upload endpoint
Create: `app/api/ea/meetings/[id]/transcript/route.ts`
- POST — accepts multipart/form-data with audio file
- Validates: file size <25MB, audio format (webm, mp4, m4a, wav)
- Calls transcribeAudio()
- Saves raw_transcript to ea_meetings
- Triggers /process route automatically
- Returns { transcript, meetingId, processingStarted: true }

### 3c. Manual transcript input
Update meetings/[id] page:
- Add "Paste transcript" option (text area) for meetings without audio
- Submits to transcript route with text directly (skips Whisper)
- Useful for copy-pasting Zoom/Meet auto-captions

### 3d. Action items dashboard
Create: `app/api/ea/action-items/route.ts`
- GET — all open action items for session, sorted by due_date
- PATCH /:id — mark as done/cancelled

Update dashboard page:
- Add "Action items" section showing open items count
- Link to meetings page

**Build check:** `npm run build` must pass ✅

---

## TASK 4 — Full QA Pass (30 min)

Read QA_SKILL.md and run through the full checklist.
Test every item — confirm working in code, flag what needs browser test.

Additionally test these new items:

### New checklist — P3/P4:
- [ ] ea_meetings table exists in Neon DB
- [ ] ea_action_items table exists in Neon DB
- [ ] GET /api/ea/meetings returns array (empty ok)
- [ ] POST /api/ea/meetings creates a meeting record
- [ ] GET /api/ea/meetings/[id] returns meeting details
- [ ] POST /api/ea/meetings/[id]/simulate with action:'transcript' saves text
- [ ] POST /api/ea/meetings/[id]/process calls claude-sonnet-4-6 and returns summary
- [ ] POST /api/ea/meetings/[id]/transcript accepts audio upload
- [ ] lib/transcription.ts exports transcribeAudio()
- [ ] app/ea/meetings/page.tsx loads without error
- [ ] Action items show on dashboard
- [ ] meeting_analysis agent uses claude-sonnet-4-6
- [ ] Conversation reset endpoint works
- [ ] ESLint: 0 errors

**Build check:** Final `npm run build` must pass ✅
**Lint check:** `npm run lint` must pass ✅

---

## FINAL REPORT (write to PROGRESS.md)

```
## Build Task 2 — Final Report
Date: {date}

### ✅ Completed
- list everything done

### 🔧 Fixed
- what was broken, what fix applied

### ⚠️ Needs human review
- browser/device tests needed
- env vars needed (OPENAI_API_KEY for Whisper)
- Playwright browser setup for real meeting bot

### ❌ Could not complete
- what failed and why

### 📋 Recommended next session
- P3: Playwright browser automation (needs local Playwright setup)
- P5: AI Memory + Vector DB (Neon pgvector)
- Wire briefing to dashboard morning widget
```

---

## ENV VARS NEEDED (check .env.local)
- ANTHROPIC_API_KEY ✅ (already set)
- DATABASE_URL ✅ (already set)
- GOOGLE_CLIENT_ID ✅ (already set)
- GOOGLE_CLIENT_SECRET ✅ (already set)
- ELEVENLABS_API_KEY ✅ (already set)
- OPENAI_API_KEY — needed for Whisper (add if available, skip if not)

Do not stop if OPENAI_API_KEY is missing — implement with graceful fallback.