# Jobs Stories

## Overview

Jobs Stories are a format for capturing user needs and motivations in a structured, context-driven way. Popularized by the Intercom product team and Alan Klement, they emerged as an alternative to traditional user stories and persona-based requirements, drawing heavily from Jobs-to-be-Done (JTBD) theory.

A jobs story focuses on **situation, motivation, and outcome** rather than role-based personas. It answers: "When this happens, I want to do this, so I can achieve that."

## The Format

### Standard Template

```
When [situation/context/trigger],
I want to [motivation/action],
So I can [expected outcome/benefit].
```

### Extended Template (with more specificity)

```
When [situation],
But [constraint or tension],
I want to [motivation],
So I can [outcome].
```

The "But" clause (optional) captures friction or competing forces that make the job non-trivial.

## Examples by Domain

### Productivity Software

```
When I'm reviewing my team's sprint backlog before planning,
I want to see which items have unresolved dependencies,
So I can avoid committing to work that will block mid-sprint.
```

### E-Commerce

```
When I'm comparing two similar products on my phone during my commute,
I want to quickly see key spec differences side by side,
So I can make a purchase decision without switching to my laptop.
```

### Healthcare

```
When I receive a lab result notification outside business hours,
I want to understand whether the result requires urgent action,
So I can decide whether to call my doctor immediately or wait.
```

### B2B SaaS

```
When a new team member joins mid-project,
I want them to access relevant context from past decisions,
So I can onboard them without repeating three weeks of meetings.
```

### Fintech

```
When I'm about to make a large transfer,
But I'm unsure if the recipient details are correct,
I want confirmation that matches my previous payments to this person,
So I can send money without fear of irreversible error.
```

### With "But" Constraint

```
When I'm preparing a client presentation the night before,
But I don't have access to the latest sales data,
I want to pull approved metrics from a trusted source,
So I can deliver accurate numbers without delaying the meeting.
```

## Jobs Stories vs User Stories

### User Story Format (Agile)

```
As a [persona/role],
I want [feature/capability],
So that [benefit].
```

Example:
```
As a project manager,
I want to export reports to PDF,
So that I can share them with stakeholders.
```

### Comparison Table

| Dimension | User Story | Jobs Story |
|-----------|-----------|------------|
| **Anchor** | Role/persona ("As a...") | Situation/context ("When...") |
| **Focus** | Feature request | Motivation and outcome |
| **Persona dependency** | Requires persona definition | Persona-independent |
| **Solution bias risk** | High ("I want a PDF export") | Lower (focuses on why) |
| **Triggers** | Often omitted | Explicit (the "When") |
| **Best for** | Sprint backlog, dev tickets | Discovery, prioritization, framing |
| **JTBD alignment** | Weak | Strong |
| **Flexibility across users** | Same role assumed | Same situation can apply to many roles |

### Side-by-Side Example

**User story:**
```
As a busy parent,
I want grocery delivery,
So that I save time.
```

**Jobs story:**
```
When I'm planning meals for the week but realize I'm missing three ingredients,
I want to order only those items with same-day delivery,
So I can cook tonight's dinner without a trip to the store.
```

The jobs story is more actionable for design—it specifies the trigger, scope (three ingredients, not full shop), timing (same-day), and outcome (cook tonight).

## When to Use Jobs Stories

### Use Jobs Stories When:

- **Discovery and framing** — Before solution exists, to align team on the need
- **Prioritization** — Compare jobs by frequency, urgency, and underserved outcomes
- **Cross-role situations** — Multiple personas share the same context (e.g., "When deadline is tomorrow...")
- **JTBD-informed teams** — Natural bridge from switch interviews to backlog
- **Avoiding persona theater** — Team has weak or stereotyped personas
- **Design critiques** — Evaluate whether a design serves the stated job

### Use User Stories When:

- **Sprint execution** — Dev team needs clear, estimable tickets
- **Acceptance criteria** — QA needs testable conditions tied to roles/permissions
- **Role-based permissions** — Admin vs viewer vs editor behaviors differ
- **Mature product, known jobs** — Feature breakdown, not discovery

### Hybrid Approach (Recommended)

