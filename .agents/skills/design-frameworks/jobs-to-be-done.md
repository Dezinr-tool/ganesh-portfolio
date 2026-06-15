# Jobs-to-be-Done (JTBD)

## Overview

Jobs-to-be-Done is a theory of customer behavior that explains why people "hire" products and services to make progress in their lives. Pioneered by Clayton Christensen and operationalized for product development by Tony Ulwick and Strategizer, JTBD shifts focus from demographics and product features to the **underlying job** a person is trying to accomplish.

Core insight: People don't buy a quarter-inch drill; they buy a quarter-inch hole—or more accurately, they want to hang a picture to feel proud of their home. The job is the progress seeker, not the product category.

## Core Concepts

### The Job Statement

A job is defined by three components:

```
When [situation/context], I want to [motivation/action], so I can [expected outcome].
```

Example:
> When I'm preparing for a client presentation, I want to quickly assemble credible data visualizations, so I can appear knowledgeable and win the account.

### Job Types

| Type | Description | Example |
|------|-------------|---------|
| **Functional** | Practical task completion | "Transfer money to my vendor" |
| **Emotional** | Feelings desired or avoided | "Feel confident I'm not overpaying" |
| **Social** | How others perceive the user | "Look like a tech-savvy manager" |

Most significant jobs blend all three types. Emotional and social dimensions often drive switching behavior more than functional gaps.

### Outcome-Driven Innovation (ODI)

Tony Ulwick's ODI methodology treats jobs as stable over time while solutions change. It identifies:

- **Desired outcomes** — Metrics customers use to judge success (speed, reliability, predictability)
- **Underserved outcomes** — High importance, low satisfaction (innovation opportunities)
- **Overserved outcomes** — Low importance, high satisfaction (commoditization risk)

ODI uses quantitative surveys to score outcomes, prioritizing where to innovate based on data rather than intuition.

## Job Mapping

A job map breaks a job into discrete steps, independent of current solutions. Universal job steps (Ulwick):

1. **Define** — Determine goals and plan
2. **Locate** — Gather inputs and resources needed
3. **Prepare** — Set up the environment
4. **Confirm** — Validate readiness
5. **Execute** — Perform the core job
6. **Monitor** — Track progress and quality
7. **Modify** — Adjust as conditions change
8. **Conclude** — Finish and evaluate

### Job Map Example: "Prepare a weekly team status update"

| Step | Current Pain | Opportunity |
|------|-------------|-------------|
| Define | Unclear what stakeholders care about | Template aligned to audience |
| Locate | Data scattered across Jira, Slack, email | Unified data pull |
| Prepare | Manual screenshot assembly | Auto-generated summaries |
| Confirm | No preview of stakeholder reaction | AI tone check |
| Execute | Writing takes 90 minutes | Draft generation |
| Monitor | Don't know if update was read | Read receipts / engagement |
| Modify | Late-breaking news requires rewrite | Live-linked sections |
| Conclude | No archive of past updates | Searchable history |

## JTBD Interviews

JTBD interviews differ from traditional user interviews. They reconstruct the **timeline of a purchase or switching decision** rather than asking about product preferences.

### Interview Structure (45–60 minutes)

1. **First thought** — "When did you first think you needed something different?"
2. **Passive looking** — "What triggered you to start paying attention?"
3. **Active looking** — "When did you seriously start searching?"
4. **Deciding** — "What options did you consider? What almost stopped you?"
5. **Consuming** — "What happened when you first used it?"
6. **Anxiety and habit** — "What worried you? What old habit did you leave behind?"

### Interview Rules

- Interview people who switched in the last 90 days (fresh memory).
- Focus on a **specific instance**, not general habits.
- Ask about behavior, not hypotheticals ("What did you do?" not "What would you want?").
- Probe forces: push (pain with current), pull (attraction to new), anxiety (fear of new), inertia (comfort with old).

### Sample Questions

- "Walk me through the day you decided to switch."
- "What were you using before? What wasn't working?"
- "Did you talk to anyone before deciding? What did they say?"
- "What almost made you NOT switch?"
- "What happened the first week after you switched?"

## Switch Interviews

Switch interviews (Bob Moesta, Re-Wired Group) are the primary JTBD research method. They study the **moment of change**—when someone fires an old solution and hires a new one.

### Forces Diagram

```
                    PUSH (pain)
                         ↓
    OLD WAY ─────────────────────→ NEW WAY
                         ↑
                    PULL (appeal)

    ANXIETY (new) ←──────→ INERTIA (old habit)
```

**Analysis process:**
1. Map the four forces for each interviewee.
2. Identify which force was strongest in triggering the switch.
3. Cluster switches by triggering circumstance, not demographics.
4. Design interventions: reduce anxiety, increase push awareness, strengthen pull, lower switching cost.

### Switch Interview Output Template

