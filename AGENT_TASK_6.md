# Virtual EA — Intelligence Pipeline
# Cursor Agent mode. Work independently. Do not stop for confirmation.
# This builds the core learning engine that makes Virtual EA smarter over time.

## VISION
Virtual EA joins every meeting → captures everything → builds intelligence →
that intelligence powers future tools (moodboard, IA, proposals, etc.)
This is the data moat. Free users generate data. Data powers better products.

## CONTEXT
Project: Virtual EA at designbyganesh.com/ea
Stack: Next.js 14, Tailwind, Neon DB (pgvector), Vercel, Anthropic API
Completed: P1-P7 fully built. Now building the intelligence layer on top.

## WORKING RULES
- npm run build after every task — fix before moving on
- Append all logs to PROGRESS.md
- Never break existing features
- If stuck >15 min — skip, mark ⚠️, move on
- Do not stop until all tasks complete

---

## TASK 1 — Intelligence Data Model (20 min)

Create: scripts/init-intelligence-tables.ts

```sql
-- Core intelligence store
CREATE TABLE IF NOT EXISTS ea_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  
  -- Source
  source_type TEXT NOT NULL,
  -- 'meeting' | 'chat' | 'manual' | 'document'
  source_id TEXT,
  -- meeting_id, conversation_id etc
  
  -- Classification
  category TEXT NOT NULL,
  -- 'design' | 'business' | 'strategy' | 'client' | 
  -- 'leadership' | 'emotional' | 'development' | 'learning'
  subcategory TEXT,
  
  -- Content
  insight TEXT NOT NULL,
  raw_context TEXT,
  -- original transcript snippet
  
  -- Intelligence metadata
  client_name TEXT,
  project_name TEXT,
  sentiment DECIMAL(3,2),
  -- -1.0 (negative) to 1.0 (positive)
  confidence DECIMAL(3,2),
  -- 0.0 to 1.0
  importance INTEGER DEFAULT 5,
  -- 1-10
  
  -- Tags for filtering
  tags JSONB DEFAULT '[]',
  
  -- Embedding for semantic search
  embedding vector(1536),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pattern recognition — recurring themes
CREATE TABLE IF NOT EXISTS ea_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  pattern_type TEXT NOT NULL,
  -- 'client_behavior' | 'process' | 'outcome' | 'communication' | 'risk'
  description TEXT NOT NULL,
  evidence_count INTEGER DEFAULT 1,
  -- how many times observed
  confidence DECIMAL(3,2) DEFAULT 0.5,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  client_name TEXT,
  project_type TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weekly/monthly summaries
CREATE TABLE IF NOT EXISTS ea_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  period_type TEXT NOT NULL,
  -- 'weekly' | 'monthly'
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  meeting_count INTEGER DEFAULT 0,
  insights_generated INTEGER DEFAULT 0,
  top_patterns JSONB DEFAULT '[]',
  sentiment_avg DECIMAL(3,2),
  key_learnings JSONB DEFAULT '[]',
  action_items JSONB DEFAULT '[]',
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client intelligence profiles
CREATE TABLE IF NOT EXISTS ea_client_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  client_name TEXT NOT NULL,
  company TEXT,
  communication_style TEXT,
  -- 'direct' | 'collaborative' | 'analytical' | 'creative'
  decision_style TEXT,
  -- 'fast' | 'committee' | 'data-driven' | 'gut-feel'
  sentiment_history JSONB DEFAULT '[]',
  -- [{date, score, context}]
  interaction_count INTEGER DEFAULT 0,
  last_interaction_at TIMESTAMPTZ,
  preferences JSONB DEFAULT '[]',
  red_flags JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, client_name)
);

CREATE INDEX IF NOT EXISTS ea_intelligence_session_idx 
  ON ea_intelligence(session_id);
CREATE INDEX IF NOT EXISTS ea_intelligence_category_idx 
  ON ea_intelligence(session_id, category);
CREATE INDEX IF NOT EXISTS ea_intelligence_client_idx 
  ON ea_intelligence(session_id, client_name);
CREATE INDEX IF NOT EXISTS ea_patterns_session_idx 
  ON ea_patterns(session_id);
CREATE INDEX IF NOT EXISTS ea_client_profiles_idx 
  ON ea_client_profiles(session_id, client_name);
```

Run: `npx ts-node scripts/init-intelligence-tables.ts`
Add to package.json: "db:init-intelligence": "npx ts-node scripts/init-intelligence-tables.ts"
Also add to scripts/init-all-tables.ts

---

## TASK 2 — Intelligence Extractor Engine (45 min)