1. Write **jobs stories** in discovery to capture needs.
2. Decompose into **user stories** with acceptance criteria for development.
3. Link user stories back to parent job story for traceability.

```
Job Story (Discovery)
    ↓
Epic (Product backlog)
    ↓
User Stories + Acceptance Criteria (Sprint)
```

## Writing High-Quality Jobs Stories

### Do

- **Ground in research** — Every job story should trace to interview evidence or data.
- **Be specific about the trigger** — "When I'm onboarding" is weak; "When I've completed account setup but haven't invited my first team member" is strong.
- **State outcome, not feature** — "So I can feel confident the payment went through" not "So I can see a confirmation screen."
- **One job per story** — Split compound jobs into separate stories.
- **Include emotional/social outcomes when relevant** — "So I can appear prepared in front of my client."

### Don't

- **Smuggle solutions** — "I want a dashboard" is a solution. "I want to monitor team progress at a glance" is a job.
- **Use fictional personas** — "When Sarah is at her desk..." introduces unnecessary character.
- **Write vague triggers** — "When using the app" provides no design guidance.
- **Confuse job with task** — "I want to click save" is a task. "I want to preserve my work" is a job.

### Quality Checklist

- [ ] Trigger is a real, observable situation
- [ ] Motivation is solution-free
- [ ] Outcome describes progress, not feature usage
- [ ] Story applies to multiple users in same situation (not one persona)
- [ ] Team can imagine 3+ different solutions to this job
- [ ] Evidence link exists (interview quote, analytics, support ticket theme)

## Prioritizing Jobs Stories

### Opportunity Scoring (from ODI/JTBD)

For each job story, rate:
- **Importance:** How critical is this outcome? (1–10)
- **Satisfaction:** How well do current solutions serve it? (1–10)
- **Frequency:** How often does the trigger occur?

**Opportunity Score = Importance + (Importance − Satisfaction)**

Prioritize high-opportunity jobs where importance is high and satisfaction is low.

### Prioritization Matrix

| | High Frequency | Low Frequency |
|---|---|---|
| **High Importance** | Build now | Build next |
| **Low Importance** | Quick wins | Ignore |

## Jobs Stories in Agile Ceremonies

### Backlog Refinement
- Present job story before user story breakdown
- Ask: "Does this user story serve the job?"
- Reject stories that don't connect to a validated job

### Sprint Planning
- Job story remains visible on epic level
- Team estimates user stories derived from job

### Retrospective
- Review: "Did we move the needle on the job outcome metric?"

## Jobs Stories in Backlog Tools

### Jira / Linear Structure

```
Epic: [Job Story Title]
  Description: Full job story + evidence link
  ├── Story: User story derived from job
  ├── Story: User story derived from job
  └── Spike: Research or feasibility task
```

**Custom fields to add:**
- `Job Story ID` — Traceability to discovery research
- `Opportunity Score` — Prioritization from ODI
- `Evidence Link` — Dovetail/Notion research highlight

### Notion Database Properties

| Property | Type | Purpose |
|----------|------|---------|
| Job Story | Title | Short name |
| Situation | Text | "When..." clause |
| Motivation | Text | "I want..." clause |
| Outcome | Text | "So I can..." clause |
| Evidence | URL | Research source |
| Opportunity Score | Number | Prioritization |
| Status | Select | Draft / Validated / In Build / Shipped |
| Linked Epics | Relation | Traceability |

## Anti-Patterns to Avoid

### The Disguised User Story

```
When I'm a project manager using the tool,
I want a Gantt chart view,
So I can manage timelines.
```

This is a feature request with "When" prepended. The situation adds nothing; the motivation names a solution.

**Fix:** Ask "why do they need timeline visibility?" → "When I'm presenting sprint commitments to leadership, I want to show realistic delivery dates with dependencies visible, so I can defend scope decisions with evidence."

### The Orphan Job Story

Job story exists in Notion but sprint stories don't reference it. Dev team builds features disconnected from validated needs.

**Fix:** Make job story ID a required field on epics. Review in backlog refinement.

### The Kitchen Sink Job

```
When I'm using the app,
I want it to be easy and fast and beautiful,
So I can be productive.
```

Too vague to ideate against. Split into specific situational jobs discovered in research.

## Workshop Exercise: User Story → Job Story Conversion

