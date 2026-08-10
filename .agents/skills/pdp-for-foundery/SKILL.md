---
name: pdp-for-foundery
description: >-
  Builds Product Detail Pages (PDP) for Foundery in PHP/HTML/CSS. Always asks
  for the Figma file first, then creates the PDP using the same styling as the
  brand home page (colors, typography, buttons, spacing). Uses Shapes theme
  section structure as layout reference. Loads companion files from
  .agents/skills/ (ux-rules, ia, design-frameworks). Use for Foundery PDP,
  product page, or Figma-linked e-commerce builds.
---

# PDP For Foundery

Build standalone PHP PDP pages for **Foundery**. Every PDP must **look and feel like the brand home page** — same colors, typography, button styles, borders, shadows, and spacing — while following proven e-commerce PDP section structure.

## Figma file (always ask first)

**Before any design or code work, ask the user to share the Figma file.** Do not start implementation without it.

Use this prompt every time:

> Please share the Figma file for this PDP — include the **home page** frame and the **PDP / product detail** frame (link with node-id if available). I’ll match the PDP styling to your home page and build to the Figma spec.

### What to collect from Figma

| Required | Why |
|----------|-----|
| **Home page frame** | Source of truth for brand styling (colors, fonts, buttons, header, footer) |
| **PDP frame** | Layout, content, product-specific sections, spacing |
| **Design tokens** | Colors, type scale, border radius, shadows if defined |
| **Assets** | Product images, icons, badges, logos |

If only one file is shared, confirm whether home page styling exists in the same file. If the user shares PDP only, ask for the home page frame or style guide before proceeding.

---

## Styling rule: match the home page

**Create the PDP based on home page styling.** This is the default for every Foundery build.

| Derive from home page | Apply on PDP |
|----------------------|--------------|
| Color palette | Backgrounds, text, accents, banners, CTAs |
| Typography (display + body) | Titles, price, descriptions, labels, tabs |
| Button styles | Add to Cart, Buy Now, secondary actions |
| Header / footer | Same chrome as home page — do not redesign |
| Borders, shadows, radii | Gallery frames, cards, badges |
| Icon style | Trust badges, feature strip, nav icons |
| Spacing rhythm | Section padding, grid gaps, container width |

**Structure** comes from the PDP Figma frame and the section list below. **Skin** comes from the home page. When Figma PDP and home page conflict on visual tokens, **home page wins** unless the user says otherwise.

---

## Project skills library (required)

This skill lives in `.agents/skills/` alongside the other project skills. **Read the relevant companion skill files before designing or implementing** — do not rely on training data alone.

### Always read first

| Skill folder | File | Use for Foundery PDP |
|--------------|------|----------------------|
| `ux-rules/` | `conversion-ux.md` | Trust signals, CTAs, friction, social proof, pricing |
| `ux-rules/` | `web-ux.md` | CTA placement, tabs, forms, typography, above-the-fold |
| `ux-rules/` | `accessibility.md` | Contrast, touch targets, keyboard nav, ARIA on tabs/carousel |
| `ux-rules/` | `mobile-ux.md` | Mobile gallery stack, thumb-zone CTAs, responsive breakpoints |
| `ia/` | `ia-patterns-by-industry.md` | E-commerce PDP structure and industry norms |
| `ia/` | `navigation-patterns.md` | Header, sticky nav, footer link hierarchy |

### Read when relevant

| Skill folder | File | Use when |
|--------------|------|----------|
| `design-frameworks/` | `atomic-design.md` | Breaking PDP into reusable components (gallery, card, badge) |
| `ux-rules/` | `heuristics.md` | Heuristic review before delivery |
| `ux-rules/` | `ux-controversies.md` | E-commerce debates (infinite scroll, breadcrumbs, search vs browse) |
| `transitions-dev` (user skill) | `SKILL.md` | Marquee, carousel, tab, and button transitions |
| `ui-ux-pro-max` (user skill) | `SKILL.md` | Typography pairing or palette adjustments beyond Shapes defaults |

### Recommended workflow

```
0. Ask user for Figma file (home page + PDP frames)     → REQUIRED, do not skip
1. Open Figma + home page in browser                      → Extract styling tokens
2. pdp-for-foundery/SKILL.md                              → Section structure
3. ux-rules/conversion-ux.md                              → E-commerce patterns
4. ux-rules/web-ux.md                                     → Component-level UX
5. ia/ia-patterns-by-industry.md                          → E-commerce IA
6. Implement in pdp/                                      → Home page styling + PDP layout
7. transitions-dev                                        → GSAP marquee + interactions
8. ux-rules/accessibility.md                              → Final a11y audit
9. QA checklist (below)                                   → Figma + home page side-by-side
```

