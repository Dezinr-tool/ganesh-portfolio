# Lean UX

## Overview

Lean UX is a design methodology introduced by Jeff Gothelf in 2013 that applies Lean Startup and Agile principles to user experience design. It replaces heavy upfront specification with **rapid experimentation**, cross-functional collaboration, and outcome-focused learning.

Core premise: In conditions of uncertainty, the goal is not to deliver perfect designs but to **learn what works** as cheaply and quickly as possible. Design artifacts are hypotheses to be tested, not deliverables to be signed off.

## Core Principles

1. **Outcomes over outputs** — Measure behavior change, not screens shipped.
2. **Cross-functional teams** — Designers, PMs, engineers collaborate daily, not in handoff phases.
3. **Assumptions drive work** — Make beliefs explicit and test the riskiest ones first.
4. **Minimum viable everything** — Smallest artifact that generates learning.
5. **Continuous discovery** — Research is ongoing, not a project phase.
6. **Get out of the building** — Regular user contact, not quarterly research sprints.

## The Lean UX Cycle

```
Think → Make → Check → (repeat)
```

### Think
- Frame the problem and desired outcome
- Identify assumptions
- Write hypotheses
- Prioritize what to test

### Make
- Create minimum viable artifact (sketch, prototype, concierge service, A/B variant)
- Timebox production (hours to days, not weeks)

### Check
- Test with users or measure in production
- Analyze results against success criteria
- Decide: persevere, pivot, or kill

## Assumptions Mapping

Before designing, surface what the team believes to be true.

### Assumption Categories

| Category | Question | Example Assumption |
|----------|----------|-------------------|
| **Desirability** | Do users want this? | "Managers will trust AI-generated summaries" |
| **Viability** | Should we build this for the business? | "Enterprise tier will pay 2× for this feature" |
| **Feasibility** | Can we build and deliver this? | "We can integrate with Salesforce in 2 sprints" |
| **Usability** | Can users figure it out? | "Users will discover the feature without onboarding" |
| **Ethical/Legal** | Should we, legally and morally? | "GDPR allows this data processing" |

### Assumption Mapping Workshop (90 minutes)

1. **Silent brainstorm** (10 min) — Each person writes assumptions on sticky notes.
2. **Cluster** (10 min) — Group by category.
3. **Plot on matrix** (15 min) — X-axis: importance to success. Y-axis: evidence level (low → high).
4. **Prioritize** (10 min) — Top-right quadrant (important + unproven) = test first.
5. **Design experiments** (45 min) — One test per top assumption.

### Assumption Statement Format

```
We believe that [segment]
has a problem with [problem]
and that [solution idea]
will [expected outcome].
We will know we are right when [measurable signal].
```

## Hypothesis Format

Lean UX hypotheses connect problem, solution, and evidence:

### Standard Hypothesis

```
We believe that [building this feature]
For [these users]
Will achieve [this outcome].
We will know we have succeeded when [metric]
Shows [quantitative/qualitative signal].
```

### Example

```
We believe that adding inline code review comments
For senior engineers reviewing PRs
Will reduce review cycle time.
We will know we have succeeded when median time-to-merge
Decreases by 20% within 30 days of launch.
```

### Hypothesis Quality Checklist

- [ ] Names a specific user segment
- [ ] States a measurable outcome (not "improve UX")
- [ ] Defines success criteria before building
- [ ] Can be invalidated (not unfalsifiable)
- [ ] Scoped to testable slice (not entire product vision)

## MVP in Lean UX Context

Minimum Viable Product in Lean UX is the **smallest experiment** that tests the hypothesis—not necessarily a coded product.

### MVP Spectrum (least to most investment)

| Type | Description | When to Use |
|------|-------------|-------------|
| **Conversation** | Manual service delivered via calls/emails | Validate desirability |
| **Wizard of Oz** | User thinks it's automated; human behind scenes | Test workflow before automation |
| **Concierge** | Manual delivery to real customers who pay | Validate willingness to pay |
| **Landing page** | Describe feature; measure sign-ups | Test demand signal |
| **Prototype test** | Clickable mock in usability session | Test usability and comprehension |
| **Feature flag release** | Coded feature to 5% of users | Test behavior in production |
| **A/B test** | Variant vs control in live product | Optimize known flows |

Choose the **lowest fidelity** MVP that can invalidate the riskiest assumption.

## Collaborative Methods

### Design Studio (2–3 hours)

Cross-functional ideation session:
1. Problem framing (15 min)
2. Individual sketching — 6-up or Crazy 8s (20 min)
3. Share and critique (30 min)
4. Dot vote (10 min)
5. Group refine top concept (45 min)
6. Define next experiment (20 min)

### Stand-ups with Design Focus

Daily 15-minute sync includes:
- What did we learn yesterday?
- What experiment runs today?
- Any blockers to user access or data?

### Pair Design

Designer + engineer or designer + PM work together on the same artifact in real time. Reduces handoff waste and surfaces feasibility early.

### Collaborative Research

- PM and engineer join usability sessions (not just designers).
- Shared research repository (Dovetail, Notion) accessible to all.
- "Research of the week" 10-minute share in team meeting.

### Working Agreements