```markdown
## Switch Instance: [Product/Service Change]
**Date of switch:** 
**Previous solution:** 
**New solution:** 

### Timeline
- First thought: 
- Passive looking: 
- Active looking: 
- Purchase/decision moment: 

### Forces
- Push: 
- Pull: 
- Anxiety: 
- Inertia: 

### Job Statement
When ..., I want ..., so I can ...
```

## JTBD vs Personas

| Dimension | Personas | Jobs-to-be-Done |
|-----------|----------|-----------------|
| Segmentation basis | Demographics, psychographics | Circumstance and motivation |
| Stability | Update when market shifts | Jobs stable; solutions change |
| Design implication | "Sarah, 34, likes yoga" | "When onboarding remotely, want to feel connected" |
| Risk | Stereotyping, false precision | Abstract if not tied to real stories |
| Best artifact | Empathy maps, persona cards | Job maps, switch timelines, outcome scores |
| Research method | Broad interviews, surveys | Switch interviews, outcome surveys |

**They complement each other:** Use JTBD for strategy and prioritization; use personas (sparingly) for communication and scenario writing—always grounded in job evidence, not fiction.

## When to Use JTBD

**Use when:**
- Understanding why customers switch or churn
- Entering a market with entrenched incumbents
- Feature prioritization feels arbitrary
- Multiple user types share a product but have different motivations
- Innovation team needs opportunity areas backed by outcome data

**Avoid when:**
- Usability of existing UI is the primary question (use usability testing)
- Problem is well-defined and execution is the bottleneck
- Team treats JTBD as jargon without conducting switch interviews

## Outcome Statement Format

Ulwick's precise outcome format:

> **[Direction] + [Metric] + [Object of control] + [Contextual clarifier]**

Example:
> Minimize the time it takes to identify discrepancies in expense reports.

Direction verbs: Minimize, Increase, Decrease, Maximize, Reduce.

Outcome statements must be **solution-free**, **stable over time**, and **measurable**.

## Applying JTBD in Product Development

### Discovery
- Conduct 6–12 switch interviews per segment hypothesis.
- Build job maps from interview timelines.
- Survey to quantify outcome importance vs satisfaction (ODI).

### Prioritization
- Plot outcomes on Opportunity Score = Importance + (Importance − Satisfaction).
- Target underserved outcomes for innovation; overserved for cost reduction.

### Solution Design
- Generate concepts that address top underserved outcomes.
- Test whether concepts reduce anxiety and inertia forces.

### Messaging
- Write marketing copy around the job, not features.
- "Finish client reports in half the time" beats "AI-powered analytics dashboard."

## Common Mistakes

1. **Job statements that smuggle solutions** — "Use a mobile app to track expenses" is not a job.

2. **Demographic segmentation disguised as JTBD** — "Millennials want convenience" is not a job.

3. **Skipping switch interviews** — Reading about JTBD without doing the research produces platitudes.

4. **Too many jobs** — A product should serve 1–2 core jobs excellently, not 10 poorly.

5. **Ignoring emotional/social jobs** — Functional parity doesn't explain why users switch.

6. **Static job maps** — Jobs don't change often, but circumstances do. Refresh when market shifts.

## Case Study: Snickers "You're Not You When You're Hungry"

Christensen's classic JTBD example: Snickers competes not with candy bars but with **hunger satisfaction during inconvenient moments**. The job is "sustain my energy until my next meal without slowing me down."

This reframing shifted marketing from indulgence (competing with Twix) to functional hunger relief (competing with bananas, granola bars, and ignoring hunger). Campaign revenue increased significantly because the job framing expanded the addressable moment.

## Templates

### Job Canvas

```markdown
# Job Canvas: [Job Name]

## Job Statement
When ..., I want ..., so I can ...

## Job Type
Functional / Emotional / Social (check all)

## Current Solutions Hired
1. ...
2. ...

## Success Criteria (Outcomes)
| Outcome | Importance (1-10) | Satisfaction (1-10) | Opportunity |
|---------|-------------------|---------------------|-------------|

## Forces
- Push: 
- Pull: 
- Anxiety: 
- Inertia: 

## Non-Consumption
[When do people NOT hire any solution?]
```

## Sources

- Clayton Christensen — Competing Against Luck: https://www.claytonchristensen.com/books/competing-against-luck/
- Tony Ulwick — Jobs to be Done (Strategizer): https://jobs-to-be-done.com/
- Tony Ulwick — What Is Jobs-to-be-Done?: https://strategyn.com/jobs-to-be-done/
- Bob Moesta & Chris Spiek — The Jobs To Be Done Playbook: https://www.rewiredgroup.com/
- Intercom — All About Jobs-to-be-Done: https://www.intercom.com/resources/books/intercom-jobs-to-be-done
- Christensen Institute — Jobs to Be Done Theory: https://www.christenseninstitute.org/theory/jobs-to-be-done/
- Alan Klement — When Coffee and Kale Compete: https://www.whencoffeeandkalecompete.com/
