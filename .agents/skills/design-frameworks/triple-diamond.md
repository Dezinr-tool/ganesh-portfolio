# Triple Diamond Framework

## Overview

The Triple Diamond extends the British Design Council's Double Diamond by adding a third diamond focused on **problem validation** before the traditional Discover–Define work begins. Where the Double Diamond assumes the team is solving the right category of problem, the Triple Diamond explicitly asks: **Is this problem worth solving at all?**

The model is especially valuable in startup contexts, innovation labs, and enterprise teams exploring new markets where initial problem framing may be based on assumptions rather than evidence.

## The Three Diamonds

```
[Validation Diamond] → [Problem Diamond] → [Solution Diamond]
     Is it worth              What is              What is
     solving?                   the problem?         the solution?
```

### Diamond 1: Problem Validation (Diverge → Converge)

**Diverge — Explore the opportunity space:**
- Market sizing and trend analysis
- Stakeholder and expert interviews
- Competitive landscape mapping
- Assumption mapping workshops
- Lean canvas or business model canvas drafting
- Early concept testing with landing pages or smoke tests

**Converge — Decide whether to proceed:**
- Go / No-Go / Pivot decision
- Validated problem hypothesis
- Initial business case or value proposition
- Risk register with top assumptions to test

**Key question:** Should we invest in understanding this problem deeply?

### Diamond 2: Problem Definition (Discover → Define)

This mirrors the first diamond of the Double Diamond model.

**Discover:** Deep user research, ethnography, data analysis, journey mapping.

**Define:** Synthesis into problem statements, design briefs, success metrics.

**Key question:** What exactly is the problem, for whom, and why does it matter?

### Diamond 3: Solution Development (Develop → Deliver)

This mirrors the second diamond of the Double Diamond model.

**Develop:** Ideation, prototyping, concept testing.

**Deliver:** Refinement, build, launch, measurement, iteration.

**Key question:** What is the best solution, and does it work in the real world?

## Problem Validation Diamond — Deep Dive

The validation diamond is the distinguishing feature. It prevents teams from spending months on user research for problems that lack market viability, strategic alignment, or organizational appetite.

### Validation Activities

| Activity | Purpose | Typical Duration |
|----------|---------|------------------|
| Assumption mapping | Surface beliefs that need testing | 2–4 hours |
| Problem interviews (5–10) | Confirm pain exists and is prioritized | 1–2 weeks |
| Landing page test | Measure demand signal | 3–5 days |
| Wizard of Oz prototype | Test solution appetite without building | 1–2 weeks |
| Concierge MVP | Deliver service manually to validate value | 2–4 weeks |
| Stakeholder alignment workshop | Confirm organizational commitment | 1 day |

### Validation Criteria (Go/No-Go)

Proceed to Diamond 2 when at least three of the following are true:

1. **Pain is frequent and severe** — Users actively seek workarounds or pay for partial solutions.
2. **Market or strategic fit** — Problem aligns with business goals and reachable audience.
3. **Differentiation potential** — Existing solutions leave meaningful gaps.
4. **Feasibility signal** — Engineering or operations can deliver a viable solution within constraints.
5. **Stakeholder commitment** — Leadership provides resources, not just verbal support.

Pause or pivot when:
- Users acknowledge the pain but won't change behavior to address it.
- Market is too small or too crowded with entrenched incumbents.
- Regulatory or technical barriers make delivery impractical.
- Internal politics block adoption regardless of user value.

## Triple Diamond vs Double Diamond

| Dimension | Double Diamond | Triple Diamond |
|-----------|---------------|----------------|
| Starting assumption | Problem space is roughly correct | Problem space may be wrong |
| Upfront investment | Research-first | Validation-first |
| Best for | Known domains, redesigns, mature products | New ventures, innovation, ambiguous briefs |
| Time to first decision | After Define phase | After Validation diamond |
| Risk addressed | Wrong solution | Wrong problem + wrong solution |
| Stakeholder artifact | Design brief | Business case + design brief |
| Failure mode | Elegant wrong product | Faster kill of bad bets |

**When to choose Triple over Double:**
- Executive asks "should we even build this?"
- Team has multiple problem hypotheses, not one
- Previous products in this space failed for unclear reasons
- Budget is limited and must be allocated carefully

**When Double is sufficient:**
- Problem is validated by existing data (support volume, churn, NPS drivers)
- Regulatory or contractual mandate to deliver
- Iteration on proven product with clear user base

## Phases in Detail

### Phase 0: Frame (Pre-Diamond)

Before any diamond work, align on:
- Strategic intent (grow, retain, enter market, reduce cost)
- Constraints (budget, timeline, team size)
- Decision-makers and their criteria
- What "success" means at validation, problem, and solution stages

### Validation Diverge (Week 1–2)

- Run 8–12 discovery interviews across user segments AND non-users
- Map existing alternatives (including non-consumption and DIY workarounds)
- Document jobs-to-be-done and outcome expectations
- Build assumption map: desirability, viability, feasibility

### Validation Converge (Week 2–3)

