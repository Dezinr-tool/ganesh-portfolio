# Design Frameworks Knowledge Base

## Purpose

This skill folder contains comprehensive reference documentation for major product design, UX research, and innovation frameworks. Use these files when selecting process approaches, facilitating workshops, writing requirements, planning research, or advising teams on methodology.

Each framework file includes: overview, phases/steps, when to use, tools, common mistakes, case studies, templates, and curated sources.

## Folder Contents

| File | Framework | Primary Use |
|------|-----------|-------------|
| `double-diamond.md` | British Design Council Double Diamond | General-purpose design process (Discover → Define → Develop → Deliver) |
| `triple-diamond.md` | Extended Triple Diamond | Innovation with problem validation before research |
| `design-sprint.md` | Google Ventures 5-Day Sprint | Rapid hypothesis testing in one week |
| `jobs-to-be-done.md` | Christensen + Ulwick JTBD / ODI | Understanding why users switch and prioritizing outcomes |
| `atomic-design.md` | Brad Frost Atomic Design | Design system structure (atoms → pages) |
| `lean-ux.md` | Jeff Gothelf Lean UX | Continuous experimentation in Agile teams |
| `service-design.md` | Service Design | Multi-channel experiences with backstage processes |
| `systems-thinking.md` | Systems Thinking in Design | Complex ecosystems, feedback loops, unintended consequences |
| `jobs-stories.md` | Jobs Stories (Intercom/Klement) | Context-driven requirements format |
| `how-might-we.md` | HMW Questions (IDEO/d.school) | Ideation framing from research insights |
| `ux-research-methods.md` | UX Research Taxonomy | Method selection, sample sizes, qual/quant guidance |

## Framework Selection Guide by Project Type

### New Product / Startup (High Uncertainty)

**Primary:** Triple Diamond → Lean UX cycles
**Research:** JTBD switch interviews, problem validation smoke tests
**Requirements:** Jobs stories → HMW → hypotheses
**Avoid:** Heavy Atomic Design investment before product-market fit

```
Week 1–2:  Triple Diamond validation (Go/No-Go)
Week 3–6:  Double Diamond Discover/Define + JTBD interviews
Week 7+:   Lean UX Think-Make-Check loops
Optional:  Design Sprint if team needs alignment fast
```

### Feature Addition (Known Product, Unclear Solution)

**Primary:** Double Diamond (shortened Discover) → Design Sprint or Lean UX
**Research:** Targeted usability tests, analytics review
**Requirements:** Jobs stories for framing → user stories for dev
**Supporting:** HMW workshops after Define

```
Week 1:    Discover (analytics + 5–8 interviews)
Week 2:    Define (HMW + jobs stories)
Week 3:    Develop (prototype + test)
Week 4+:   Deliver (build + measure)
```

### Product Redesign / UX Overhaul

**Primary:** Double Diamond (full) + Service Design (if multi-channel)
**Research:** Full UX research taxonomy—interviews, usability, tree test, card sort
**Structure:** Atomic Design for component rebuild
**Supporting:** Systems thinking for ecosystem impacts

```
Phase 1:   Discover (research + journey maps + service blueprints)
Phase 2:   Define (problem statements + IA via card sort/tree test)
Phase 3:   Develop (atomic component system + prototype testing)
Phase 4:   Deliver (phased rollout + post-launch measurement)
```

### Design System Build

**Primary:** Atomic Design
**Research:** Audit existing UI, component usage analytics
**Supporting:** Double Diamond for token/component prioritization
**Avoid:** Skipping templates and pages layers

```
Phase 1:   Audit + token definition
Phase 2:   Atoms + molecules (Figma + Storybook parallel)
Phase 3:   Organisms + templates
Phase 4:   Pages + documentation + adoption
```

### Service / Operations Experience

**Primary:** Service Design
**Research:** Contextual inquiry, journey mapping, support data analysis
**Supporting:** Systems thinking, JTBD for switching moments
**Deliverable:** Service blueprints with backstage process changes

### Stakeholder Alignment / Stuck Team

**Primary:** Design Sprint (5-day)
**Alternative:** HMW workshop (1-day) if sprint isn't feasible
**Prerequisite:** Decider availability, user recruitment

### Continuous Product Team (Agile)

**Primary:** Lean UX + Continuous Discovery
**Requirements:** Jobs stories (discovery) → user stories (sprints)
**Research:** Rolling interviews (weekly), usability tests per sprint
**Supporting:** JTBD for quarterly strategy, systems thinking for platform decisions

## Combining Frameworks

Frameworks are complementary, not mutually exclusive. Common combinations:

