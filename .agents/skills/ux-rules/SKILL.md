# UX Rules Skill

A comprehensive UX knowledge base for Cursor agents working on design, review, and implementation tasks in this project.

---

## What This Folder Contains

The `ux-rules/` skill folder is a structured reference library of evidence-based UX principles, guidelines, and patterns. It is designed to give Cursor agents authoritative, actionable UX knowledge without relying on training data alone.

### Knowledge Base Files

| File | Topic | Use When |
|------|-------|----------|
| `heuristics.md` | Nielsen's 10 heuristics, Shneiderman's Golden Rules, Gerhardt-Powals principles, NNG updates, severity rating | Evaluating usability, conducting heuristic reviews, prioritizing UX issues |
| `accessibility.md` | WCAG 2.1 A/AA/AAA, WCAG 3.0 direction, contrast, touch targets, screen readers, keyboard nav, ARIA, testing tools | Building or auditing accessible interfaces, fixing a11y failures |
| `mobile-ux.md` | iOS HIG, Material Design 3, thumb zones, mobile nav, gestures, typography, performance, offline, notifications, forms | Designing or reviewing mobile experiences |
| `web-ux.md` | F/Z patterns, above fold, navigation, typography, CTAs, forms, tables, modals, scroll vs pagination, search, empty states, 404 | Designing or reviewing web pages and web applications |
| `conversion-ux.md` | Baymard checkout, Fogg model, Cialdini principles, trust signals, friction reduction, cognitive load, social proof, onboarding, pricing | Optimizing funnels, checkout, signup, pricing, and onboarding |
| `data-viz-ux.md` | Chart selection, color in viz, Tufte principles, dashboards, accessible data viz, real-time, mobile viz | Building dashboards, charts, reports, and analytics interfaces |
| `voice-ai-ux.md` | Conversational UI, chatbots, VUI, AI error handling, prompt design, AI trust, latency patterns, AI disclosure | Designing AI features, chatbots, copilots, and voice interfaces |
| `emerging-trends.md` | 2024–2025 trends, spatial/AR UX, gestures, biometric auth, dark patterns, inclusive design, neurodesign | Forward-looking design decisions, trend evaluation, ethical design |

---

## How Cursor Uses These Files

### Automatic Discovery
Cursor agents discover skills in `.agents/skills/` based on the skill description in `SKILL.md`. When a task involves UX decisions, the agent should read the relevant knowledge base file(s) before making design or implementation choices.

### When to Load This Skill
Load the UX Rules skill when the user or task involves:
- UI/UX design, review, or critique
- Accessibility audits or fixes
- Mobile or responsive design decisions
- Form, checkout, or onboarding optimization
- Dashboard or data visualization design
- AI/chatbot/voice interface design
- Conversion rate optimization
- Design system decisions
- Dark pattern identification
- Heuristic evaluation

### How Agents Should Use the Files
1. **Read before acting.** Load the relevant file(s) before making UX decisions or writing UI code.
2. **Cite principles.** Reference specific heuristics, guidelines, or research findings in reviews.
3. **Apply severity ratings.** Use the 0–4 scale from `heuristics.md` when reporting UX issues.
4. **Cross-reference.** Many topics overlap; combine files as needed (see Combining Rules below).
5. **Prefer authoritative guidance.** These files supersede general training data for UX decisions in this project.

---

## When to Reference Which File

### By Task Type

**"Review this UI" / "Is this good UX?"**
→ Start with `heuristics.md` (heuristic evaluation)
→ Add `accessibility.md` for a11y check
→ Add platform-specific: `mobile-ux.md` or `web-ux.md`

**"Make this accessible" / "Fix a11y issues"**
→ `accessibility.md` (primary)
→ `heuristics.md` for usability context

**"Design a mobile screen"**
→ `mobile-ux.md` (primary)
→ `accessibility.md` for touch targets and screen readers
→ `heuristics.md` for general usability

**"Design a landing page" / "Improve this page"**
→ `web-ux.md` (primary)
→ `conversion-ux.md` for CTA and trust signals
→ `heuristics.md` for general evaluation

**"Optimize checkout" / "Improve conversion"**
→ `conversion-ux.md` (primary)
→ `web-ux.md` for form patterns
→ `mobile-ux.md` if mobile checkout

**"Build a dashboard" / "Choose a chart"**
→ `data-viz-ux.md` (primary)
→ `accessibility.md` for accessible charts
→ `web-ux.md` for layout patterns

**"Design an AI feature" / "Build a chatbot"**
→ `voice-ai-ux.md` (primary)
→ `heuristics.md` for usability fundamentals
→ `emerging-trends.md` for latest AI UX research

**"Is this a dark pattern?"**
→ `emerging-trends.md` (dark patterns section)
→ `conversion-ux.md` (ethical urgency section)

**"Design for inclusivity"**
→ `accessibility.md` (primary)
→ `emerging-trends.md` (inclusive design section)

### By Component Type

| Component | Primary File | Secondary Files |
|-----------|-------------|-----------------|
| Button / CTA | `web-ux.md` | `conversion-ux.md`, `accessibility.md` |
| Form | `web-ux.md` | `mobile-ux.md`, `accessibility.md`, `conversion-ux.md` |
| Navigation | `web-ux.md` | `mobile-ux.md`, `heuristics.md` |
| Modal / Dialog | `web-ux.md` | `accessibility.md` |
| Data table | `web-ux.md` | `data-viz-ux.md`, `accessibility.md` |
| Chart / Graph | `data-viz-ux.md` | `accessibility.md` |
| Chat / AI interface | `voice-ai-ux.md` | `heuristics.md`, `emerging-trends.md` |
| Onboarding flow | `conversion-ux.md` | `web-ux.md`, `mobile-ux.md` |
| Pricing page | `conversion-ux.md` | `web-ux.md` |
| Empty state | `web-ux.md` | `heuristics.md` |
| Error page | `web-ux.md` | `heuristics.md` |
| Push notification | `mobile-ux.md` | `conversion-ux.md` |
| Authentication | `emerging-trends.md` | `accessibility.md`, `conversion-ux.md` |