Document team norms:
- Design reviews happen twice weekly, max 30 minutes.
- No pixel critique without user evidence or metric data.
- Every feature ships with analytics instrumentation.
- Assumptions doc updated before sprint planning.

## Lean UX vs Agile UX

| Dimension | Lean UX | Agile UX |
|-----------|---------|----------|
| **Primary goal** | Learn and validate | Deliver working software iteratively |
| **Unit of work** | Hypothesis / experiment | User story / sprint backlog item |
| **Design artifact** | Throwaway prototype | Potentially shippable increment |
| **Research cadence** | Continuous, weekly | Sprint-based, often deferred |
| **Success measure** | Validated learning | Velocity, story completion |
| **Documentation** | Lightweight (assumptions, outcomes) | User stories, acceptance criteria |
| **Team model** | Fully cross-functional, co-located preferred | Design may be separate "resource" |
| **Stakeholder interaction** | Show evidence, not presentations | Sprint reviews with demos |
| **Risk approach** | Test assumptions before building | Build incrementally, refactor later |

**Agile UX** adapts UX activities to fit Scrum/Kanban sprints—designers work one sprint ahead, create specs for dev.

**Lean UX** questions whether the feature should exist at all before sprint commitment.

**Best practice:** Combine them—use Lean UX discovery to validate hypotheses, then Agile UX delivery to build validated features in sprints.

## When to Use Lean UX

**Use when:**
- High uncertainty about problem or solution
- Startup or new product with limited resources
- Feature failure cost is high (reputation, engineering time)
- Team has direct user access
- Organization supports experimentation (can ship and kill features)

**Avoid when:**
- Regulated environments requiring full spec documentation upfront
- Team has no analytics or user research access
- Culture punishes failed experiments
- Maintenance of existing product with no strategic questions (just execute backlog)

## Integration with Other Frameworks

- **Double Diamond:** Lean UX cycles operate inside Develop and Deliver phases.
- **Design Sprint:** A sprint is a compressed Lean UX Think-Make-Check week.
- **JTBD:** Job statements inform hypothesis problem framing.
- **OKRs:** Outcomes in hypotheses map directly to key results.

## Common Mistakes

1. **Lean without learning** — Shipping MVPs but never measuring or reviewing results.

2. **Skipping Think** — Jumping to Make without explicit assumptions. Prototypes test nothing specific.

3. **Hypotheses that can't fail** — "Users will like a better experience" is not testable.

4. **Designer isolation** — Lean UX requires cross-functional participation; solo designer "experiments" revert to mini-waterfall.

5. **Permanent MVPs** — Concierge and Wizard of Oz should graduate to automated solutions or be killed. Don't run manual services for 12 months.

6. **No research ops** — Continuous discovery fails without user recruitment pipeline.

## Case Study: Luxury Escapes (Gothelf)

Gothelf documented Luxury Escapes applying Lean UX to a travel booking feature. The team assumed users wanted personalized hotel recommendations on the homepage.

**Think:** Assumption map flagged "users trust algorithmic recommendations for luxury travel" as high-risk, low-evidence.

**Make:** Wizard of Oz MVP—curated recommendations manually assembled by travel experts, presented as "personalized for you."

**Check:** A/B test vs standard homepage. Manual recommendations increased click-through 12% but **decreased booking conversion 8%**. User interviews revealed luxury travelers distrusted algorithmic curation—they wanted expert human curation explicitly labeled.

**Pivot:** Redesigned as "Expert Picks" with advisor photos and credentials. Booking conversion increased 19%.

**Lesson:** The hypothesis was wrong about the solution format, not the desire for personalization. Lean UX caught this before engineering built a recommendation engine.

## Templates

### Experiment Card

```markdown
# Experiment: [Name]
**Sprint/Week:** 
**Owner:** 
**Status:** Planned / Running / Complete

## Hypothesis
We believe that ...
We will know we are right when ...

## Riskiest Assumption
...

## MVP Type
[ ] Conversation  [ ] Wizard of Oz  [ ] Prototype  [ ] A/B  [ ] Other

## Method
[How we'll test, with whom, sample size]

## Success Criteria
| Metric | Target | Actual |

## Result
**Outcome:** Validated / Invalidated / Inconclusive

## Next Step
Persevere / Pivot / Kill — [Description]

## Learnings
- ...
```

### Weekly Learning Log

```markdown
# Week of [Date]

## Experiments Run
| Experiment | Result | Decision |

## Key Learnings
1. ...

## Updated Assumptions
| Assumption | Previous Confidence | New Confidence | Evidence |

## Next Week Focus
- ...
```

## Sources

- Jeff Gothelf — Lean UX (O'Reilly): https://www.leanuxbook.com/
- Jeff Gothelf & Josh Seiden — Sense and Respond: https://senseandrespondpress.com/
- Jeff Gothelf — Lean UX Canvas: https://www.jeffgothelf.com/blog/lean-ux-canvas/
- Marty Cagan — Inspired (product discovery overlap): https://www.svpg.com/inspired-how-to-create-products-customers-love/
- Teresa Torres — Continuous Discovery Habits: https://www.producttalk.org/continuous-discovery-habets/
- Lean Startup — Build-Measure-Learn: https://theleanstartup.com/principles
- Nielsen Norman Group — Lean UX Documentation: https://www.nngroup.com/articles/lean-ux/