### Double Diamond + JTBD
- **Discover:** Switch interviews and job mapping
- **Define:** Job statements and outcome prioritization (ODI)
- **Develop/Deliver:** Standard diamond phases

### Design Sprint + Lean UX
- **Sprint:** Validates direction in one week
- **Lean UX:** Sustained experimentation after sprint decision

### Service Design + Systems Thinking
- **Journey maps:** User-facing experience
- **Blueprints:** Backstage processes
- **Systems maps:** Feedback loops and unintended consequences

### Atomic Design + Lean UX
- **Lean UX:** Validates which components/patterns users need
- **Atomic Design:** Structures validated patterns into system hierarchy

### Jobs Stories + HMW + User Stories
```
JTBD research → Jobs stories (discovery) → HMW (ideation) → User stories (sprints)
```

### Triple Diamond + Design Sprint
- **Validation diamond:** 2-week Go/No-Go
- **Design Sprint:** Problem/solution validation if Go
- **Lean UX:** Post-sprint iteration

## Decision Flowchart

```
Is the problem validated?
├── NO → Triple Diamond (validation) or JTBD switch interviews
└── YES → Is timeline ≤ 1 week?
    ├── YES → Design Sprint
    └── NO → Is this a service (multi-channel)?
        ├── YES → Service Design + Double Diamond
        └── NO → Is this a design system?
            ├── YES → Atomic Design
            └── NO → Double Diamond + Lean UX cycles
                └── Need ideation framing? → Add HMW
                └── Need requirements format? → Jobs stories
                └── Need method selection? → UX Research Methods
                └── Complex ecosystem? → Systems Thinking
```

## When to Read Which File

| If the user asks... | Read |
|---------------------|------|
| "What process should we follow?" | This file (selection guide) + `double-diamond.md` |
| "Should we even build this?" | `triple-diamond.md` |
| "We need answers in a week" | `design-sprint.md` |
| "Why do users switch products?" | `jobs-to-be-done.md` |
| "How do we structure our component library?" | `atomic-design.md` |
| "How do we experiment in Agile?" | `lean-ux.md` |
| "Our experience spans app + support + physical" | `service-design.md` |
| "What are the second-order effects?" | `systems-thinking.md` |
| "Better format than user stories?" | `jobs-stories.md` |
| "How do we frame brainstorm questions?" | `how-might-we.md` |
| "Which research method should we use?" | `ux-research-methods.md` |

## Agent Usage Guidelines

When applying these frameworks in code or product work:

1. **Match scope to framework weight** — Don't propose a 5-day design sprint for a button color change.
2. **Cite the framework phase** — When recommending research, name the phase it serves (e.g., "Discover activity").
3. **Produce artifacts** — Use templates from framework files when generating briefs, hypotheses, or research plans.
4. **Combine deliberately** — State which frameworks you're combining and why.
5. **Default to evidence** — Frameworks structure work; research evidence drives decisions.
6. **Respect constraints** — Remote team, no user access, or no Decider availability should change framework selection.

## Update Schedule

| Activity | Frequency | Owner |
|----------|-----------|-------|
| Review source URLs for broken links | Quarterly | Design ops / skill maintainer |
| Add new case studies from project work | After major projects | Project lead |
| Update framework selection guide | When team process changes | Design lead |
| Sync with product team rituals | Semi-annually | PM + Design |
| Version bump in `metadata.json` | On any content update | Skill maintainer |
| Cross-reference new skills/tools | As ecosystem evolves | Agent maintainer |

### Version History

| Version | Date | Changes |
|---------|------|---------|
| 1 | 2026-06-06 | Initial knowledge base — 11 framework files |

### Planned Additions (Future Versions)

- Design Ops framework
- OKR + Outcome mapping integration
- Accessibility-first design process overlay
- AI-assisted research ethics guidelines

## Related Skills

- `moodboard/SKILL.md` — Brand and visual direction generation
- `transitions-dev/SKILL.md` — Motion and interaction implementation
- `ui-ux-pro-max/SKILL.md` — UI patterns, tokens, and component guidance
- `brainstorming/SKILL.md` — Pre-implementation creative exploration

## Sources (Meta)

- British Design Council: https://www.designcouncil.org.uk/
- IDEO Design Thinking: https://designthinking.ideo.com/
- Nielsen Norman Group: https://www.nngroup.com/
- Interaction Design Foundation: https://www.interaction-design.org/
- Service Design Network: https://www.service-design-network.org/
- Lean UX (Jeff Gothelf): https://www.leanuxbook.com/
- Google Ventures Sprint: https://www.gv.com/sprint/
- Atomic Design (Brad Frost): https://atomicdesign.bradfrost.com/
