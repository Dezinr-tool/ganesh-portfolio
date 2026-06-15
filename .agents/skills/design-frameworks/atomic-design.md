# Atomic Design

## Overview

Atomic Design is a methodology for creating design systems created by Brad Frost in 2013. It provides a mental model for breaking interfaces into hierarchical layers—from the smallest UI elements to complete pages—enabling teams to build consistent, scalable, and maintainable digital products.

The name draws from chemistry: atoms combine into molecules, molecules into organisms, and so on. The framework is not a linear process but a **way of thinking about UI composition** that applies equally to design files, code repositories, and documentation.

## The Five Levels

### Atoms

**Definition:** The smallest, indivisible UI building blocks that cannot be broken down further without losing meaning.

**Examples:**
- Buttons (primary, secondary, ghost, disabled states)
- Input fields and labels
- Typography styles (H1–H6, body, caption)
- Color swatches and design tokens
- Icons (individual SVG or icon font glyphs)
- Links, checkboxes, radio buttons, toggles
- Spacing units, border radii, shadow tokens

**Characteristics:**
- No dependencies on other components
- Defined by design tokens (CSS variables, Figma variables)
- Include all interactive states: default, hover, focus, active, disabled, error

**In Figma:** Atoms are typically **components** with variant properties (size, state, type).

**In React:** Atoms map to primitive components—`<Button>`, `<Input>`, `<Icon>`, `<Text>`.

### Molecules

**Definition:** Simple groups of atoms functioning together as a unit.

**Examples:**
- Search form (input atom + button atom + icon atom)
- Form field (label + input + error message atoms)
- Navigation item (icon + text + badge atoms)
- Card metadata row (avatar + name + timestamp atoms)
- Pagination control (button atoms + text atom)

**Characteristics:**
- Single, focused purpose
- Atoms are composed but molecule remains relatively simple
- Molecule behavior emerges from atom interactions

**In Figma:** Molecules are components that **instance** atom components internally.

**In React:**
```jsx
function SearchForm({ onSubmit }) {
  return (
    <form onSubmit={onSubmit}>
      <Input placeholder="Search..." />
      <Button type="submit" icon={<SearchIcon />} />
    </form>
  );
}
```

### Organisms

**Definition:** Complex, distinct sections composed of molecules and/or atoms.

**Examples:**
- Header (logo molecule + navigation molecules + search molecule + user menu molecule)
- Product card grid (multiple product card organisms)
- Comment thread (avatar molecule + text molecules + action molecules)
- Dashboard stats row (stat card molecules × 4)
- Footer (link groups, newsletter molecule, social icons)

**Characteristics:**
- Form recognizable, standalone sections of an interface
- May contain layout logic (grid, flex arrangements)
- Context begins to matter (header organism differs on marketing vs app pages)

**In Figma:** Organisms are often **frame components** with auto-layout, containing molecule instances.

**In React:** Organisms map to section components—`<SiteHeader>`, `<ProductGrid>`, `<CommentThread>`.

### Templates

**Definition:** Page-level layouts that place organisms into a structure without real content.

**Examples:**
- Dashboard template (sidebar organism + main content area + header organism)
- Article template (hero organism + body column + sidebar organism)
- Checkout template (progress organism + form organisms + summary organism)
- Settings template (tab navigation organism + content panel organism)

**Characteristics:**
- Focus on **layout and structure**, not final content
- Use placeholder or wireframe content
- Define responsive breakpoints and grid behavior
- No business logic—pure composition

**In Figma:** Templates are layout frames showing organism placement with lorem/placeholder data.

**In React:** Templates are layout components—`<DashboardLayout>`, `<ArticleLayout>`—often using slots or `{children}`.

### Pages

**Definition:** Specific instances of templates populated with real content.

**Examples:**
- "Q3 Revenue Dashboard" (instance of dashboard template with actual data)
- "How to Set Up Two-Factor Auth" (instance of article template with real copy)
- "Enterprise Pricing" (instance of marketing template with pricing data)

**Characteristics:**
- Real content, real data, real edge cases
- Where design meets content strategy
- Test responsive behavior with actual text lengths
- Validate design system handles production scenarios

**In Figma:** Pages are design deliverables for stakeholder review—templates + real copy.

**In React:** Pages map to route components—`app/dashboard/page.tsx`, `pages/pricing.tsx`.

## Design Systems Integration

Atomic Design is the structural backbone of most modern design systems:

```
Design Tokens (foundation)
    ↓
Atoms (components)
    ↓
Molecules (compound components)
    ↓
Organisms (sections / patterns)
    ↓
Templates (layouts)
    ↓
Pages (routes / screens)
    ↓
Documentation (Storybook, Zeroheight)
```

### Design Tokens Layer (Pre-Atoms)

Brad Frost later acknowledged tokens as the true foundation:

| Token Category | Examples |
|----------------|----------|
| Color | `--color-primary-500`, `--color-text-muted` |
| Typography | `--font-size-lg`, `--font-weight-semibold` |
| Spacing | `--space-4`, `--space-8` |
| Border | `--radius-md`, `--border-width-default` |
| Shadow | `--shadow-sm`, `--shadow-lg` |
| Motion | `--duration-fast`, `--ease-out` |

Tokens ensure atoms update globally when brand changes.

## Naming Conventions

Consistent naming across Figma and code prevents fragmentation.

### Figma Component Naming

```
[Category]/[Component]/[Variant]/[State]

Examples:
Button/Primary/Medium/Default
Button/Primary/Medium/Hover
Input/Text/Default/Focus
Icon/Navigation/Close/24
```

