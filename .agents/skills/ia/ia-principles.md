# Information Architecture Principles

Evidence-based principles for structuring, labeling, and organizing digital products.

---

## Card Sorting Methodology

Card sorting uncovers users' mental models by asking them to group and label content items.

### Open Card Sorting
- **Method:** Participants create their own categories and labels with no predefined structure.
- **When to use:** Early-stage IA, new products, exploratory research when you don't know how users think about content.
- **Strengths:** Unbiased discovery of natural groupings; may reveal unexpected category labels.
- **Weaknesses:** Analysis is more complex; results need synthesis across participants.
- **Sample size:** 15–30 participants for qualitative patterns; 30+ for quantitative dendrogram analysis (NNG, Optimal Workshop).

### Closed Card Sorting
- **Method:** Participants sort items into predefined categories you provide.
- **When to use:** Validating an existing or proposed IA; testing whether labels resonate; prioritization exercises (Important → Unimportant).
- **Strengths:** Faster analysis; directly tests your hypothesis.
- **Weaknesses:** Predefined categories bias results; won't discover novel groupings.
- **Note:** NNG recommends tree testing over closed card sorting for validating navigation categories.

### Hybrid Card Sorting
- **Method:** Mix of predefined categories plus freedom to create new ones.
- **When to use:** Most categories are established but gaps remain; iterative refinement of live products.
- **Strengths:** Balances structure with discovery; identifies where predefined categories fail.
- **Weaknesses:** Predefined categories still bias participants toward similar structures (NNG caution).
- **Rule of thumb:** Few predefined categories → behaves like open; many categories → behaves like closed.

### Card Sorting Best Practices
1. Use 30–60 cards representing real content (not abstract concepts).
2. Run open sort first, then validate with tree testing.
3. Recruit representative users, not internal stakeholders.
4. Analyze with similarity matrices and dendrograms (OptimalSort, Miro, Maze).
5. Pair with follow-up interviews for ambiguous groupings.

---

## Tree Testing Methodology

Tree testing (reverse card sorting) evaluates findability in a text-only hierarchy without visual design influence.

### When to Run
- After card sorting establishes draft IA, before high-fidelity prototypes.
- When restructuring navigation on live products.
- To compare two IA alternatives (A/B tree testing).

### Structure Guidelines
- **Depth:** 2–4 levels (deeper hierarchies reduce findability).
- **Breadth:** 20–40 total items in the tree.
- **Labels:** Clear, descriptive, consistent terminology — no jargon or clever names.

### Task Design
- Write 5–15 realistic, scenario-based tasks (e.g., "Find how to cancel your subscription").
- Use neutral language — don't embed the answer path in the task.
- Mix broad tasks ("Find pricing") with specific ones ("Find API rate limits").
- Define correct answer paths before launching.

### Key Metrics (NNG)
| Metric | Definition | Target |
|--------|------------|--------|
| Success rate | % reaching correct destination | ≥65% good; <50% needs redesign |
| Directness | % who reach destination without backtracking | Higher is better |
| Time on task | Seconds to complete | Compare across tree versions |
| First-click accuracy | Where users start navigation | Reveals mental model mismatches |

### Sample Size
- Exploratory: 15–30 participants.
- Quantitative comparison: 50+ per tree variant for statistical significance.

---

## Wayfinding Principles

Wayfinding helps users understand where they are, where they've been, and where they can go.

