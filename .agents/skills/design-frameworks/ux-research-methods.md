# UX Research Methods — Full Taxonomy

## Overview

UX research encompasses the methods and practices used to understand users, validate designs, and measure outcomes. This guide provides a comprehensive taxonomy of research methods, classification frameworks, selection criteria, and practical guidance on sample sizes and execution.

Effective research strategy matches method to question, phase, and resource constraints. No single method answers every question.

## Classification Frameworks

### 1. Attitudinal vs Behavioral

| Type | What It Measures | Methods |
|------|-----------------|---------|
| **Attitudinal** | What people say they think, feel, believe | Interviews, surveys, focus groups, card sorts (preferences) |
| **Behavioral** | What people actually do | Analytics, A/B tests, eye tracking, usability tests, ethnography |

**Key insight:** Users reliably report preferences but poorly predict behavior. Combine both types. Say-do gap is real.

### 2. Qualitative vs Quantitative

| Type | Output | Methods |
|------|--------|---------|
| **Qualitative** | Themes, quotes, narratives, "why" | Interviews, contextual inquiry, diary studies, usability tests (moderated) |
| **Quantitative** | Numbers, statistics, "how many/how much" | Surveys, analytics, A/B tests, tree tests, unmoderated usability |

**Key insight:** Qualitative explains; quantitative measures. Discovery is often qual-heavy; validation is often quant-heavy.

### 3. Moderated vs Unmoderated

| Type | Description | Trade-offs |
|------|-------------|------------|
| **Moderated** | Researcher present, can probe and clarify | Rich data, expensive, small samples |
| **Unmoderated** | Participant completes alone, async | Scalable, less depth, platform-dependent |

### 4. Generative vs Evaluative

| Type | Phase | Question | Methods |
|------|-------|----------|---------|
| **Generative** | Discover/Define | "What problems exist?" | Interviews, ethnography, diary studies, contextual inquiry |
| **Evaluative** | Develop/Deliver | "Does this solution work?" | Usability testing, A/B tests, tree tests, benchmark studies |

### 5. Remote vs In-Person

| Context | Best For | Limitations |
|---------|----------|-------------|
| **In-person** | Ethnography, contextual inquiry, physical products | Cost, geography |
| **Remote** | Interviews, unmoderated tests, surveys | Miss environmental context |

## Method Selection Matrix

| Question Type | Recommended Methods |
|---------------|-------------------|
| "Who are our users and what do they need?" | Interviews, contextual inquiry, diary studies |
| "Why do users churn?" | Switch interviews (JTBD), exit surveys, session replay |
| "Can users complete this task?" | Usability testing (moderated or unmoderated) |
| "Which design performs better?" | A/B testing, preference testing |
| "How should we organize content?" | Card sort, tree test |
| "What do users look at?" | Eye tracking, click heatmaps |
| "How do users behave over time?" | Diary studies, longitudinal analytics |
| "Is our product usable compared to competitors?" | Benchmark usability study |
| "Quick feedback in the field?" | Guerrilla testing |

## Methods in Detail

### User Interviews

**Type:** Qualitative, attitudinal (with behavioral probes), generative, moderated

**Description:** One-on-one structured or semi-structured conversations exploring user experiences, needs, and mental models.

**When to use:**
- Early discovery with unclear problem space
- Exploring "why" behind analytics data
- JTBD switch interviews
- After usability tests to probe specific behaviors

**When NOT to use:**
- Validating visual preference at scale (use survey)
- Testing task completion rates (use usability test)

**Sample size:** 5–8 per segment for saturation (patterns emerge). 12–15 if segments are diverse.

**Duration:** 45–60 minutes

**Tips:**
- Use open-ended questions; avoid leading
- Ask about past behavior, not hypotheticals
- Silence is productive—wait for elaboration
- Record with consent; take a note-taker or use transcription

### Contextual Inquiry

**Type:** Qualitative, behavioral, generative, moderated, often in-person

**Description:** Observe users in their natural environment while they perform real tasks. Researcher asks clarifying questions in context.

**When to use:**
- Complex workflows (healthcare, enterprise software)
- Understanding environmental constraints
- Physical-digital hybrid experiences

**Sample size:** 4–6 contextual sessions (each 2–4 hours)

**Tips:**
- Minimal interference—observe first, ask later
- Capture artifacts (documents, tools, workarounds)
- Include "master-apprentice" model: user teaches researcher their process

### Surveys

**Type:** Quantitative (can include open-ended qual), attitudinal, generative or evaluative, unmoderated

**Description:** Structured questionnaire distributed to a sample population.

**When to use:**
- Measuring satisfaction (CSAT, NPS, SUS)
- Prioritizing features at scale
- Segmenting user base
- Validating qual findings quantitatively

