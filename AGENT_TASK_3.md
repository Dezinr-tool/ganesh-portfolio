# Max Virtual EA — Autonomous Build Task 3
# Cursor Agent mode. Work independently. Do not stop for confirmation.
# This is the P5 AI Memory foundation task.

## CONTEXT
Project: Max Virtual EA at designbyganesh.com/ea
Stack: Next.js 14, Tailwind, Neon DB (pgvector), Vercel, Anthropic API
Completed: P1 fixes, Agent Router, P2 Calendar Intelligence, P3/P4 foundation
Now building: P5 AI Memory foundation (vector store + memory API)

## WORKING RULES
- Run `npm run build` after every task — fix before moving on
- Log everything in PROGRESS.md (append only, never overwrite)
- Never break working features
- If stuck >15 min — skip, mark ⚠️, move on
- At the end — write final report in PROGRESS.md

---

## TASK 1 — Enable pgvector in Neon (15 min)

### 1a. Enable extension
Create: `scripts/init-memory-tables.ts`

```typescript
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

async function init() {
  console.log('Enabling pgvector...')
  await sql`CREATE EXTENSION IF NOT EXISTS vector`

  console.log('Creating ea_memories table...')
  await sql`
    CREATE TABLE IF NOT EXISTS ea_memories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id TEXT NOT NULL,
      content TEXT NOT NULL,
      embedding vector(1536),
      category TEXT DEFAULT 'context',
      source TEXT DEFAULT 'conversation',
      importance INTEGER DEFAULT 5,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      accessed_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  console.log('Creating index...')
  await sql`
    CREATE INDEX IF NOT EXISTS ea_memories_session_idx
    ON ea_memories(session_id)
  `

  await sql`
    CREATE INDEX IF NOT EXISTS ea_memories_category_idx
    ON ea_memories(session_id, category)
  `

  console.log('Done.')
  process.exit(0)
}

init().catch(console.error)
```

Run: `npx ts-node scripts/init-memory-tables.ts`
Confirm: no errors, table created.

---

## TASK 2 — Memory Store (20 min)

Create: `lib/memory-store.ts`

```typescript
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export type Memory = {
  id: string
  sessionId: string
  content: string
  category: 'preference' | 'fact' | 'instruction' | 'context' | 'meeting'
  source: 'conversation' | 'meeting' | 'manual'
  importance: number
  createdAt: string
}

// Save a new memory
export async function saveMemory(
  sessionId: string,
  content: string,
  category: Memory['category'] = 'context',
  source: Memory['source'] = 'conversation',
  importance: number = 5
): Promise<string> {
  const result = await sql`
    INSERT INTO ea_memories (session_id, content, category, source, importance)
    VALUES (${sessionId}, ${content}, ${category}, ${source}, ${importance})
    RETURNING id
  `
  return result[0].id
}

// Get recent memories for a session
export async function getRecentMemories(
  sessionId: string,
  limit: number = 10,
  category?: Memory['category']
): Promise<Memory[]> {
  if (category) {
    return await sql`
      SELECT * FROM ea_memories
      WHERE session_id = ${sessionId} AND category = ${category}
      ORDER BY created_at DESC
      LIMIT ${limit}
    ` as Memory[]
  }
  return await sql`
    SELECT * FROM ea_memories
    WHERE session_id = ${sessionId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  ` as Memory[]
}

// Search memories by keyword (text search — no embedding needed yet)
export async function searchMemories(
  sessionId: string,
  query: string,
  limit: number = 5
): Promise<Memory[]> {
  return await sql`
    SELECT * FROM ea_memories
    WHERE session_id = ${sessionId}
      AND content ILIKE ${'%' + query + '%'}
    ORDER BY importance DESC, created_at DESC
    LIMIT ${limit}
  ` as Memory[]
}

// Delete a memory
export async function deleteMemory(id: string, sessionId: string): Promise<void> {
  await sql`
    DELETE FROM ea_memories
    WHERE id = ${id} AND session_id = ${sessionId}
  `
}