### Core Principles
1. **Information scent:** Labels and links must clearly indicate what lies behind them (Pirolli & Card, information foraging theory).
2. **Landmarks:** Persistent navigation, logos, and section headers orient users.
3. **Progressive path visibility:** Users should always know their current location relative to the whole.
4. **Consistent labeling:** Same concept = same label everywhere (Nielsen heuristic #4).
5. **Multiple paths:** Offer browse AND search for diverse user preferences.

### Signage Hierarchy
- **Global:** Primary nav — always visible, product-wide sections.
- **Local:** Section-specific sub-navigation within a area.
- **Contextual:** Related links, "See also," inline cross-references.
- **Utility:** Account, settings, help — separated from content navigation.

---

## Cognitive Load in Navigation

Cognitive load theory (Sweller) applied to IA:

### Intrinsic Load
- Complexity inherent in the content itself.
- **Mitigation:** Chunk content into logical groups; limit top-level items.

### Extraneous Load
- Load imposed by poor design (confusing labels, deep nesting, inconsistent patterns).
- **Mitigation:** Flatten hierarchy where possible; use familiar patterns; reduce clicks to destination.

### Germane Load
- Mental effort that helps users build a useful mental model.
- **Mitigation:** Consistent structure teaches users the system over time.

### Navigation-Specific Guidelines
- Limit primary navigation to **5–7 items** (Miller's Law applied practically).
- Avoid mixing unrelated concepts at the same level.
- Don't require users to remember information from previous screens (Nielsen #6).
- Provide defaults and smart suggestions to reduce decision fatigue.

---

## Miller's Law (7±2) Applied to IA

George Miller's research (1956) on working memory capacity: people can hold ~7 (±2) chunks in short-term memory.

### Practical Application
| Context | Recommendation |
|---------|----------------|
| Top-level nav | 5–7 items maximum |
| Sub-navigation | 5–9 items per group |
| Mega menu columns | 3–5 columns, 5–7 links each |
| Mobile tab bar | 3–5 tabs (platform guidelines) |
| Filter options | Group into ≤7 visible; hide rest in "More" |
| Breadcrumb depth | Warn if >4 levels |

### Important Nuance (NNG, 2019)
Miller's Law is about memory chunks, not menu item counts. Users don't memorize navigation — they recognize it. The 5–7 guideline is a practical heuristic for scanability, not a hard cognitive limit. Prioritize **recognition over recall**.

---

## Progressive Disclosure

Show only necessary information at each level; reveal detail on demand.

### When to Use
- Complex products with many features (enterprise SaaS, admin dashboards).
- Settings and configuration screens.
- Onboarding flows with advanced options.

### Patterns
- **Accordion sections:** Collapse secondary content.
- **"Advanced" toggles:** Hide power-user options.
- **Stepped wizards:** Break complex tasks into stages.
- **Summary → detail:** List view → detail view navigation.
- **Hub pages:** Overview with links to specialized subsections.

### Risks
- Over-disclosure hides critical features (discoverability drops ~20% with hidden nav — NNG).
- Users may never find buried features.
- **Balance:** Primary tasks visible; secondary tasks one click away; tertiary behind progressive disclosure.

---

## IA Structure Models

### Hierarchical (Tree)
- Parent-child relationships; single path to each item.
- **Best for:** Content-heavy sites, documentation, e-commerce taxonomies.
- **Depth limit:** 3–4 levels before findability degrades (NNG flat vs. deep hierarchies).
- **Risk:** Orphan pages; siloed content.

### Hub and Spoke
- Central dashboard/hub linking to distinct functional areas.
- **Best for:** Multi-tool products, employee portals, super-apps.
- **Strength:** Clear entry points; each spoke can have its own IA.
- **Risk:** Hub becomes cluttered; users may not return to hub.

### Flat IA
- Minimal nesting; many top-level items or single-level structure.
- **Best for:** Small products (<10 screens), landing pages, focused tools.
- **Strength:** Maximum discoverability; fewer clicks.
- **Risk:** Doesn't scale; overwhelming with large content sets.

### Matrix / Faceted
- Multiple classification dimensions (filters, tags, categories).
- **Best for:** Large catalogs, research databases, marketplaces.
- **Strength:** Flexible access paths.
- **Risk:** Complexity; requires robust search and filtering.

### Choosing a Model
| Product Size | Recommended Model |
|-------------|-------------------|
| Simple (5–10 screens) | Flat |
| Medium (10–30 screens) | Shallow hierarchical (2–3 levels) |
| Complex (30–50 screens) | Hierarchical + hub pages |
| Very complex (50+) | Hub and spoke + faceted search |

---

## Breadcrumb Patterns

### Standard Location Breadcrumbs
- Show path from home to current page: Home > Category > Subcategory > Page.
- **Use when:** Deep hierarchies (3+ levels); e-commerce; documentation.
- **Research:** NNG finds breadcrumbs help orientation but are secondary to primary nav; most users don't rely on them exclusively.

### Attribute / History Breadcrumbs
- Show filters applied or browsing history rather than hierarchy.
- **Use when:** Faceted navigation; search results with filters.

### Best Practices
- Place below primary navigation, above page title.
- Make each segment clickable except current page.
- Use ">" or "/" separators consistently.
- Don't replace primary navigation with breadcrumbs.
- On mobile, truncate middle segments: Home > … > Current.

### When to Skip
- Flat IA (2 levels or less).
- Single-page apps where URL doesn't reflect structure.
- Wizard/step flows (use step indicator instead).

---

## Search vs Browse Behavior

### Research Findings (NNG, Baymard)
- **Browse-first users (~70%):** Explore categories, follow links, scan visually. Common for new visitors and discovery tasks.
- **Search-first users (~30%):** Go directly to search. Common for returning users with specific goals.
- **Both are essential:** Removing either path hurts conversion and satisfaction.

### When Users Search
- They know exactly what they want (specific product, document, setting).
- Browse path failed or seems too long.
- Large catalogs where browsing is inefficient.
- Returning users with established mental models.

### When Users Browse
- Discovery and exploration tasks.
- Unfamiliar products or domains.
- Visual decision-making (e-commerce, media).
- Low domain knowledge.

### IA Implications
1. Design browse paths for top tasks even if search exists.
2. Search results should reflect IA structure (facets match categories).
3. Auto-suggest should use IA labels for consistency.
4. Track search queries with zero results — signals IA gaps.

---

## Latest IA Research (2024–2025)

### Key Trends
1. **AI-assisted navigation:** Conversational search and AI copilots changing findability patterns; IA must support both traditional and natural-language access (Gartner, 2024).
2. **Mobile-first IA:** Desktop IA increasingly derived from mobile constraints, not vice versa (NNG content dispersion research).
3. **Personalized navigation:** Role-based and behavior-based nav ordering in SaaS; IA must support dynamic views without breaking mental models.
4. **Cross-platform consistency:** Users expect same labels and structure across web, mobile, and embedded contexts.
5. **Accessibility-first IA:** WCAG 2.2 focus on consistent navigation mechanisms (Success Criterion 3.2.3); skip links and landmarks required.
6. **Reduced depth preference:** Flat IA resurgence driven by search, AI, and command palettes (Spotlight, Cmd+K patterns).

### Updated Heuristics
- Test IA with tree testing before visual design (shift-left validation).
- Card sorting remains gold standard for label generation.
- Hidden navigation penalty persists: ~20% discoverability drop (NNG replicated studies).
- Voice/conversational interfaces require flatter, more descriptive labels.

---

## Sources

- https://www.nngroup.com/articles/card-sorting-definition/
- https://www.nngroup.com/articles/interpreting-tree-test-results/
- https://www.nngroup.com/articles/flat-vs-deep-hierarchy/
- https://www.nngroup.com/articles/hamburger-menus/
- https://www.nngroup.com/articles/menu-design/
- https://www.nngroup.com/articles/infinite-scrolling/
- https://maze.co/guides/card-sorting/
- https://maze.co/guides/tree-testing/
- https://ixdf.org/literature/article/tree-testing-ux
- https://support.optimalworkshop.com/en/articles/2626850-choose-between-an-openclosed-or-hybrid-card-sort
- https://www.nngroup.com/articles/progressive-disclosure/
- https://www.nngroup.com/articles/breadcrumbs/