Create: lib/intelligence-extractor.ts

This is the core brain. Given any transcript or conversation,
extract structured intelligence across ALL dimensions.

```typescript
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export type IntelligenceItem = {
  category: 'design' | 'business' | 'strategy' | 'client' | 
            'leadership' | 'emotional' | 'development' | 'learning'
  subcategory?: string
  insight: string
  rawContext?: string
  clientName?: string
  projectName?: string
  sentiment: number // -1.0 to 1.0
  confidence: number // 0.0 to 1.0
  importance: number // 1-10
  tags: string[]
}

export type ClientProfile = {
  clientName: string
  company?: string
  communicationStyle?: string
  decisionStyle?: string
  sentiment: number
  preferences: string[]
  redFlags: string[]
}

export type ExtractionResult = {
  intelligence: IntelligenceItem[]
  clientProfiles: ClientProfile[]
  patterns: string[]
  meetingSentimentOverall: number
  keyMoments: string[]
}

const EXTRACTION_PROMPT = `You are an intelligence extraction engine.
Analyze this professional meeting transcript and extract structured insights.

Extract insights across these categories:

DESIGN: Visual preferences, aesthetic decisions, design process patterns,
tool preferences, delivery expectations, feedback on designs

BUSINESS: Pricing discussions, budget signals, ROI expectations,
competitive mentions, business model discussions, revenue/growth topics

STRATEGY: Long-term plans mentioned, strategic decisions, market positioning,
product roadmap discussions, partnership opportunities

CLIENT: Client personality, communication style, decision-making patterns,
what they care about most, their internal dynamics, approval process

LEADERSHIP: How the meeting was run, presentation effectiveness,
objection handling, negotiation style, confidence signals,
moments of authority or uncertainty

EMOTIONAL: Sentiment shifts during meeting, excitement/resistance signals,
trust building moments, tension points, energy levels

DEVELOPMENT: Technical decisions, tech stack discussions,
build vs buy decisions, timeline pressures, resource constraints

LEARNING: Gaps identified, questions that couldn't be answered confidently,
skills to develop, patterns to improve, missed opportunities

For each insight:
- Be specific, not generic ("client prefers 3 options" not "client has preferences")
- Include the raw context quote when relevant
- Rate sentiment -1.0 to 1.0
- Rate importance 1-10 (10 = critical pattern to remember)
- Tag with relevant keywords

Also extract:
- Client profile if a client is present
- Overall meeting sentiment
- 3-5 key moments that defined the meeting

Return ONLY valid JSON, no markdown, no explanation.

Format:
{
  "intelligence": [...],
  "clientProfiles": [...],
  "patterns": ["pattern 1", "pattern 2"],
  "meetingSentimentOverall": 0.0,
  "keyMoments": ["moment 1", "moment 2"]
}`

export async function extractIntelligence(
  transcript: string,
  context?: {
    meetingTitle?: string
    clientName?: string
    projectName?: string
    meetingType?: string
  }
): Promise<ExtractionResult> {
  try {
    const contextStr = context ? 
      `Meeting: ${context.meetingTitle || 'Unknown'}
Client: ${context.clientName || 'Unknown'}
Project: ${context.projectName || 'Unknown'}
Type: ${context.meetingType || 'General'}

` : ''

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      // Use Sonnet for intelligence extraction — accuracy critical
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `${EXTRACTION_PROMPT}

${contextStr}TRANSCRIPT:
${transcript.slice(0, 8000)}
// Limit to 8000 chars to stay within context`
      }]
    })

    const text = response.content[0].type === 'text' 
      ? response.content[0].text : '{}'
    
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch (error) {
    console.error('[intelligence-extractor] Failed:', error)
    return {
      intelligence: [],
      clientProfiles: [],
      patterns: [],
      meetingSentimentOverall: 0,
      keyMoments: []
    }
  }
}