// Clear all memories for session
export async function clearMemories(sessionId: string): Promise<number> {
  const result = await sql`
    DELETE FROM ea_memories
    WHERE session_id = ${sessionId}
    RETURNING id
  `
  return result.length
}
```

---

## TASK 3 — Memory API Routes (20 min)

### 3a. Main memory route
Create: `app/api/ea/memory/route.ts`

- GET — returns recent memories for session
  - Query params: ?category=preference&limit=10
  - Returns: { memories: Memory[], count: number }

- POST — manually save a memory
  - Body: { content, category, source, importance }
  - Returns: { id, saved: true }

- DELETE — clear all memories
  - Returns: { cleared: true, count: number }

### 3b. Single memory route
Create: `app/api/ea/memory/[id]/route.ts`

- DELETE — delete single memory by id
  - Returns: { deleted: true }

---

## TASK 4 — Wire Memory into Chat (25 min)

### 4a. Auto-extract memories from conversation
File: `lib/memory-extractor.ts`

Create function `extractMemoriesFromMessage(userMessage: string, assistantResponse: string): string[]`

Use a simple heuristic approach (no extra API call):
- If user says "remember that..." → extract and save as 'instruction', importance 9
- If user mentions preference ("I prefer", "I like", "mujhe pasand") → save as 'preference', importance 8
- If user shares a fact about themselves ("I work at", "my team", "mera client") → save as 'fact', importance 7
- Otherwise → skip (don't save everything, only meaningful signals)

### 4b. Inject memories into system prompt
File: `app/api/ea/chat/route.ts`

After routing but before API call:
- Fetch top 5 recent memories for session
- If memories exist, append to system prompt:

```
## What Max remembers about Ganesh:
- {memory 1}
- {memory 2}
...
```

- Keep this section under 200 tokens total
- Only include if memories exist (don't add empty section)

### 4c. Auto-save after each turn
In chat route, after saving to ea_conversations:
- Call extractMemoriesFromMessage(userMessage, assistantResponse)
- If any memories extracted — save each via saveMemory()
- Do this with after() hook so it doesn't slow response

**Build check:** `npm run build` must pass ✅

---

## TASK 5 — Memory UI (20 min)

### 5a. Memory indicator in chat
File: `app/ea/chat/page.tsx`

Add a subtle memory count badge somewhere in the UI:
- Small pill: "🧠 12 memories" 
- Clicking it opens a simple drawer/panel showing recent memories
- Each memory shows: content, category badge, date
- Delete button on each memory

### 5b. Memory settings page
File: `app/ea/settings/page.tsx` (update if exists, create if not)

Add "Memory" section:
- List all memories grouped by category
- Clear all button (with confirmation)
- Add memory manually (text input + category select)

---

## TASK 6 — Full QA Pass (20 min)

Test every item — confirm in code, flag what needs browser test.

### New checklist — P5 Memory:
- [ ] pgvector extension enabled in Neon
- [ ] ea_memories table exists with correct schema
- [ ] lib/memory-store.ts exports saveMemory, getRecentMemories, searchMemories
- [ ] GET /api/ea/memory returns memories array
- [ ] POST /api/ea/memory saves a memory
- [ ] DELETE /api/ea/memory clears all memories
- [ ] lib/memory-extractor.ts extracts memories from conversation
- [ ] Chat route injects top 5 memories into system prompt
- [ ] Auto-save runs after each chat turn
- [ ] Memory count shows in chat UI
- [ ] Settings page has memory section
- [ ] npm run build passes ✅
- [ ] npm run lint passes ✅

---

## FINAL REPORT FORMAT (append to PROGRESS.md)

```
## Build Task 3 — P5 Memory — Final Report
Date: {date}

### ✅ Completed

### 🔧 Fixed

### ⚠️ Needs human review
- Test memory injection — ask Max "what do you remember about me?"
- Verify memories persist across sessions
- Check memory count badge in chat UI

### ❌ Could not complete

### 📋 Next session recommendations
- P5 upgrade: Add OpenAI embeddings for semantic search
- P6: Auto follow-up emails after meetings
- Connect briefing endpoint to dashboard widget
```

---

## ENV VARS NEEDED
- DATABASE_URL ✅ (already set — Neon)
- ANTHROPIC_API_KEY ✅ (already set)
- OPENAI_API_KEY — optional, needed later for embeddings (not this task)