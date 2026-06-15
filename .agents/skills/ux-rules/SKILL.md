---
name: ux-rules
description: Living UX rules knowledge base — heuristics, accessibility, mobile/web/conversion UX, data viz, AI UX, and emerging trends. Reference when auditing interfaces, reviewing designs, or answering UX questions.
---

# UX Rules Skill

This folder contains authoritative, continuously updated UX rules and guidelines used across Brucira tools (Design Audit, Moodboard, Virtual EA).

## Contents

| File | Use when |
|------|----------|
| `heuristics.md` | Heuristic evaluation, usability review, severity rating |
| `accessibility.md` | WCAG compliance, a11y audit, contrast, ARIA, keyboard |
| `mobile-ux.md` | iOS/Android apps, responsive mobile, touch targets |
| `web-ux.md` | Websites, web apps, navigation, forms, CTAs |
| `conversion-ux.md` | Checkout, onboarding, pricing, persuasion |
| `data-viz-ux.md` | Dashboards, charts, KPI displays |
| `voice-ai-ux.md` | Chatbots, AI assistants, conversational UI |
| `emerging-trends.md` | Trend research, spatial/AR, inclusive design |

## How Cursor Should Use These Files

1. **Read `metadata.json`** for version and last-updated date
2. **Load the most relevant file(s)** for the task — don't load all 8 unless doing a full audit
3. **Cite specific rules** when giving feedback (e.g., "Nielsen #1 Visibility of System Status")
4. **Combine rules** when tasks overlap (audit = heuristics + accessibility + web/mobile)
5. **Prefer DB content** via `lib/knowledge-context.ts` in production tools; use files as source of truth

## Combining Multiple Rules

| Task | Recommended files |
|------|-------------------|
| Full design audit | heuristics + accessibility + web-ux (or mobile-ux) |
| Checkout review | conversion-ux + web-ux + accessibility |
| AI feature design | voice-ai-ux + heuristics + emerging-trends |
| Dashboard build | data-viz-ux + accessibility + web-ux |

## Update Schedule

- **Automatic:** Weekly via `npm run knowledge:weekly-update` (Claude + web search)
- **Manual:** `/knowledge-admin` → Update now per file
- **Source of truth:** Files in this folder sync to `ux_knowledge_base` table on init/seed

When content conflicts with client-specific guidelines, client guidelines win for that project; these rules remain the default industry baseline.