// Extract from chat conversation (lighter version)
export async function extractIntelligenceFromChat(
  userMessage: string,
  assistantResponse: string
): Promise<IntelligenceItem[]> {
  // Lightweight heuristic extraction — no API call
  const items: IntelligenceItem[] = []
  const combined = `${userMessage} ${assistantResponse}`.toLowerCase()

  // Business signals
  if (combined.includes('client') || combined.includes('project')) {
    if (combined.includes('budget') || combined.includes('cost') || 
        combined.includes('price') || combined.includes('quote')) {
      items.push({
        category: 'business',
        subcategory: 'pricing',
        insight: `Pricing discussion: ${userMessage.slice(0, 100)}`,
        sentiment: 0,
        confidence: 0.6,
        importance: 7,
        tags: ['pricing', 'business']
      })
    }
  }

  // Learning signals
  if (combined.includes('how do i') || combined.includes('help me') ||
      combined.includes('not sure') || combined.includes('kaise')) {
    items.push({
      category: 'learning',
      subcategory: 'skill_gap',
      insight: `Knowledge gap identified: ${userMessage.slice(0, 100)}`,
      sentiment: -0.2,
      confidence: 0.5,
      importance: 5,
      tags: ['learning', 'development']
    })
  }

  return items
}
```

---

## TASK 3 — Intelligence Store (20 min)

Create: lib/intelligence-store.ts

```typescript
import { neon } from '@neondatabase/serverless'
import type { IntelligenceItem, ClientProfile } from './intelligence-extractor'

const sql = neon(process.env.DATABASE_URL!)

export async function saveIntelligence(
  sessionId: string,
  items: IntelligenceItem[],
  sourceType: string,
  sourceId?: string
): Promise<void> {
  for (const item of items) {
    await sql`
      INSERT INTO ea_intelligence (
        session_id, source_type, source_id, category, subcategory,
        insight, raw_context, client_name, project_name,
        sentiment, confidence, importance, tags
      ) VALUES (
        ${sessionId}, ${sourceType}, ${sourceId || null},
        ${item.category}, ${item.subcategory || null},
        ${item.insight}, ${item.rawContext || null},
        ${item.clientName || null}, ${item.projectName || null},
        ${item.sentiment}, ${item.confidence}, ${item.importance},
        ${JSON.stringify(item.tags)}
      )
    `
  }
}

export async function upsertClientProfile(
  sessionId: string,
  profile: ClientProfile
): Promise<void> {
  await sql`
    INSERT INTO ea_client_profiles (
      session_id, client_name, company, communication_style,
      decision_style, sentiment_history, preferences, red_flags,
      interaction_count, last_interaction_at
    ) VALUES (
      ${sessionId}, ${profile.clientName}, ${profile.company || null},
      ${profile.communicationStyle || null}, ${profile.decisionStyle || null},
      ${JSON.stringify([{ date: new Date(), score: profile.sentiment }])},
      ${JSON.stringify(profile.preferences)},
      ${JSON.stringify(profile.redFlags)},
      1, NOW()
    )
    ON CONFLICT (session_id, client_name) DO UPDATE SET
      sentiment_history = ea_client_profiles.sentiment_history || 
        ${JSON.stringify([{ date: new Date(), score: profile.sentiment }])}::jsonb,
      preferences = ea_client_profiles.preferences || 
        ${JSON.stringify(profile.preferences)}::jsonb,
      red_flags = ea_client_profiles.red_flags || 
        ${JSON.stringify(profile.redFlags)}::jsonb,
      interaction_count = ea_client_profiles.interaction_count + 1,
      last_interaction_at = NOW(),
      updated_at = NOW()
  `
}

export async function getIntelligence(
  sessionId: string,
  options?: {
    category?: string
    clientName?: string
    limit?: number
    minImportance?: number
  }
): Promise<any[]> {
  const limit = options?.limit || 20
  const minImportance = options?.minImportance || 1

  if (options?.category && options?.clientName) {
    return await sql`
      SELECT * FROM ea_intelligence
      WHERE session_id = ${sessionId}
        AND category = ${options.category}
        AND client_name ILIKE ${'%' + options.clientName + '%'}
        AND importance >= ${minImportance}
      ORDER BY importance DESC, created_at DESC
      LIMIT ${limit}
    `
  }
  if (options?.category) {
    return await sql`
      SELECT * FROM ea_intelligence
      WHERE session_id = ${sessionId}
        AND category = ${options.category}
        AND importance >= ${minImportance}
      ORDER BY importance DESC, created_at DESC
      LIMIT ${limit}
    `
  }
  if (options?.clientName) {
    return await sql`
      SELECT * FROM ea_intelligence
      WHERE session_id = ${sessionId}
        AND client_name ILIKE ${'%' + options.clientName + '%'}
        AND importance >= ${minImportance}
      ORDER BY importance DESC, created_at DESC
      LIMIT ${limit}
    `
  }
  return await sql`
    SELECT * FROM ea_intelligence
    WHERE session_id = ${sessionId}
      AND importance >= ${minImportance}
    ORDER BY importance DESC, created_at DESC
    LIMIT ${limit}
  `
}

export async function getClientProfile(
  sessionId: string,
  clientName: string
): Promise<any | null> {
  const result = await sql`
    SELECT * FROM ea_client_profiles
    WHERE session_id = ${sessionId}
      AND client_name ILIKE ${'%' + clientName + '%'}
    LIMIT 1
  `
  return result[0] || null
}

