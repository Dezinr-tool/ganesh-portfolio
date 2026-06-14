# Max Virtual EA — Autonomous Build Task 4
# Cursor Agent mode. Work independently. Do not stop for confirmation.
# This is the P6 Auto Follow-ups task.

## CONTEXT
Project: Max Virtual EA at designbyganesh.com/ea
Stack: Next.js 14, Tailwind, Neon DB, Vercel, Anthropic API, Resend (email)
Completed: P1, P2, P3, P4, P5
Now building: P6 — Auto Follow-up Emails + Meeting Scheduling Assistant

## WORKING RULES
- Run `npm run build` after every task — fix before moving on
- Log everything in PROGRESS.md (append only)
- Never break working features
- If stuck >15 min — skip, mark ⚠️, move on
- At the end — write final report in PROGRESS.md

---

## TASK 1 — Email Infrastructure (20 min)

### 1a. Check Resend setup
Check if RESEND_API_KEY exists in .env.local
Check if resend package is installed — if not: `npm install resend`
Check if any email sending exists in codebase already

### 1b. Email service
Create: `lib/email-service.ts`

```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export type EmailOptions = {
  to: string
  subject: string
  body: string // plain text
  html?: string // optional rich HTML
  replyTo?: string
}

export async function sendEmail(options: EmailOptions): Promise<{ id: string, sent: boolean }> {
  try {
    const result = await resend.emails.send({
      from: 'Max <max@designbyganesh.com>',
      to: options.to,
      subject: options.subject,
      text: options.body,
      html: options.html || `<p>${options.body.replace(/\n/g, '<br>')}</p>`,
      replyTo: options.replyTo || 'ganesh@designbyganesh.com'
    })
    return { id: result.data?.id || '', sent: true }
  } catch (error) {
    console.error('[email-service] Failed:', error)
    return { id: '', sent: false }
  }
}

export async function sendFollowUpEmail(options: {
  to: string
  toName: string
  meetingTitle: string
  meetingDate: string
  summary: string
  actionItems: string[]
  senderName?: string
}): Promise<{ id: string, sent: boolean }> {
  const actionList = options.actionItems
    .map((item, i) => `${i + 1}. ${item}`)
    .join('\n')

  const body = `Hi ${options.toName},

Thank you for the meeting — ${options.meetingTitle} on ${options.meetingDate}.

Here's a quick summary:
${options.summary}

Action items:
${actionList}

Let me know if you have any questions.

Best,
${options.senderName || 'Ganesh'}`

  const html = `
<p>Hi ${options.toName},</p>
<p>Thank you for the meeting — <strong>${options.meetingTitle}</strong> on ${options.meetingDate}.</p>
<p><strong>Summary:</strong><br>${options.summary.replace(/\n/g, '<br>')}</p>
<p><strong>Action items:</strong></p>
<ol>${options.actionItems.map(item => `<li>${item}</li>`).join('')}</ol>
<p>Let me know if you have any questions.</p>
<p>Best,<br>${options.senderName || 'Ganesh'}</p>
`

  return sendEmail({
    to: options.to,
    subject: `Follow-up: ${options.meetingTitle}`,
    body,
    html
  })
}
```

---

## TASK 2 — Follow-up DB Schema (15 min)

Create: `scripts/init-followup-tables.ts`

```sql
CREATE TABLE IF NOT EXISTS ea_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  meeting_id UUID REFERENCES ea_meetings(id),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  -- draft | approved | sent | failed
  sent_at TIMESTAMPTZ,
  email_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ea_scheduled_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  title TEXT NOT NULL,
  proposed_times JSONB DEFAULT '[]',
  -- [{start, end, label}]
  confirmed_time TIMESTAMPTZ,
  attendee_emails JSONB DEFAULT '[]',
  meeting_url TEXT,
  calendar_event_id TEXT,
  status TEXT DEFAULT 'proposing',
  -- proposing | confirmed | cancelled
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Run: `npx ts-node scripts/init-followup-tables.ts`

---

## TASK 3 — Follow-up Generation (30 min)

### 3a. AI follow-up generator
Create: `lib/followup-generator.ts`

```typescript
export type FollowUpDraft = {
  recipientEmail: string
  recipientName: string
  subject: string
  body: string
  actionItems: string[]
}

export async function generateFollowUp(options: {
  meetingTitle: string
  meetingDate: string
  transcript: string
  summary: string
  actionItems: string[]
  attendees: Array<{ name: string, email: string }>
}): Promise<FollowUpDraft[]> {
  // Generate one draft per attendee
  // Use claude-haiku-4-5-20251001 for speed
  // Prompt: given meeting context, write a concise professional follow-up
  // Tone: warm but professional, under 150 words body
  // Include: summary snippet + their specific action items only
  // Return array of drafts, one per attendee
}
```

### 3b. Follow-up API routes
Create: `app/api/ea/followups/route.ts`
- GET — list all followups for session
- POST — generate followup drafts from meeting_id
  - Body: { meetingId, attendees: [{name, email}] }
  - Calls generateFollowUp()
  - Saves drafts to ea_followups with status 'draft'
  - Returns drafts for human review

Create: `app/api/ea/followups/[id]/route.ts`
- GET — get single followup
- PATCH — update draft (edit body/subject)
- DELETE — discard draft

Create: `app/api/ea/followups/[id]/send/route.ts`
- POST — sends the approved followup via Resend
- Updates status to 'sent', saves sent_at and email_id
- Returns { sent: true, emailId }

Create: `app/api/ea/followups/[id]/approve/route.ts`
- POST — marks draft as 'approved' (ready to send)
- Returns { approved: true }

### 3c. Wire into meeting processing
File: `app/api/ea/meetings/[id]/process/route.ts`
After extracting summary and action items:
- If attendees have emails → auto-generate followup drafts
- Save as 'draft' status (never auto-send — always needs approval)
- Return followupDrafts array in response

---

## TASK 4 — Meeting Scheduler Assistant (30 min)

### 4a. Scheduling intelligence
Create: `lib/meeting-scheduler.ts`

```typescript
export async function proposeAvailableSlots(options: {
  attendeeEmails: string[]
  duration: number // minutes
  preferredDays?: string[] // ['monday', 'tuesday']
  notBefore?: string // '09:00'
  notAfter?: string // '18:00'
  existingEvents: any[]
}): Promise<Array<{
  start: string
  end: string
  label: string // "Tomorrow 3pm" / "Wednesday 10am"
}>>