**When NOT to use:**
- Exploring unknown problem spaces (don't know what to ask)
- Small user bases (< 30 responses = unreliable)

**Sample size:**
- Descriptive stats: 100+ responses for population estimates
- Comparison between groups: 30+ per group minimum
- MaxDiff/conjoint: 200–400+

**Tips:**
- Keep under 10 minutes (5 preferred)
- Avoid double-barreled questions
- Use validated scales (SUS, NPS, CSAT) when applicable
- Pilot with 5 people before launch

### Usability Testing

**Type:** Evaluative; qual (moderated) or quant (unmoderated); behavioral

**Description:** Users attempt realistic tasks with a prototype or live product while researcher observes.

**When to use:**
- Validating new designs before launch
- Identifying friction in existing flows
- Comparing design alternatives (within-subjects or between-subjects)

**Moderated sample size:** 5–8 per round (Nielsen: 5 finds 85% of issues)

**Unmoderated sample size:** 20–50 for quantitative metrics (time on task, success rate)

**Metrics:**
- Task success rate (%)
- Time on task
- Error rate
- Satisfaction (post-task SUS or single ease question)
- Severity-rated findings

**Tips:**
- Write realistic scenarios, not instructions ("You're planning a trip..." not "Click the search button")
- Don't help unless testing is blocked
- Measure silently; debrief after
- Run multiple rounds—fix and retest

### Card Sorting

**Type:** Qual/quant hybrid, attitudinal, generative, moderated or unmoderated

**Description:** Participants organize topics/labels into groups that make sense to them, revealing mental models for information architecture.

**Variants:**
- **Open sort:** Users create own group names
- **Closed sort:** Users place items into predefined categories
- **Hybrid:** Predefined categories + option to create new

**When to use:**
- Designing navigation and site structure
- Reorganizing content-heavy products
- Validating IA before tree testing

**Sample size:** 15–30 participants (unmoderated); 8–12 (moderated with think-aloud)

**Analysis:** Similarity matrix, dendrograms (optimal sort tools: Optimal Workshop, Miro)

### Tree Testing (Reverse Card Sort)

**Type:** Quantitative, behavioral, evaluative, unmoderated

**Description:** Users navigate a text-only hierarchy to find items, testing IA without visual design influence.

**When to use:**
- Validating navigation structure before design
- Diagnosing "can't find it" problems
- Comparing IA alternatives

**Sample size:** 50–100 per tree variant

**Metrics:**
- Success rate (% found correct location)
- Directness (% took optimal path)
- Time to completion
- First-click accuracy

**Tools:** Optimal Workshop Treejack, Maze

### A/B Testing

**Type:** Quantitative, behavioral, evaluative, unmoderated

**Description:** Randomly split live traffic between two (or more) variants; measure conversion on key metrics.

**When to use:**
- Optimizing known flows with sufficient traffic
- Validating single-variable design changes
- Resolving stakeholder design debates with data

**When NOT to use:**
- Low traffic (< 1000 conversions/week per variant)
- Major redesigns (too many variables)
- Ethically sensitive changes without informed consent

**Sample size:** Calculate with power analysis. Typical: 1–4 weeks of traffic depending on baseline conversion rate. Use Evan Miller's calculator or Optimizely stats engine.

**Tips:**
- One primary metric per test
- Run full business cycles (include weekdays/weekends)
- Watch guardrail metrics (support tickets, revenue, engagement)
- Document null results— they're valuable

### Eye Tracking

**Type:** Quantitative (+ qual debrief), behavioral, evaluative, moderated

**Description:** Hardware/software tracks where users look, producing heatmaps, gaze plots, and fixation data.

**When to use:**
- Evaluating visual hierarchy and attention flow
- Testing packaging, signage, physical-digital layouts
- Understanding whether users see critical elements

**When NOT to use:**
- Budget-constrained projects (expensive)
- As substitute for usability testing (seeing ≠ understanding)

**Sample size:** 20–40 for reliable heatmaps; 8–12 with think-aloud debrief

**Tools:** Tobii, Gazepoint (hardware); Attention Insight (AI predictive, lower fidelity)

### Diary Studies

**Type:** Qualitative (sometimes quant frequency), behavioral + attitudinal, generative, unmoderated

**Description:** Participants log experiences, behaviors, or feelings over days or weeks in their natural context.

**When to use:**
- Understanding behavior over time (habits, routines)
- Infrequent activities (tax filing, travel booking)
- Emotional journeys with delayed reactions
- Mobile/contextual experiences

**Sample size:** 8–15 participants for 1–2 weeks

**Tools:** Dscout, Indeemo, custom Notion/Google Forms

**Tips:**
- Daily prompts increase compliance
- Mix structured questions with open photo/video uploads
- Debrief interview at end for clarification

### Guerrilla Testing

**Type:** Qualitative, evaluative, moderated, in-person

**Description:** Quick, informal usability tests with passersby (coffee shop, office lobby, conference).

**When to use:**
- Very early prototypes needing fast feedback
- Low budget, low stakes decisions
- Testing broad comprehension, not domain-specific workflows

**Sample size:** 5–8 people, 10–15 minutes each

**Limitations:**
- Non-representative sample
- Shallow tasks only
- Not valid for specialized B2B or accessibility testing

**Tips:**
- Simple screener question ("Do you ever shop online?")
- Offer coffee/gift card incentive
- Keep prototype to 1–2 tasks max

### Focus Groups

**Type:** Qualitative, attitudinal, generative, moderated

**Description:** Facilitated group discussion (6–10 participants) exploring attitudes and reactions.

**When to use:**
- Exploring cultural perceptions and language
- Reactions to brand/marketing concepts
- Generating ideas through group dynamics

**When NOT to use:**
- Usability testing (groupthink distorts individual behavior)
- Sensitive topics (social desirability bias)
- Replacing individual interviews

**Sample size:** 2–3 groups of 6–8 per segment

**Caution:** Focus groups are among the most misused methods in UX. Default to individual interviews unless group dynamics are specifically valuable.

### Benchmark (Competitive) Usability Testing

**Type:** Quantitative, behavioral, evaluative

**Description:** Same tasks performed on your product and competitors'; metrics compared.

**When to use:**
- Establishing baseline usability metrics
- Competitive positioning evidence
- Annual UX health check

**Sample size:** 20–30 per product tested

**Metrics:** Task success, time, errors, SUS score per product

### Session Replay / Analytics

**Type:** Quantitative, behavioral, evaluative, unmoderated

**Description:** Tools record user sessions (clicks, scrolls, rage clicks) or aggregate behavioral data.

**Tools:** Hotjar, FullStory, Microsoft Clarity, Amplitude, Mixpanel

**When to use:**
- Identifying drop-off points in funnels
- Reproducing bug reports
- Generating hypotheses for further research (not confirming them)

**Caution:** Analytics shows what happened, not why. Always follow with qual investigation.

## Sample Size Quick Reference

| Method | Minimum | Recommended | Notes |
|--------|---------|-------------|-------|
| Usability test (moderated) | 5 | 5–8 | Diminishing returns after 5 |
| Usability test (unmoderated) | 20 | 30–50 | For reliable success rates |
| Interviews (discovery) | 5 | 8–12 | Until saturation |
| Switch interviews (JTBD) | 6 | 10–15 | Per segment |
| Survey (descriptive) | 100 | 200+ | For population estimates |
| Survey (segment comparison) | 30/group | 50/group | Statistical significance |
| Card sort | 15 | 30 | More = stable clusters |
| Tree test | 50 | 100+ | Per tree variant |
| A/B test | Power analysis | 1–4 weeks traffic | Depends on baseline rate |
| Diary study | 8 | 12–15 | Over 1–2 weeks |
| Eye tracking | 20 | 30–40 | For heatmap reliability |
| Guerrilla | 5 | 5–8 | Quick directional only |

## Research Planning Template

```markdown
# Research Plan: [Study Name]

## Research Questions
1. ...
2. ...

## Method
[Selected method and rationale]

## Participants
- Segment: 
- Screener criteria: 
- Sample size: 
- Recruitment source: 

## Timeline
- Recruit: 
- Field: 
- Analysis: 
- Share findings: 

## Stimulus
[Prototype, live product, discussion guide]

## Metrics / Success Criteria
[What answers "we learned enough"]

## Team
- Lead researcher: 
- Note-taker: 
- Stakeholder observers: 

## Ethics
- Consent process: 
- Data retention: 
- Incentive: 
```

## Common Research Mistakes

1. **Method mismatch** — Surveys for discovery, interviews for validation at scale.

2. **No research questions** — "Let's do some research" without deciding what to learn.

3. **Analyzing during collection** — Stopping interviews at 3 because "we know the answer."

4. **Ignoring mixed methods** — Qual without quant validation (or vice versa).

5. **Testing with colleagues** — Team members aren't users (except for pilot tests).

6. **No synthesis plan** — 20 interviews, 400 pages of notes, no themes extracted.

7. **Presenting findings without recommendations** — Research that doesn't drive decisions wastes resources.

8. **One-and-done** — Research as project, not continuous practice.

## Sources

- Nielsen Norman Group — UX Research Cheat Sheet: https://www.nngroup.com/articles/ux-research-cheat-sheet/
- Nielsen Norman Group — Which UX Research Methods: https://www.nngroup.com/articles/which-ux-research-methods/
- Nielsen Norman Group — Why You Only Need to Test with 5 Users: https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/
- Nielsen Norman Group — Quantitative vs Qualitative UX: https://www.nngroup.com/articles/quant-vs-qual/
- Interaction Design Foundation — User Research Methods: https://www.interaction-design.org/literature/topics/user-research
- Optimal Workshop — Research Methods Guide: https://www.optimalworkshop.com/learn/
- Rosenfeld Media — Survey Design: https://rosenfeldmedia.com/books/ux-research/
- Laws of UX — Sample Size Calculator references: https://lawsofux.com/
- Baymard Institute — Large-Scale UX Testing: https://baymard.com/
- Google — HEART Framework (measurement): https://research.google/pubs/pub36299/