### E-commerce skill combination

Same pattern as `ux-rules/SKILL.md` E-Commerce Flow:

```
1. conversion-ux.md → Baymard checkout, trust, friction
2. web-ux.md        → Forms, navigation, CTAs
3. mobile-ux.md     → Mobile PDP optimization
4. accessibility.md → Labels, contrast, keyboard
5. pdp-for-foundery → Home page styling + PDP structure
```

---

## Reference sources

1. **User Figma file** — home page + PDP frames (primary; always request first)
2. **Live structure reference** (layout patterns only, not styling): https://shapes-preset-pantry.myshopify.com/products/crispy-chili-oil
3. **Project implementation**: `pdp/index.php`, `pdp/css/pdp.css`, `pdp/js/pdp.js`
4. **Static preview**: `public/pdp/index.html` → http://localhost:3000/pdp/index.html

Open Figma and the built page side-by-side after implementation. Visual styling must match the **home page**; layout and sections must match the **PDP Figma frame**.

---

## Required page structure (top → bottom)

| # | Section | Key elements |
|---|---------|--------------|
| 1 | **Sticky header** | Hamburger · centered logo · search · cart |
| 2 | **Product grid** (2-col desktop, 1-col mobile) | Gallery left · info right |
| 3 | **Gallery** | Match home page card/image treatment · product badge · nav arrows · dot indicators |
| 4 | **Product info** | Title · price · description · CTAs styled like home page buttons |
| 5 | **Tabs** | Ingredients · Shipping · Wholesale (underline active state) |
| 6 | **Flavor scales** | Sweet/Salty/Sour/Bitter/Umami — 5-dot rating (filled = level) |
| 7 | **Trust badges** | Circular icons row: Low Salt, No Bad Stuff, Organic, Non-GMO, Probiotic |
| 8 | **Promo banner** | Home page accent colors · GSAP horizontal marquee if in Figma |
| 9 | **Testimonial** | Home page quote/block styling · stars · carousel if in Figma |
| 10 | **Related products** | Product cards matching home page collection cards |
| 11 | **Feature strip** | Horizontal scrollable icon row (Low salt, Organic, etc.) |
| 12 | **Footer** | Newsletter · social · 4-column links · copyright |

Do not reorder sections unless the user explicitly requests it. Omit sections not present in the Figma PDP frame after confirming with the user.

---

## Visual system

**Do not use hardcoded Shapes/Hella Goods colors unless the Figma home page uses them.**

Extract CSS custom properties from the **home page Figma frame** and reuse across the PDP:

```css
/* Example — replace values from Figma home page */
:root {
  --foundery-accent:   /* primary CTA / highlight from home page */;
  --foundery-secondary: /* secondary accent from home page */;
  --foundery-bg:       /* page background */;
  --foundery-text:     /* body text */;
  --foundery-display:  /* heading font family */;
  --foundery-body:     /* body font family */;
  --foundery-border:   /* border width + color */;
  --foundery-shadow:   /* shadow style from home page cards */;
  --foundery-radius:   /* button/card radius from home page */;
}
```

| Token | Source |
|-------|--------|
| Colors | Home page Figma — backgrounds, text, accents |
| Typography | Home page Figma — display + body fonts, sizes, weights |
| Buttons | Home page CTA components — reuse exact styles on PDP |
| Borders / shadows | Home page cards, images, badges |
| Class prefix | `foundery-` or `shapes-` (keep existing BEM in `pdp/` unless refactoring) |

**Fallback** (only when Figma home page is unavailable and user approves):

```css
--shapes-green: #7cff00; --shapes-red: #ff3131; --shapes-yellow: #ffd400;
--shapes-black: #111111; --shapes-white: #ffffff;
```

Animations: **GSAP** for promo marquee. Vanilla JS for tabs, gallery slides, testimonial carousel.

---

## File layout