export async function getAllClientProfiles(
  sessionId: string
): Promise<any[]> {
  return await sql`
    SELECT * FROM ea_client_profiles
    WHERE session_id = ${sessionId}
    ORDER BY last_interaction_at DESC
  `
}

export async function getPatterns(
  sessionId: string,
  patternType?: string
): Promise<any[]> {
  if (patternType) {
    return await sql`
      SELECT * FROM ea_patterns
      WHERE session_id = ${sessionId}
        AND pattern_type = ${patternType}
      ORDER BY evidence_count DESC
    `
  }
  return await sql`
    SELECT * FROM ea_patterns
    WHERE session_id = ${sessionId}
    ORDER BY evidence_count DESC
    LIMIT 20
  `
}
```

---

## TASK 4 — Intelligence API Routes (25 min)

### 4a. Main intelligence route
Create: app/api/ea/intelligence/route.ts
- GET — returns intelligence items with filters
  - ?category=design&client=rahul&limit=20&minImportance=6
  - Returns: { items, total, categories }
- POST — manually save intelligence item
  - Body: { category, insight, clientName, importance, tags }

### 4b. Insights (patterns + trends)
Create: app/api/ea/intelligence/insights/route.ts
- GET — returns weekly insights summary
- Aggregates: meeting count, avg sentiment, top categories,
  most active clients, key patterns, suggested actions
- Uses claude-haiku to synthesize into narrative
- Returns: { narrative, stats, patterns, suggestions }

### 4c. Client intelligence
Create: app/api/ea/intelligence/clients/route.ts
- GET — returns all client profiles
- Returns: { clients: ClientProfile[] }

Create: app/api/ea/intelligence/clients/[name]/route.ts  
- GET — deep profile for one client
- Returns: { profile, recentIntelligence, sentimentTrend, suggestions }

### 4d. Tool context bridge
Create: app/api/ea/intelligence/tool-context/route.ts
- POST { tool, projectBrief, clientName, projectType }
- tool: 'moodboard' | 'ia' | 'proposal' | 'presentation'
- Fetches relevant intelligence from DB
- Uses claude-haiku to structure it for the specific tool
- Returns tool-specific context object:

For moodboard:
```json
{
  "styleDirection": ["minimal", "dark", "editorial"],
  "clientContext": ["prefers 3 options", "approves fast"],
  "avoid": ["busy layouts", "bright colors"],
  "moodKeywords": ["luxury", "modern", "clean"]
}
```

For IA:
```json
{
  "userPatterns": ["task-focused", "mobile-first"],
  "clientExpectations": ["simple nav", "quick access"],
  "projectComplexity": "medium",
  "suggestedStructure": ["dashboard", "tasks", "reports"]
}
```

For proposal:
```json
{
  "clientDecisionStyle": "collaborative",
  "pricingSensitivity": "medium",
  "valueDrivers": ["speed", "quality"],
  "riskFactors": ["delayed approvals"],
  "winFactors": ["show process", "3 tiers"]
}
```

---

## TASK 5 — Wire Intelligence into Meeting Processing (20 min)

Update: app/api/ea/meetings/[id]/process/route.ts

After existing summary + action items extraction:

```typescript
// Step 3: Extract intelligence
const extraction = await extractIntelligence(
  meeting.raw_transcript,
  {
    meetingTitle: meeting.title,
    clientName: meeting.attendees?.[0]?.name,
    projectName: meeting.title,
    meetingType: 'client_meeting'
  }
)

// Step 4: Save intelligence
await saveIntelligence(
  sessionId,
  extraction.intelligence,
  'meeting',
  meetingId
)

// Step 5: Update client profiles
for (const profile of extraction.clientProfiles) {
  await upsertClientProfile(sessionId, profile)
}

// Step 6: Save to ea_memories too (for chat context)
for (const item of extraction.intelligence) {
  if (item.importance >= 7) {
    await saveMemory(
      sessionId,
      item.insight,
      'context',
      'meeting',
      item.importance
    )
  }
}
```

---

## TASK 6 — Personal Context Document (15 min)

Create: data/ganesh-context.md

```markdown
# About Ganesh Das — Virtual EA Context

## Professional Identity
- Design Manager at Brucira (design agency)
- 15+ years industry experience across design, strategy, business
- Works with startups, scale-ups, and enterprise clients
- Positions himself as "Design & Strategy Partner for Startups"
- Builds production-quality deliverables fast — often in single sessions

