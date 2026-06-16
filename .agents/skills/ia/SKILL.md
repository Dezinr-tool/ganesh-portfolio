# Information Architecture Skill

Evidence-based IA knowledge for Cursor agents working on navigation structure, sitemaps, content hierarchy, and wireframe generation in this project.

---

## What This Folder Contains

The `ia/` skill folder is a structured reference library for information architecture decisions. It complements `ux-rules/` with IA-specific methodology, navigation patterns, industry templates, and evidence-based UX controversy resolutions.

### Knowledge Base Files

| File | Topic | Use When |
|------|-------|----------|
| `ia-principles.md` | Card sorting, tree testing, wayfinding, cognitive load, Miller's Law, progressive disclosure, IA models, breadcrumbs, search vs browse | Structuring content, validating hierarchy, applying IA methodology |
| `navigation-patterns.md` | Bottom tabs, top nav, hamburger, sidebar, mega menu, contextual/utility nav, mobile vs desktop, labeling, icon+label research | Choosing navigation patterns for a product |
| `content-strategy.md` | Content hierarchy, labeling, taxonomy, metadata, content types, search architecture, filtering, microcopy | Organizing content, naming categories, search/filter design |
| `competitor-analysis.md` | Screenshot analysis method, depth/breadth metrics, industry patterns, anti-patterns, differentiation | Analyzing competitor screenshots (Q7a), competitive IA review |
| `ux-controversies.md` | 10 major UX debates with research + recommendations | Generating Section 8 controversy recommendations, wireframe decisions |
| `ia-patterns-by-industry.md` | Fintech, e-commerce, SaaS, healthcare, EdTech, social, marketplace, enterprise | Selecting industry-appropriate IA structure |

---

## When to Reference Which File

### By Task

**"Build IA for a mobile app"**
→ `ia-principles.md` (methodology)
→ `navigation-patterns.md` (bottom tabs, mobile sections)
→ `ia-patterns-by-industry.md` (filter by industry)

**"Analyze competitor screenshots"**
→ `competitor-analysis.md` (primary)
→ `navigation-patterns.md` (identify patterns)
→ `ia-patterns-by-industry.md` (compare to industry norms)

**"Choose navigation pattern"**
→ `navigation-patterns.md` (primary)
→ `ux-controversies.md` (hamburger vs tabs debate)
→ `ia-patterns-by-industry.md` (industry default)

**"Generate UX controversy recommendations"**
→ `ux-controversies.md` (primary — all 10 debates)
→ `navigation-patterns.md` (nav-specific controversies)
→ Product context from intake answers

**"Structure content and labels"**
→ `content-strategy.md` (primary)
→ `ia-principles.md` (card sorting, taxonomy)

**"Validate IA hierarchy"**
→ `ia-principles.md` (tree testing, depth/breadth)
→ `ux-controversies.md` (depth vs flat debates)

---

## How to Combine Competitor Analysis with Principles

1. **Analyze screenshots** using `competitor-analysis.md` checklist.
2. **Score against industry norms** from `ia-patterns-by-industry.md`.
3. **Apply principles** from `ia-principles.md` to identify gaps (depth, labeling, findability).
4. **Differentiate deliberately** — don't copy; use competitor weaknesses as opportunities.
5. **Validate with tree testing methodology** before finalizing structure.
6. **Document findings** in `ia_sessions.competitor_analysis` JSONB.

### Integration Flow
```
Competitor Screenshots (Q7a)
  → competitor-analysis.md (analyze)
  → ia-patterns-by-industry.md (compare)
  → ia-principles.md (apply methodology)
  → IA Output (differentiated structure)
```

---

## How to Surface UX Controversies as Recommendations

1. Read `ux-controversies.md` for all 10 debate frameworks.
2. Based on product type (Q2), platform, and content complexity (Q8), select **3–5 most relevant** controversies.
3. For each controversy, provide:
   - **The Debate:** What are the options?
   - **Research says:** Cite specific findings from ux-controversies.md.
   - **For YOUR product:** Specific recommendation tied to intake answers.
4. Present in Section 8 format with accept/reject UI.
5. Accepted recommendations flow to wireframe generation via `ux_controversy_decisions`.

### Controversy Selection Matrix

| Product Signal | Likely Controversies |
|---------------|---------------------|
| Mobile App | Hamburger vs tabs, icon vs label, onboarding |
| Web App / SaaS | Sidebar vs top nav, SPA vs multi-page, cards vs tables |
| E-commerce | Infinite scroll vs pagination, search vs browse, breadcrumbs |
| Complex (30+ screens) | Progressive disclosure, hub vs hierarchical, search-first |
| Simple (≤10 screens) | Flat IA, minimal onboarding, no breadcrumbs |

---

## How to Pick Industry Pattern

1. Map Q2 product type + Q1 description to industry in `ia-patterns-by-industry.md`.
2. Use the industry's **typical structure** as a starting template.
3. Adapt based on Q4–Q7 user types, tasks, and findability needs.
4. Apply Q7b "differentiate from" competitor notes.
5. Override industry defaults when intake answers indicate unique requirements.
6. Save selected pattern to `ia_sessions.industry_pattern_used`.

### Industry Mapping

| Q2 Answer | Industry Pattern |
|-----------|-----------------|
| Mobile App (consumer) | Social/Community or Fintech |
| Mobile App (business) | SaaS or Enterprise |
| Web App | SaaS / B2B Software |
| Website (store) | E-commerce / D2C |
| Website (marketing) | Flat IA, minimal nav |
| Desktop App | Enterprise / Admin Dashboard |

Use Q1 description to refine (e.g., "learning platform" → EdTech, "banking app" → Fintech).

---

## Context Loading Rules (for `/ia` tool)

When the IA tool loads context via `loadUnifiedContext()`:

| File | Load Condition |
|------|---------------|
| `ia-principles.md` | Always |
| `navigation-patterns.md` | Always |
| `content-strategy.md` | Always (content questions Q8–Q11) |
| `ux-controversies.md` | Always (filter to 3–5 relevant in output) |
| `ia-patterns-by-industry.md` | Always (filter by detected industry) |
| `competitor-analysis.md` | When Q7a screenshots uploaded |

Additional UX rules loaded via context-loader:
- `heuristics.md` — always for IA tool
- `mobile-ux.md` — when product type is mobile
- `web-ux.md` — when product type is web/website
- `accessibility.md` — when accessibility mentioned

---

## Auto-Update Schedule

All files in this folder are registered in `lib/knowledge/registry.ts` with category `ia` and included in the weekly knowledge updater (`lib/knowledge-updater.ts`).

- **Frequency:** Weekly (same as ux-rules and design-frameworks)
- **Method:** Claude web search research → content update → version increment
- **Management:** Available in `/knowledge-admin` under "Information Architecture" category
- **DB table:** `ux_knowledge_base` (category = `ia`)

Run manual update: `POST /api/knowledge/update-all` or update individual files from knowledge admin.

---

## Related Skills

- `ux-rules/` — General UX principles (heuristics, accessibility, mobile, web)
- `design-frameworks/` — Double Diamond, UX Research Methods (card sorting reference)
- Wireframe tool — Consumes IA output including accepted controversy decisions