```
.agents/skills/pdp-for-foundery/
├── SKILL.md           # Source of truth (this file)
├── reference.md       # Section snippets
└── metadata.json

public/downloads/      # Downloadable copies (sync with npm run sync:pdp-skill)
├── pdp-for-foundery-skill.md
└── pdp-for-foundery-reference.md

pdp/
├── config.php         # Download path helpers
├── downloads/         # Mirror for standalone PHP server
├── index.php
├── css/pdp.css
└── js/pdp.js

public/pdp/            # Static mirror for Next.js dev preview
├── index.html
├── css/pdp.css
└── js/pdp.js
```

### Downloadable skill docs

The skill markdown is published for download at:

| File | URL (Next.js) |
|------|----------------|
| Skill guide | `/downloads/pdp-for-foundery-skill.md` |
| Section reference | `/downloads/pdp-for-foundery-reference.md` |

The PDP footer includes **Download PDP skill (MD)** and **Download reference (MD)** links.

After editing `.agents/skills/pdp-for-foundery/*.md`, run:

```bash
npm run sync:pdp-skill
```

### PHP patterns

Use PHP arrays + loops for repeatable data:

```php
$flavors = [
  ['label' => 'Sweet',  'level' => 2],
  ['label' => 'Salty',  'level' => 3],
  // ...
];
$related = [
  ['name' => '...', 'price' => '$25.00', 'img' => '...'],
];
```

Always `htmlspecialchars()` on user-facing strings in attributes.

### Static preview sync

When PHP is not installed locally, copy assets to `public/pdp/` and expand PHP loops into static HTML so the page serves at `/pdp/index.html`.

Run PHP locally: `cd pdp && php -S localhost:8080`

---

## JavaScript responsibilities (`pdp.js`)

1. **Tabs** — toggle `.shapes-tabs__btn--active` and `.shapes-tabs__panel--active` via `data-tab`
2. **Gallery** — prev/next arrows update `.shapes-gallery__image` src and dot states
3. **Testimonial** — carousel cycles quote + author arrays
4. **Marquee** — duplicate `.shapes-promo__track` innerHTML, GSAP infinite `x` translate

---

## QA checklist (required before done)

- [ ] Figma file was requested and received (home page + PDP)
- [ ] Open `public/pdp/index.html` (or PHP server) in browser
- [ ] Open Figma PDP frame side-by-side
- [ ] Compare PDP styling against **home page** (colors, fonts, buttons, header, footer)
- [ ] Verify all sections from Figma present in correct order
- [ ] Compare: gallery, CTAs, tabs, flavor dots, badges, banners, related cards
- [ ] Test tab switching, gallery arrows, testimonial carousel
- [ ] Confirm mobile breakpoint stacks gallery above info at ≤900px
- [ ] List differences found → fix → re-check

---

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Starting without Figma | Always ask for Figma (home page + PDP) before coding |
| Styling from Shapes demo instead of home page | Extract tokens from Figma home page |
| Mismatched header/footer vs home page | Reuse same header/footer components and styles |
| Soft/blurred shadows | Match home page shadow style exactly |
| Missing flavor scales | Include if present in Figma PDP frame |
| Wrong section order | Follow Figma PDP frame section order |
| Framer Motion added | Use GSAP only (project animation rule) |
| Portfolio nav overlay | Static `public/pdp/` avoids Next.js layout |

---

## Extending for new products

1. Confirm Figma file is shared (home page + new PDP frame)
2. Update product copy, price, flavor levels, badges from Figma
3. Re-apply home page styling tokens — do not copy previous product colors blindly
4. Export assets from Figma (images, icons, logos)
5. Sync `public/pdp/index.html` if static preview is used
6. Run `npm run sync:pdp-skill` if skill docs changed
7. Re-run QA against Figma home page + PDP frame

---

## Additional resources

- Section-level HTML/CSS snippets: [reference.md](reference.md)
- Skill metadata and companion map: [metadata.json](metadata.json)

## Related skills (same library)

| Skill | Path | Relationship |
|-------|------|--------------|
| UX Rules | `.agents/skills/ux-rules/` | Usability, conversion, accessibility — **read before implementing** |
| Information Architecture | `.agents/skills/ia/` | E-commerce IA patterns, navigation structure |
| Design Frameworks | `.agents/skills/design-frameworks/` | Atomic design for component breakdown |
| Transitions Dev | `~/.agents/skills/transitions-dev/` | GSAP motion for marquee, carousel, tabs |
| UI/UX Pro Max | `~/.agents/skills/ui-ux-pro-max/` | Visual design intelligence when Shapes defaults need extension |