## How Ganesh Works
- Communicates in Hinglish (Hindi-English mix naturally)
- Direct, assumption-driven approach — acts first, refines after
- Presents 3 directions to clients (never 1, rarely more than 3)
- Shows wireframes before high-fidelity
- Approval typically in 2 rounds
- Starts with typography and color direction in design projects
- Quality benchmarks: Celine, The Row, AMPM (premium, editorial, high-contrast)

## Strengths
- Fast execution — idea to deliverable in hours
- Strong aesthetic sensibility — modern, editorial, premium
- Product thinking — connects design to business outcomes
- Cross-functional — design + strategy + development

## Current Focus Areas
- Building AI-powered design tools (moodboard, IA, UI/UX generation)
- Virtual EA development (this tool)
- designbyganesh.com — personal brand platform
- VerbaFlo — AI CRM for student accommodation

## Communication Preferences
- Skip preamble — get to the point
- State assumptions before generating anything
- Max 4-5 clarifying questions, then proceed
- Hinglish responses preferred in casual context
- Structured output for deliverables

## What Virtual EA Should Know
- Ganesh's goal is to build tools that learn from real work
- Every meeting, decision, and client interaction is data
- The EA should proactively surface patterns and insights
- Suggest improvements to process, not just execute tasks
- Be a thinking partner, not just a task executor
```

Create: lib/ganesh-context-loader.ts
- Reads data/ganesh-context.md at startup
- Caches in memory (no DB call needed)
- Returns string for system prompt injection
- Max 600 tokens — truncate if longer

Update: app/api/ea/chat/route.ts
Inject ganesh-context.md into system prompt:
```
[System base]
[Ganesh context — always present]
[Top 5 memories — session specific]
[Calendar context — if needed]
[Briefing — if requested]
```

---

## TASK 7 — Insights UI (25 min)

Create: app/ea/insights/page.tsx

Sections:

**Header**
- "Intelligence" heading
- Last updated timestamp
- "Generate weekly summary" button

**Overview cards (top)**
- Total insights captured
- Meetings analyzed  
- Clients profiled
- Patterns identified

**Weekly narrative**
- AI-generated paragraph: "This week you had X meetings..."
- Sentiment trend (simple indicator)
- Top 3 learnings

**By category (tabs)**
- Design | Business | Strategy | Client | Leadership | Emotional | Learning
- Each tab shows top insights for that category

**Client profiles**
- Card per client: name, interaction count, sentiment indicator, last seen
- Click → opens client detail panel

**Patterns**
- List of recurring patterns with evidence count
- "Clients typically push back on pricing in round 1 (seen 4 times)"

Add Insights link to EA navigation.

---

## TASK 8 — QA Pass (20 min)

New checklist:
- [ ] ea_intelligence table exists in Neon
- [ ] ea_patterns table exists
- [ ] ea_summaries table exists  
- [ ] ea_client_profiles table exists
- [ ] lib/intelligence-extractor.ts exports extractIntelligence()
- [ ] lib/intelligence-store.ts exports saveIntelligence(), upsertClientProfile()
- [ ] GET /api/ea/intelligence returns items
- [ ] POST /api/ea/intelligence saves item
- [ ] GET /api/ea/intelligence/insights returns narrative
- [ ] GET /api/ea/intelligence/clients returns profiles
- [ ] POST /api/ea/intelligence/tool-context returns tool-specific context
- [ ] Meeting process route saves intelligence after processing
- [ ] Meeting process route updates client profiles
- [ ] data/ganesh-context.md exists with content
- [ ] Ganesh context injected in system prompt
- [ ] app/ea/insights/page.tsx loads without error
- [ ] Intelligence link in navigation
- [ ] npm run build passes
- [ ] npm run lint passes

---

## FINAL REPORT (append to PROGRESS.md)

```
## Intelligence Pipeline — Final Report
Date: {date}

### ✅ Completed
### 🔧 Fixed  
### ⚠️ Needs human review
- Test with real meeting transcript — paste 500+ word transcript
- Verify client profile builds correctly after 2nd meeting with same client
- Check insights narrative quality — ask EA "what patterns have you noticed?"
- Tool context bridge — test with moodboard tool when ready

### ❌ Could not complete
### 📋 Next steps
- Wire tool-context API into moodboard skill
- Add semantic search using pgvector embeddings
- Build weekly email digest of insights
- Google Meet API for auto-transcript fetch
```

---

## ENV VARS NEEDED
- DATABASE_URL ✅
- ANTHROPIC_API_KEY ✅ (Sonnet used for extraction — higher cost, higher accuracy)