- Score assumptions by risk and uncertainty
- Design cheapest tests for top 3 assumptions
- Run smoke tests or concierge experiments
- Present Go/No-Go recommendation with evidence

### Problem Diamond (Week 3–8)

Standard Double Diamond first half:
- Deep contextual research with validated segment
- Define sharp problem statement tied to business metrics
- Create research-backed personas or job-based segments

### Solution Diamond (Week 8+)

Standard Double Diamond second half:
- Ideate broadly, prototype, test, iterate
- Launch with instrumentation
- Feed learnings back to validation criteria for future projects

## Tools by Diamond

### Validation Diamond
- **Strategyzer** — Business Model Canvas, Value Proposition Canvas
- **Miro** — Assumption mapping, Lean Canvas
- **Typeform + Carrd** — Landing page validation
- **Calendly + Zoom** — Problem interview scheduling
- **Notion** — Evidence log and decision documentation
- **Google Trends / Statista** — Market signal research

### Problem Diamond
- **Dovetail** — Research repository
- **Miro / FigJam** — Journey maps, affinity diagrams
- **Hotjar / Mixpanel** — Behavioral data
- **Jobs-to-be-Done interview scripts** (see jobs-to-be-done.md)

### Solution Diamond
- **Figma** — Prototyping pipeline
- **Maze / UserTesting** — Usability validation
- **LaunchDarkly** — Gradual rollout
- **Amplitude / PostHog** — Product analytics

## Common Mistakes

1. **Validation theater** — Running a landing page test without interviewing users. Clicks measure curiosity, not pain.

2. **Skipping validation because "we already know"** — Executive conviction is not evidence. Validation diamond can be fast (1–2 weeks) if scoped correctly.

3. **Treating No-Go as failure** — Killing a bad bet early is success. Document learnings for organizational memory.

4. **Over-investing in validation** — Validation should be the cheapest diamond. If it takes longer than problem definition, scope is wrong.

5. **Ignoring viability in validation** — Desirable but unprofitable or undeployable solutions should fail in Diamond 1, not after a full build.

6. **Linear rigidity** — Learnings in Solution diamond often invalidate problem assumptions. Loop back to Validation or Problem diamonds explicitly.

## Facilitation Tips

- Use a **pre-mortem** at validation converge: "It's six months later and this failed. Why?"
- Assign a **devil's advocate** role in Go/No-Go sessions to counter optimism bias.
- Require **evidence tiers** in decision docs: anecdote → pattern → quantitative → causal.
- Timebox validation to **2–4 weeks** unless regulated domain requires more.

## Case Study: B2B SaaS Feature Exploration

A project management tool team proposed "AI-powered task prioritization" for enterprise customers.

**Validation Diamond (2 weeks):**
- 10 interviews with engineering managers revealed they don't trust black-box prioritization—they want explainability.
- Landing page A/B: "AI prioritizes your tasks" vs "See why tasks rank where they do" — explainability variant converted 3× higher.
- Assumption map flagged "users will delegate prioritization" as high-risk, invalidated.
- **Decision:** Go, but reframe from "auto-prioritize" to "transparent prioritization assistant."

**Problem Diamond (4 weeks):**
- Research focused on decision anxiety and meeting prep, not task volume.
- Problem statement: "Engineering managers need to justify sprint priorities to stakeholders but lack a shared evidence base."

**Solution Diamond (8 weeks):**
- Prototype showed ranking with rationale citations (linked commits, blockers, dependencies).
- Usability test: 8/10 participants said they'd use it in sprint planning.
- Launched as beta; 34% weekly active usage among invited cohort within 6 weeks.

**Lesson:** Validation diamond prevented building a feature users would have rejected (opaque AI) and reframed the problem before expensive research and design.

## Templates

### Go/No-Go Decision Document

```markdown
# Validation Decision: [Project Name]
**Date:** 
**Decision:** GO / NO-GO / PIVOT

## Problem Hypothesis
[Statement]

## Evidence Summary
| Assumption | Test Method | Result | Confidence |
|------------|-------------|--------|------------|

## Market & Strategy Fit
[Alignment with business goals]

## Risks if Proceeding
1. ...

## Risks if Stopping
1. ...

## Recommended Next Step
[Which diamond, what scope, what timeline]

## Dissenting Views
[Document disagreement for transparency]
```

## Sources

- British Design Council — Double Diamond (foundation): https://www.designcouncil.org.uk/our-resources/the-double-diamond/
- Strategyzer — Testing Business Ideas: https://www.strategyzer.com/books/testing-business-ideas
- Eric Ries — The Lean Startup (validation concepts): https://theleanstartup.com/
- Teresa Torres — Continuous Discovery Habits: https://www.producttalk.org/continuous-discovery-habits/
- Dan Olsen — The Lean Product Playbook: https://leanproductplaybook.com/
- Product Talk — Opportunity Solution Tree: https://www.producttalk.org/opportunity-solution-tree/
- NN/g — The Problem with the Double Diamond: https://www.nngroup.com/articles/double-diamond/