**Duration:** 45 minutes

1. **Inventory** (10 min) — List 10 existing user stories from backlog.
2. **Interrogate** (15 min) — For each, ask:
   - What situation triggers this need?
   - What progress is the user trying to make?
   - What would they do if this feature didn't exist?
3. **Rewrite** (15 min) — Convert top 5 into job stories.
4. **Compare** (5 min) — Which format generates more solution ideas in 2-minute brainstorm?

Teams typically find job stories produce 2–3× more divergent ideas because situation context opens solution space.

## Measuring Job Story Success Post-Launch

Job stories define outcomes, not features. Measure outcome metrics:

| Job Story Outcome | Example Metric |
|-------------------|----------------|
| "So I can decide without switching to laptop" | Mobile task completion rate |
| "So I can onboard without repeating meetings" | Time-to-first-contribution for new members |
| "So I can send money without fear of error" | Transfer error rate + undo usage |
| "So I can appear prepared to client" | Pre-meeting dashboard view rate |

Review metrics 30/60/90 days post-launch. If outcome metric doesn't move, revisit whether the solution serves the job or whether the job story was wrong.

## Integration with Other Frameworks

- **JTBD:** Job stories are the actionable output of switch interviews and job mapping.
- **Lean UX:** Job stories inform hypothesis "For [these users]" section with situational specificity.
- **HMW:** Reframe job story motivation as "How might we help users [motivation] when [situation]?"
- **Double Diamond Define:** Job stories populate the problem definition artifact set.

## Common Mistakes

1. **Renaming user stories** — Changing "As a user" to "When a user" without adding situational depth.

2. **No research backing** — Job stories invented in workshops without user evidence become fiction.

3. **Too many jobs** — Product tries to serve 50 jobs poorly. Cluster and prioritize ruthlessly.

4. **Skipping acceptance criteria** — Job stories alone aren't dev-ready. Decompose for engineering.

5. **Ignoring non-functional jobs** — "Feel secure," "Avoid embarrassment," "Save face with boss" are valid outcomes.

## Case Study: Intercom Messenger

Intercom shifted from user stories to jobs stories for their messenger product. Instead of:

```
As a support agent, I want to see customer history, so I can help faster.
```

They wrote:

```
When a customer replies to a proactive message for the first time,
I want to see what page they were on and what they clicked before messaging,
So I can respond with context instead of asking them to repeat information.
```

This reframing led to **contextual messenger** features (page URL, recent events, company data) rather than a generic CRM sidebar. Support response time dropped 23% because agents no longer asked "what were you trying to do?"

## Templates

### Job Story Card

```markdown
# Job Story: [Short Title]
**ID:** JS-001
**Evidence:** [Interview #, data source]
**Opportunity Score:** [calculated]

## Story
When [situation],
I want to [motivation],
So I can [outcome].

## Current Solutions
- [What users hire today]

## Pain Points
- 

## Possible Directions (not commitments)
1. 
2. 

## Success Metric
[How we'd measure outcome improvement]

## Linked User Stories
- US-101, US-102
```

### Discovery Board Columns

```
[Research Evidence] → [Draft Job Stories] → [Prioritized Jobs] → [Epics/User Stories]
```

## Sources

- Intercom — Starting with Jobs to Be Done: https://www.intercom.com/blog/starting-with-jobs-to-be-done/
- Intercom — Replacing User Stories with Job Stories: https://www.intercom.com/blog/accidentally-invented-job-stories/
- Alan Klement — When Coffee and Kale Compete: https://www.whencoffeeandkalecompete.com/
- Paul Adams — The Dethroning of User Stories: https://insideintercom.io/the-dethroning-of-user-stories/
- Clayton Christensen — Competing Against Luck: https://www.claytonchristensen.com/books/competing-against-luck/
- Basecamp — Shape Up (appetite framing complements jobs): https://basecamp.com/shapeup
- NN/g — Personas vs Jobs-to-be-Done: https://www.nngroup.com/articles/persona-types/
- Thrv — Jobs-to-be-Done Framework: https://thrv.com/jobs-to-be-done
- Intercom on Jobs to Be Done (ebook): https://www.intercom.com/resources/books/intercom-jobs-to-be-done
