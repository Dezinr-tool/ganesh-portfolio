# Double Diamond Framework

## Overview

The Double Diamond is a visual model of the design process developed by the British Design Council in 2005. It describes four distinct phases—Discover, Define, Develop, and Deliver—organized into two diamonds representing divergent and convergent thinking. The first diamond focuses on finding the right problem; the second focuses on finding the right solution.

The framework is intentionally non-linear. Teams loop back within phases, revisit earlier insights, and iterate as new evidence emerges. It is one of the most widely adopted process models in product design, service design, and innovation consulting because it balances exploration with decision-making discipline.

## The Four Phases

### Phase 1: Discover (Diverge)

**Goal:** Expand understanding of the problem space through research and observation.

**Activities:**
- Stakeholder interviews and contextual inquiry
- Ethnographic observation and field studies
- Competitive and analogous market analysis
- Data review (analytics, support tickets, sales feedback)
- Literature and desk research
- Journey mapping of current-state experiences

**Outputs:**
- Research synthesis and insight themes
- Personas or archetypes (used cautiously, not as stereotypes)
- Opportunity areas and problem hypotheses
- Evidence-backed pain points

**Mindset:** Curiosity over certainty. Resist jumping to solutions. Ask "what is happening?" before "what should we build?"

### Phase 2: Define (Converge)

**Goal:** Synthesize discoveries into a clear, actionable problem statement and design brief.

**Activities:**
- Affinity mapping and thematic clustering
- "How Might We" (HMW) reframing workshops
- Problem statement drafting and critique
- Success criteria and metrics definition
- Scope boundary setting (in/out of scope)
- Design principles articulation

**Outputs:**
- Point-of-view (POV) statement
- Design brief or creative brief
- Prioritized opportunity backlog
- Research-backed problem definition (not solution disguised as problem)

**Mindset:** Clarity over comprehensiveness. A sharp problem statement beats a vague one that tries to solve everything.

### Phase 3: Develop (Diverge)

**Goal:** Generate and explore a wide range of possible solutions.

**Activities:**
- Ideation workshops (brainstorming, Crazy 8s, SCAMPER)
- Concept sketching and storyboarding
- Low-fidelity prototyping (paper, wireframes, clickable mocks)
- Design studio critiques
- Technical feasibility spikes
- Co-design sessions with users or stakeholders

**Outputs:**
- Multiple concept directions (typically 3–5)
- Prototypes at increasing fidelity
- Assumption lists attached to each concept
- Early usability feedback

**Mindset:** Quantity before quality in early rounds. Defer judgment until enough options exist to compare.

### Phase 4: Deliver (Converge)

**Goal:** Refine, test, and launch the chosen solution with measurable outcomes.

**Activities:**
- High-fidelity prototyping and visual design
- Usability testing (moderated and unmoderated)
- A/B testing and beta releases
- Accessibility audits (WCAG compliance)
- Handoff documentation for engineering
- Launch planning, rollout, and post-launch monitoring

**Outputs:**
- Production-ready designs and specifications
- Test reports with actionable findings
- Launch metrics dashboard
- Iteration backlog based on live data

**Mindset:** Evidence over preference. Ship learning, not perfection. Plan for iteration after launch.

## When to Use the Double Diamond

| Situation | Fit |
|-----------|-----|
| New product or feature with unclear problem | Excellent |
| Redesign of existing experience with known pain points | Good (shorten Discover) |
| Incremental UI polish on stable product | Poor fit (too heavy) |
| Cross-functional alignment needed | Excellent |
| Regulated or high-stakes domains (healthcare, finance) | Excellent (documentation trail) |
| Hackathon or 48-hour sprint | Poor fit (compress to single diamond) |

**Use when:** The team lacks shared understanding of the problem, stakeholders disagree on priorities, or previous solution-first attempts failed.

**Avoid when:** The problem is validated, scope is fixed, and execution speed is the only constraint—in that case, lean toward delivery-focused frameworks (Lean UX, Agile sprints).

## Tools by Phase

### Discover
- Miro / FigJam (affinity mapping, journey maps)
- Dovetail / Notion (research repository)
- Hotjar / FullStory (behavioral analytics)
- UserTesting / Maze (remote observation)
- Otter.ai (interview transcription)

### Define
- Miro HMW boards
- Jobs-to-be-Done canvas
- Impact/Effort matrix
- OKR alignment worksheets
- Design brief templates (see Templates section)

### Develop
- Figma (wireframes → high-fidelity)
- Paper prototyping kits
- Principle / ProtoPie (interaction prototypes)
- Design critique frameworks (I like, I wish, What if)

### Deliver
- Maze / UserTesting (usability tests)
- LaunchDarkly / Optimizely (feature flags, A/B)
- Storybook (component documentation)
- Linear / Jira (handoff tracking)
- Datadog / Amplitude (post-launch analytics)

