# Content Strategy for Information Architecture

How content types, labeling, metadata, and search architecture shape IA decisions.

---

## Content Hierarchy Principles

### The Three Levels
Every screen should have clearly prioritized content layers:

1. **Primary:** The main reason the user is on this screen. One focal point.
2. **Secondary:** Supporting information that aids the primary task.
3. **Tertiary:** Optional detail, metadata, related links, legal text.

### Hierarchy Rules
- One primary action per screen (Fogg Behavior Model).
- Primary content visible without scrolling on mobile.
- Secondary content accessible within one interaction (expand, tab, scroll).
- Tertiary content behind progressive disclosure or footer.
- Don't compete primary and secondary at same visual weight.

### Content Priority Matrix
| User Task Frequency | Content Priority | Nav Placement |
|--------------------|-----------------|---------------|
| Daily | Primary | Top-level nav / tab bar |
| Weekly | Secondary | Sub-nav or dashboard card |
| Monthly | Tertiary | Settings, menu, search-only |
| Rare | Hidden | Search, help docs, command palette |

---

## Labeling and Taxonomy

### Labeling Principles
1. **Mutually exclusive categories:** Item belongs to one primary category (faceted search is the exception).
2. **Collectively exhaustive:** All content fits somewhere; no orphan content.
3. **Consistent depth:** Categories at same level have similar scope/granularity.
4. **User vocabulary:** Labels from card sorting, not brainstorming sessions.
5. **Scalable naming:** Labels work if category doubles in size.

### Taxonomy Types
| Type | Description | Example |
|------|-------------|---------|
| Hierarchical | Tree structure, one parent | Product categories |
| Faceted | Multiple independent attributes | Filters (size, color, price) |
| Tag-based | Non-exclusive labels | Blog tags, skills |
| Alphabetical | A–Z index | Glossary, directory |
| Task-based | Organized by user goal | "Buy," "Manage," "Learn" |

### Common Labeling Mistakes
- Company org chart as navigation (users don't think in departments).
- Feature names instead of user goals ("CRM Integration" vs "Manage Contacts").
- Overlapping categories ("Products" and "Shop").
- Jargon and acronyms without explanation.

---

## Metadata and Tagging

### Metadata for IA
Metadata enables findability beyond hierarchical browsing:
- **Descriptive:** Title, description, summary.
- **Structural:** Category, parent, section, content type.
- **Administrative:** Author, date, status, version.
- **Semantic:** Tags, topics, audience, difficulty level.

### Tagging Best Practices
- Controlled vocabulary (predefined tags) for consistency.
- Limit tags to 5–10 per item; more reduces utility.
- Tags should complement, not replace, hierarchy.
- Auto-suggest tags from existing vocabulary.
- Regular tag audit to merge synonyms and remove unused tags.

### IA Implications
- Tags enable faceted navigation and filtered search.
- Metadata powers "Related content" and recommendations.
- Content type metadata drives template selection and layout.

---

## Content Types and IA Implications

| Content Type | IA Pattern | Nav Consideration |
|-------------|-----------|-------------------|
| Landing/Marketing | Flat, CTA-driven | Minimal nav, focused conversion |
| Product catalog | Hierarchical + faceted | Category tree + filters |
| Documentation | Deep hierarchy + search | Sidebar nav, breadcrumbs, version selector |
| Dashboard | Hub and spoke | Widget-based overview, drill-down |
| Feed/Timeline | Flat + infinite scroll | Minimal nav, filter tabs |
| Settings | Grouped list | Search within settings, grouped sections |
| Forms/Wizards | Linear step flow | Progress indicator, not global nav |
| Media (video/audio) | Browse + search | Category + playlist hierarchy |
| Social/Community | Feed + profiles + groups | Tab bar: Home, Discover, Create, Profile |
| Admin/Enterprise | Sidebar + breadcrumbs | Role-based nav, dense information |

---

## Search Architecture

### Search Components
1. **Search input:** Prominent, persistent, accessible (ARIA combobox).
2. **Auto-suggest:** Real-time suggestions from IA labels + popular queries.
3. **Results page:** Ranked results with filters matching IA facets.
4. **Zero-results handling:** Suggestions, popular content, contact support.
5. **Search analytics:** Track queries to identify IA gaps.

### Search-IA Integration
- Search facets should mirror browse categories.
- Result snippets should show breadcrumb path (information scent).
- Synonyms and aliases mapped to canonical IA labels.
- Scoped search within sections when hierarchy is deep.

### Types of Search
| Type | Use Case |
|------|----------|
| Global | Site-wide, accessible from every page |
| Scoped | Within a section (docs, catalog, settings) |
| Faceted | Combined with filters from IA taxonomy |
| Conversational/AI | Natural language queries (emerging, 2024+) |

---

## Filtering and Sorting Patterns

### Filter Placement
- **Left sidebar:** Desktop e-commerce, data-heavy lists (Baymard recommended).
- **Horizontal chips:** Mobile, content feeds, smaller datasets.
- **Top bar dropdowns:** Medium datasets, SaaS tables.
- **Modal/bottom sheet:** Mobile filters for complex faceted search.

### Filter UX Rules
- Show active filter count ("Filters (3)").
- Allow one-click clear all filters.
- Filters should match IA categories (consistent mental model).
- Show result count update in real-time.
- Persist filter state in URL for shareability.

### Sorting
- Default sort should match user's most likely intent (relevance, newest, popular).
- Limit sort options to 3–5 meaningful choices.
- Label sorts clearly: "Price: Low to High" not just "Price."

---

## Content Grouping Research

### How Users Group Content (Card Sorting Insights)
- Users group by **task/goal** more than by **content type**.
- Domain experts group differently than novices — test both segments.
- 30–40% of card sort groupings overlap across participants (strong signal); <20% overlap means content may need restructuring.
- Dendrogram analysis reveals natural breakpoints for category count.

### Grouping Strategies
1. **Audience-based:** "For Developers" / "For Marketers" (when audiences are distinct).
2. **Task-based:** "Get Started" / "Manage" / "Analyze" (preferred for SaaS).
3. **Topic-based:** Traditional category tree (e-commerce, media).
4. **Lifecycle-based:** "Setup" / "Daily Use" / "Advanced" (onboarding-heavy products).

---

## Microcopy in Navigation

Navigation labels ARE microcopy. They set expectations before the click.

### Microcopy Principles for Nav
- **Action-oriented for CTAs:** "Start Free Trial" not "Sign Up."
- **Descriptive for links:** "Pricing Plans" not "Pricing."
- **Honest labels:** Don't say "Free" if registration is required.
- **Consistent tone:** Nav labels match brand voice (formal vs casual).
- **Badge text:** "New" and "Beta" badges must be temporary and meaningful.

### Microcopy Patterns
| Element | Good Example | Bad Example |
|---------|-------------|-------------|
| Empty nav section | "No projects yet — Create one" | "No data" |
| Search placeholder | "Search products, orders, help…" | "Search" |
| Back button | "← Settings" (contextual) | "← Back" |
| Tab label | "Orders" | "My Stuff" |
| Error state | "This page moved — try Search" | "404" |

---

## Sources

- https://www.nngroup.com/articles/card-sorting-definition/
- https://www.nngroup.com/articles/information-scent/
- https://baymard.com/blog/ecommerce-search
- https://baymard.com/blog/product-list-filter-types
- https://www.nngroup.com/articles/flat-vs-deep-hierarchy/
- https://www.behaviormodel.org/