---

## Combining Rules

Many UX tasks require synthesizing guidance from multiple files. Use these common combinations:

### Full UI Review
```
1. heuristics.md    → Heuristic evaluation with severity ratings
2. accessibility.md → WCAG AA compliance check
3. web-ux.md OR mobile-ux.md → Platform-specific patterns
4. conversion-ux.md → Conversion optimization (if applicable)
```

### New Feature Design
```
1. heuristics.md    → Core usability principles
2. [platform].md    → web-ux.md or mobile-ux.md
3. accessibility.md → Inclusive design from the start
4. [domain].md      → conversion, data-viz, or voice-ai as relevant
```

### AI Feature Design
```
1. voice-ai-ux.md   → AI-specific patterns and ethics
2. heuristics.md    → General usability (#1 status, #9 errors)
3. emerging-trends.md → Latest AI UX research
4. accessibility.md → AI output accessibility
```

### E-Commerce Flow
```
1. conversion-ux.md → Baymard checkout, trust, friction
2. web-ux.md        → Forms, navigation, CTAs
3. mobile-ux.md     → Mobile checkout optimization
4. accessibility.md → Form labels, contrast, keyboard
```

### Dashboard Design
```
1. data-viz-ux.md   → Chart selection, Tufte, dashboard layout
2. accessibility.md → Accessible charts and color
3. web-ux.md        → Layout, navigation, empty states
4. heuristics.md    → Cognitive load (#8 minimalism)
```

### Conflict Resolution
When guidelines conflict, prioritize in this order:
1. **Accessibility** (legal requirement) — `accessibility.md`
2. **Usability heuristics** (user safety and task completion) — `heuristics.md`
3. **Platform guidelines** (user expectations) — `mobile-ux.md` or `web-ux.md`
4. **Conversion optimization** (business goals) — `conversion-ux.md`
5. **Trends** (innovation) — `emerging-trends.md`

Accessibility always wins. Conversion never overrides accessibility or ethical design.

---

## Severity Rating Quick Reference

When reporting UX issues, use the severity scale from `heuristics.md`:

| Rating | Label | Action |
|--------|-------|--------|
| 0 | Not a problem | No action |
| 1 | Cosmetic | Backlog |
| 2 | Minor | Schedule fix |
| 3 | Major | Fix before release |
| 4 | Catastrophic | Block release |

Always note which heuristic, WCAG criterion, or guideline is violated.

---

## Update Schedule

### Review Cadence
| File | Review Frequency | Trigger for Off-Cycle Update |
|------|-----------------|------------------------------|
| `heuristics.md` | Annual | NNG publishes heuristic revisions |
| `accessibility.md` | Semi-annual | WCAG updates, legal changes (EAA, ADA) |
| `mobile-ux.md` | Semi-annual | iOS/Android major version releases |
| `web-ux.md` | Annual | Major web platform changes |
| `conversion-ux.md` | Annual | Baymard publishes new research |
| `data-viz-ux.md` | Annual | New chart libraries or accessibility standards |
| `voice-ai-ux.md` | Quarterly | Rapid AI UX evolution |
| `emerging-trends.md` | Quarterly | Trend shifts, new regulations |
| `SKILL.md` | On file changes | Any knowledge base file added or removed |
| `metadata.json` | On any update | Increment version, update date and sources |

### Version History
- **v1.0** (2026-06-16): Initial knowledge base with 8 topic files.

### How to Update
1. Edit the relevant markdown file with new research or guidelines.
2. Update the Sources section at the bottom of the edited file.
3. Update `metadata.json`: increment version, set `lastUpdated`, add new sources.
4. Update `SKILL.md` if files are added, removed, or reorganized.
5. Do not delete existing guidance unless it is explicitly superseded; add errata instead.

---

## Integration with Other Skills

This skill complements but does not replace other project skills:

| Skill | Relationship |
|-------|-------------|
| `ui-ux-pro-max` | Broader design intelligence (styles, palettes, fonts). Use for visual design; use `ux-rules` for usability and accessibility. |
| `transitions-dev` | Animation implementation. Use for motion; use `ux-rules` for when and why to animate. |
| `moodboard` | Brand/visual direction. Use for aesthetics; use `ux-rules` for usability of generated UI. |
| `brainstorming` | Creative exploration. Use before design; use `ux-rules` during evaluation and implementation. |

**Recommended workflow:**
1. `brainstorming` → Explore ideas and requirements
2. `ui-ux-pro-max` or `moodboard` → Visual direction and design
3. `ux-rules` → Evaluate, refine, and implement with usability standards
4. `transitions-dev` → Add purposeful motion
5. `ux-rules/accessibility.md` → Final accessibility audit

---

## Sources

- Nielsen Norman Group. https://www.nngroup.com/
- W3C Web Accessibility Initiative. https://www.w3.org/WAI/
- Baymard Institute. https://baymard.com/
- Apple Human Interface Guidelines. https://developer.apple.com/design/human-interface-guidelines/
- Google Material Design. https://m3.material.io/
- Edward Tufte. https://www.edwardtufte.com/
- deceptive.design. https://www.deceptive.design/
- Microsoft Inclusive Design. https://inclusive.microsoft.design/