## Common Mistakes

1. **Skipping Discover and Define** — Teams jump to wireframes because stakeholders want screens. Result: elegant solutions to the wrong problem.

2. **Treating diamonds as waterfalls** — Completing Discover once and never returning. Real projects require loops; new data in Deliver should trigger mini-Discover cycles.

3. **Converging too early** — Stakeholders pick a direction after one ideation session. Insufficient Develop exploration leads to local maxima.

4. **Weak problem statements** — "Users want a better dashboard" is not a problem statement. Better: "Finance managers spend 45 minutes daily reconciling data across three tools because export formats are incompatible."

5. **Research theater** — Running interviews without synthesis. Discover produces raw notes, not insights, without Define work.

6. **Ignoring engineering constraints until Deliver** — Feasibility should inform Develop, not block launch at the last minute.

7. **No success metrics** — Deliver phase lacks measurable criteria, making it impossible to know if the design worked.

## Case Study: NHS Digital Service Redesign

The British Design Council documented NHS service redesigns using the Double Diamond. A patient appointment booking flow suffered from high call-center volume and missed appointments.

**Discover:** Ethnographic visits to GP clinics, patient interviews, call-center shadowing. Key insight: patients didn't miss appointments from forgetfulness—they lacked confidence about location, parking, and what to bring.

**Define:** Reframed problem from "reduce no-shows" to "increase appointment confidence." Success metric: reduction in pre-appointment support calls.

**Develop:** Explored SMS reminders, interactive maps, checklist emails, and a pre-visit video. Prototyped five concepts with paper and clickable mocks.

**Deliver:** Rolled out a pre-visit digital pack (map, checklist, parking info) via SMS link. No-show rate dropped 18% in pilot clinics; support calls fell 32%.

**Lesson:** The original brief ("send more reminders") was a solution. Discover revealed the actual job: building confidence before the visit.

## Templates

### Design Brief Template

```markdown
# Design Brief: [Project Name]

## Background
[Business context, why now]

## Problem Statement
[Who] needs [need] because [insight/evidence].

## Target Users
[Primary and secondary segments with evidence]

## Goals & Success Metrics
- Primary: [metric + target]
- Secondary: [metric + target]

## Scope
**In scope:** ...
**Out of scope:** ...

## Constraints
[Technical, legal, timeline, brand]

## Design Principles
1. ...
2. ...

## Stakeholders
| Name | Role | Decision authority |

## Timeline & Milestones
| Phase | Dates | Deliverable |

## Open Questions
- ...
```

### Phase Gate Checklist

```markdown
## Discover → Define Gate
- [ ] Minimum 8 user/stakeholder touchpoints completed
- [ ] Insights synthesized into themes (not raw quotes only)
- [ ] Problem statement reviewed by PM, design, engineering
- [ ] Success metrics agreed with stakeholder

## Define → Develop Gate
- [ ] Problem statement passes "solution-free" test
- [ ] Scope document signed off
- [ ] Assumptions list created and prioritized

## Develop → Deliver Gate
- [ ] At least 2 concepts tested with users
- [ ] Feasibility review with engineering complete
- [ ] Accessibility requirements documented

## Deliver → Launch Gate
- [ ] Usability test pass rate meets threshold
- [ ] Analytics instrumentation verified
- [ ] Rollback plan documented
```

### Research Synthesis Template

```markdown
## Insight: [Title]
**Evidence:** [Quotes, data points, observation count]
**Implication:** [What this means for design]
**Opportunity:** [HMW reframing]
**Confidence:** High / Medium / Low
**Source:** [Interview ID, date]
```

## Combining with Other Frameworks

- **+ Jobs-to-be-Done:** Use JTBD interviews in Discover; job statements in Define.
- **+ Design Sprint:** Compress both diamonds into a 5-day sprint for time-boxed validation.
- **+ Lean UX:** Run Build-Measure-Learn loops inside Develop and Deliver.
- **+ Triple Diamond:** Add a validation diamond before Discover when problem validity is uncertain.

## Sources

- British Design Council — Double Diamond: https://www.designcouncil.org.uk/our-resources/the-double-diamond/
- Design Council — Eleven Lessons: Managing Design in Eleven Global Brands (PDF): https://www.designcouncil.org.uk/fileadmin/uploads/dc/Documents/Design_Council_Managing_Design_Report.pdf
- Dan Nessler — How to Apply the Double Diamond to UX Design: https://medium.com/@dnessis/how-to-apply-a-design-thinking-hcd-ux-or-any-creative-process-from-scratch-b8786efbf812
- Nielsen Norman Group — UX Research Methods Overview: https://www.nngroup.com/articles/which-ux-research-methods/
- IDEO — Design Thinking: https://designthinking.ideo.com/
- Interaction Design Foundation — Double Diamond: https://www.interaction-design.org/literature/article/double-diamond-model