export async function generateCalendarInvite(options: {
  title: string
  start: string
  end: string
  attendees: string[]
  description?: string
}): Promise<{ eventId: string, meetUrl: string }>
```

### 4b. Scheduling API
Create: `app/api/ea/schedule/route.ts`
- POST — propose meeting slots
  - Body: { attendees, duration, preferences }
  - Returns: { slots: [{start, end, label}] }

Create: `app/api/ea/schedule/confirm/route.ts`
- POST — confirm a slot and create calendar event
  - Body: { slot, title, attendees, description }
  - Creates Google Calendar event with Meet link
  - Saves to ea_scheduled_meetings
  - Returns: { eventId, meetUrl, calendarLink }

### 4c. Natural language scheduling in chat
Update: `lib/agents/router.ts`
Add `scheduler` to AGENTS registry:
```typescript
scheduler: {
  model: 'claude-haiku-4-5-20251001',
  triggers: ['find time', 'schedule with', 'book a call', 'set up meeting',
             'availability', 'free slot', 'time mil sakta', 'schedule karein'],
  systemPrompt: `You are Max, scheduling assistant. 
  When asked to find meeting times, call the schedule API.
  Always propose 3 slots. Confirm before creating calendar event.`
}
```

---

## TASK 5 — Follow-ups UI (25 min)

### 5a. Follow-ups page
Create: `app/ea/followups/page.tsx`
- List all follow-up drafts grouped by: Draft / Approved / Sent
- Each card shows: recipient name, meeting title, subject, date
- Action buttons per draft:
  - "Review" → opens full draft with edit capability
  - "Approve" → marks approved
  - "Send" → sends immediately (only if approved)
  - "Discard" → deletes draft
- Sent emails show: sent timestamp, email ID
- Empty state: "No follow-ups yet. Max generates these after meetings."

### 5b. Follow-up review modal
In followups page — clicking "Review" shows:
- Editable subject field
- Editable body textarea
- Action items list (read-only)
- Recipient info
- Save changes button
- Approve + Send button (combined action)

### 5c. Dashboard integration
Update: `app/ea/dashboard/page.tsx`
Add "Pending follow-ups" count badge
Link to /ea/followups

### 5d. Nav update
Update navigation to include:
- Meetings link
- Follow-ups link (with pending count badge)

---

## TASK 6 — Max Chat Integration (15 min)

Update chat so Max can:

**Trigger follow-up generation:**
User: "Send follow-up for today's Rahul meeting"
Max: generates draft, shows preview in chat, asks "Shall I save this as draft?"

**Trigger scheduling:**
User: "Find time to meet Priya next week for 30 min"
Max: fetches calendar, proposes 3 slots in chat, user picks one, Max creates event

Add these flows to the chat route using the agent router.

---

## TASK 7 — Full QA Pass (20 min)

### New checklist — P6:
- [ ] resend package installed
- [ ] lib/email-service.ts exports sendEmail and sendFollowUpEmail
- [ ] ea_followups table exists in Neon DB
- [ ] ea_scheduled_meetings table exists in Neon DB
- [ ] lib/followup-generator.ts exports generateFollowUp
- [ ] GET /api/ea/followups returns drafts for session
- [ ] POST /api/ea/followups generates drafts from meeting
- [ ] PATCH /api/ea/followups/[id] updates draft
- [ ] POST /api/ea/followups/[id]/approve marks approved
- [ ] POST /api/ea/followups/[id]/send sends via Resend
- [ ] Meeting process route auto-generates followup drafts
- [ ] lib/meeting-scheduler.ts exports proposeAvailableSlots
- [ ] POST /api/ea/schedule returns slot proposals
- [ ] POST /api/ea/schedule/confirm creates calendar event
- [ ] scheduler agent added to AGENTS registry
- [ ] app/ea/followups/page.tsx loads without error
- [ ] Dashboard shows pending followups count
- [ ] Nav includes Meetings + Follow-ups links
- [ ] npm run build passes
- [ ] npm run lint passes

---

## FINAL REPORT (append to PROGRESS.md)

```
## Build Task 4 — P6 Follow-ups — Final Report
Date: {date}

### ✅ Completed
### 🔧 Fixed
### ⚠️ Needs human review
- RESEND_API_KEY needed in .env.local + Resend domain verify
- Test actual email delivery
- Test scheduling flow end to end in browser

### ❌ Could not complete
### 📋 Next session — P7 SaaS Launch
```

---

## ENV VARS NEEDED
- ANTHROPIC_API_KEY ✅
- DATABASE_URL ✅
- GOOGLE_CLIENT_ID ✅
- GOOGLE_CLIENT_SECRET ✅
- ELEVENLABS_API_KEY ✅
- RESEND_API_KEY — add to .env.local (resend.com se free mein milti hai)
- OPENAI_API_KEY — optional, for Whisper