Use **slash hierarchy** for automatic Figma organization. Variant properties: `Type`, `Size`, `State`.

### Code Component Naming

```
PascalCase for components: Button, SearchForm, SiteHeader
camelCase for props: isDisabled, onClick, variant
BEM or utility classes for CSS: .btn--primary, .btn--lg

File structure:
components/
  atoms/
    Button/
      Button.tsx
      Button.module.css
      Button.stories.tsx
      Button.test.tsx
  molecules/
    SearchForm/
  organisms/
    SiteHeader/
  templates/
    DashboardLayout/
```

### Cross-Team Glossary

Maintain a shared spreadsheet or Notion doc mapping:
| Figma Name | Code Name | Storybook ID | Status |
|------------|-----------|--------------|--------|
| Button/Primary/Medium | `<Button variant="primary" size="md">` | atoms-button--primary | ✅ Shipped |

## Figma Workflow

### Setup
1. Create a **Foundations** page: colors, typography, spacing, grid, elevation.
2. Create a **Components** page organized by atomic level.
3. Publish as a **Figma library** for product files to consume.
4. Use **variables** (Figma) for tokens; bind to component properties.

### Building Up
1. Design all atom states first (don't skip disabled/error).
2. Build molecules by instancing atoms—never detach unless necessary.
3. Organisms use auto-layout; set min/max widths for responsive behavior.
4. Templates are separate file sections showing organism placement.
5. Pages live in product-specific files that consume the library.

### Maintenance Rules
- **Never fork atoms** — Update the library; instances propagate.
- **Deprecation process** — Mark old components "Deprecated" with migration notes.
- **Change log** — Document breaking changes in library release notes.

## React Implementation

### Recommended Stack
- **Component library:** Custom atoms/molecules or extend shadcn/ui, Radix, Chakra
- **Documentation:** Storybook with atomic organization in sidebar
- **Styling:** CSS Modules, Tailwind, or styled-components with token references
- **Testing:** Vitest + Testing Library for atoms/molecules; Playwright for pages

### Storybook Organization

```
Atoms/
  Button
  Input
  Icon
Molecules/
  SearchForm
  FormField
Organisms/
  SiteHeader
  ProductCard
Templates/
  DashboardLayout
Pages/
  DashboardPage (composition story)
```

Each story documents props, states, accessibility notes, and Figma link.

### Composition Pattern

```jsx
// organisms/ProductCard.tsx
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { PriceTag } from '@/components/molecules/PriceTag';

export function ProductCard({ product }) {
  return (
    <article className="product-card">
      <img src={product.image} alt={product.name} />
      <Badge>{product.category}</Badge>
      <h3>{product.name}</h3>
      <PriceTag price={product.price} original={product.originalPrice} />
      <Button variant="primary">Add to Cart</Button>
    </article>
  );
}
```

## When to Use Atomic Design

**Use when:**
- Building or scaling a design system
- Multiple products share UI elements
- Team has 2+ designers and 3+ engineers
- Long-lived product requiring maintenance over years
- Brand consistency is a business requirement

**Avoid when:**
- One-off marketing landing page with no reuse
- Pre-product-market-fit startup where UI changes weekly (lightweight component folder is enough)
- Team lacks bandwidth for documentation and governance

## Common Mistakes

1. **Over-classifying** — Debating whether a component is a molecule or organism wastes time. Consistency matters more than perfect taxonomy.

2. **Atoms with business logic** — Atoms should be presentational. Data fetching belongs in pages or containers.

3. **Skipping templates** — Jumping from organisms to pages causes layout inconsistency across routes.

4. **Design-dev drift** — Figma library and code repo diverge. Assign a design system owner to sync quarterly.

5. **Premature abstraction** — Building 40 atoms before validating product direction. Start with 10–15 core atoms.

6. **Ignoring content** — Pages reveal truncation, empty states, and error content needs that organisms hide.

## Case Study: FutureLearn Design System

Brad Frost documented FutureLearn's atomic design system rebuild. The team:

1. Audited existing UI, cataloging 200+ inconsistent button styles → consolidated to 4 atom variants.
2. Built Figma library with atoms/molecules; published to 12 product designers.
3. Parallel Storybook repo mirrored Figma structure; CI blocked PRs using non-system components.
4. Template layer standardized course page, dashboard, and checkout layouts.
5. Result: 40% reduction in design-to-dev handoff time; accessibility audit pass rate improved from 62% to 91%.

## Templates

### Component Spec Document

```markdown
# Component: [Name]
**Level:** Atom / Molecule / Organism
**Figma:** [Link]
**Storybook:** [Link]

## Purpose
[One sentence]

## Anatomy
[List of sub-components / atoms]

## Props / Variants
| Prop | Type | Default | Description |

## States
- Default, Hover, Focus, Active, Disabled, Error, Loading

## Accessibility
- Keyboard: 
- ARIA: 
- Screen reader: 

## Usage Guidelines
**Do:** ...
**Don't:** ...

## Changelog
| Date | Change | Author |
```

## Sources

- Brad Frost — Atomic Design (book): https://atomicdesign.bradfrost.com/
- Brad Frost — Atomic Design Methodology: https://bradfrost.com/blog/post/atomic-web-design/
- Brad Frost — Pattern Lab: https://patternlab.io/
- Storybook — Atomic Design with Storybook: https://storybook.js.org/tutorials/design-systems-for-developers/
- Figma — Building Design Systems: https://www.figma.com/best-practices/design-systems/
- Nathan Curtis — Design Systems (Smashing Magazine): https://www.smashingmagazine.com/2016/06/an-overview-of-design-systems/
- Design Tokens Community Group: https://design-tokens.github.io/community-group/
