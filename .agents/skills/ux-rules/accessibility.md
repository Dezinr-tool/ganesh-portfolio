# Accessibility (a11y) Reference

Comprehensive guide to building accessible digital products aligned with WCAG 2.1, emerging WCAG 3.0 direction, and practical implementation patterns.

---

## WCAG 2.1 Conformance Levels Summary

Web Content Accessibility Guidelines (WCAG) 2.1, published by W3C, defines three conformance levels: A (minimum), AA (legal standard in most jurisdictions), and AAA (enhanced).

### Level A — Minimum Requirements

Must be satisfied or content is inaccessible to many users.

**Perceivable:**
- **1.1.1 Non-text Content:** All images, icons, and media have text alternatives (`alt`, `aria-label`, or adjacent text).
- **1.2.1–1.2.3 Time-based Media:** Alternatives for audio-only and video-only content; captions for prerecorded video.
- **1.3.1 Info and Relationships:** Semantic HTML conveys structure (headings, lists, tables, form labels).
- **1.3.2 Meaningful Sequence:** Reading order matches visual/logical order.
- **1.3.3 Sensory Characteristics:** Instructions don't rely solely on shape, color, size, or sound.
- **1.4.1 Use of Color:** Color is not the only visual means of conveying information.
- **1.4.2 Audio Control:** Mechanism to pause/stop/mute auto-playing audio.

**Operable:**
- **2.1.1 Keyboard:** All functionality available via keyboard.
- **2.1.2 No Keyboard Trap:** Focus can move away from any component.
- **2.2.1 Timing Adjustable:** Time limits can be extended or disabled.
- **2.2.2 Pause, Stop, Hide:** User control over moving/blinking content.
- **2.3.1 Three Flashes:** No content flashes more than 3 times per second.
- **2.4.1 Bypass Blocks:** Skip navigation mechanism.
- **2.4.2 Page Titled:** Descriptive page titles.
- **2.4.3 Focus Order:** Logical focus sequence.
- **2.4.4 Link Purpose:** Link purpose clear from text or context.
- **2.5.1 Pointer Gestures:** Single-pointer alternatives for multipoint/path gestures.
- **2.5.2 Pointer Cancellation:** Actions on up-event or abortable.
- **2.5.3 Label in Name:** Visible label text included in accessible name.
- **2.5.4 Motion Actuation:** Motion-based input can be disabled.

**Understandable:**
- **3.1.1 Language of Page:** `lang` attribute on `<html>`.
- **3.2.1 On Focus:** No context change on focus alone.
- **3.2.2 On Input:** No unexpected context change on input.
- **3.3.1 Error Identification:** Errors identified and described in text.
- **3.3.2 Labels or Instructions:** Labels provided for user input.

**Robust:**
- **4.1.1 Parsing (obsolete in WCAG 2.2):** Valid markup.
- **4.1.2 Name, Role, Value:** UI components have accessible names and states.

### Level AA — Industry Standard (Target for Most Products)

**Perceivable:**
- **1.2.4 Captions (Live):** Captions for live audio.
- **1.2.5 Audio Description:** Audio description for prerecorded video.
- **1.3.4 Orientation:** Content not restricted to single orientation.
- **1.3.5 Identify Input Purpose:** Autocomplete attributes for personal data fields.
- **1.4.3 Contrast (Minimum):** 4.5:1 for normal text, 3:1 for large text.
- **1.4.4 Resize Text:** Text resizable to 200% without loss of content/function.
- **1.4.5 Images of Text:** Use real text instead of images of text.
- **1.4.10 Reflow:** No horizontal scrolling at 320px width, 400% zoom.
- **1.4.11 Non-text Contrast:** 3:1 for UI components and graphical objects.
- **1.4.12 Text Spacing:** No loss of content when spacing is adjusted.
- **1.4.13 Content on Hover/Focus:** Dismissible, hoverable, persistent tooltips.

**Operable:**
- **2.4.5 Multiple Ways:** More than one way to find pages.
- **2.4.6 Headings and Labels:** Descriptive headings and labels.
- **2.4.7 Focus Visible:** Keyboard focus indicator visible.

**Understandable:**
- **3.1.2 Language of Parts:** `lang` on foreign-language passages.
- **3.2.3 Consistent Navigation:** Navigation consistent across pages.
- **3.2.4 Consistent Identification:** Same functionality, same labels.
- **3.3.3 Error Suggestion:** Suggestions provided when errors detected.
- **3.3.4 Error Prevention (Legal/Financial):** Review, confirm, or reverse for critical transactions.

**Robust:**
- **4.1.3 Status Messages:** Status messages programmatically determinable without focus.

### Level AAA — Enhanced (Aspirational)

Not required for legal compliance but improves experience significantly.

- **1.4.6 Contrast (Enhanced):** 7:1 normal text, 4.5:1 large text.
- **1.4.8 Visual Presentation:** User control over foreground/background colors, line height, spacing.
- **2.1.3 Keyboard (No Exception):** All functionality via keyboard without exception.
- **2.2.3 No Timing:** No time limits except real-time events.
- **2.4.8 Location:** Information about user's location within site.
- **2.4.9 Link Purpose (Link Only):** Link purpose from link text alone.
- **2.4.10 Section Headings:** Section headings organize content.
- **3.1.3 Unusual Words:** Definitions for jargon and idioms.
- **3.1.4 Abbreviations:** Mechanism to identify expanded forms.
- **3.1.5 Reading Level:** Supplementary content for lower secondary education level.
- **3.3.5 Help:** Context-sensitive help available.
- **3.3.6 Error Prevention (All):** Reversible, checked, or confirmed for all submissions.

---

## WCAG 3.0 (W3C Working Draft) — Key Changes

WCAG 3.0 (also called W3C Accessibility Guidelines) represents a structural shift from pass/fail criteria to scored outcomes.

### Paradigm Shift
- **Conformance model:** Moves from A/AA/AAA levels to **bronze/silver/gold** tiers with scoring (0–4 per outcome).
- **Scope expansion:** Covers mobile apps, IoT, AR/VR, and emerging technologies explicitly.
- **Testing flexibility:** Combines automated, manual, and user testing with weighted scoring.
- **Plain language:** Guidelines rewritten for broader audience comprehension.

### New Outcome Categories
1. **Visual** — contrast, text alternatives, motion
2. **Auditory** — captions, audio descriptions, sound alternatives
3. **Motor** — keyboard, pointer, voice input alternatives
4. **Cognitive** — clear language, error prevention, memory support
5. **Sensory** — vestibular, seizure safety, sensory alternatives

### Cognitive Accessibility Emphasis
WCAG 3.0 elevates cognitive accessibility from peripheral concern to first-class outcomes:
- Clear navigation and wayfinding
- Reduced cognitive load in forms and workflows
- Support for personalization (user preferences for contrast, motion, density)
- Plain language requirements strengthened

### Migration Guidance (2024–2026)
- **Continue targeting WCAG 2.1 AA** for legal compliance (ADA, EAA, Section 508).
- **Adopt WCAG 3.0 principles** proactively where they exceed 2.1 (especially cognitive and personalization).
- Monitor W3C working draft updates; final publication expected post-2026.

---

## Color Contrast Ratios

### WCAG 2.1 Requirements

| Content Type | AA Minimum | AAA Enhanced |
|-------------|------------|--------------|
| Normal text (<18pt / <14pt bold) | 4.5:1 | 7:1 |
| Large text (≥18pt / ≥14pt bold) | 3:1 | 4.5:1 |
| UI components & graphical objects | 3:1 | — |
| Focus indicators | 3:1 against adjacent colors | — |
| Disabled controls | No requirement (but avoid relying on color alone) | — |

### Practical Contrast Rules
- Test text against its **immediate background**, not page background.
- Text over images: use scrim/overlay to guarantee ratio, or avoid text on photos.
- Placeholder text must meet contrast requirements (often fails at default `#999`).
- Brand colors that fail contrast: use darker shades for text, lighter for backgrounds.
- Don't forget **dark mode** — test both themes independently.

### Tools for Contrast Checking
- WebAIM Contrast Checker
- Stark (Figma plugin)
- axe DevTools
- Chrome DevTools color picker (shows ratio)

---

## Touch Targets: 44×44 CSS Pixels Minimum

### Standards
- **WCAG 2.5.5 Target Size (AAA):** 44×44 CSS pixels minimum.
- **WCAG 2.5.8 Target Size (Minimum) (AA in WCAG 2.2):** 24×24 CSS pixels with spacing, or 44×44 for AAA best practice.
- **Apple HIG:** 44×44 pt minimum.
- **Material Design 3:** 48×48 dp recommended (48dp touch target).

### Implementation
```css
/* Minimum touch target with visual icon smaller */
.touch-target {
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
```

### Spacing Between Targets
- Minimum 8px gap between adjacent touch targets to prevent mis-taps.
- Destructive actions need extra separation from primary actions.

---

## Screen Readers

### Major Screen Readers
| Platform | Screen Reader | Engine |
|----------|--------------|--------|
| Windows | NVDA, JAWS | Free / commercial |
| macOS/iOS | VoiceOver | Built-in |
| Android | TalkBack | Built-in |
| Linux | Orca | Free |

### Screen Reader UX Principles
1. **Semantic HTML first:** `<button>`, `<nav>`, `<main>`, `<article>`, `<h1>`–`<h6>`.
2. **Accessible names:** Every interactive element has a discernible name (visible label, `aria-label`, or `aria-labelledby`).
3. **Announce dynamic changes:** Use `aria-live="polite"` or `role="status"` for updates that don't move focus.
4. **Don't over-announce:** `aria-live="assertive"` only for critical, time-sensitive alerts.
5. **Hide decorative content:** `aria-hidden="true"` on purely decorative icons and illustrations.
6. **Reading order = DOM order:** Visual reordering with CSS must not break logical sequence.

### Common Screen Reader Patterns
- **Skip link:** First focusable element; jumps to `<main>`.
- **Landmark regions:** `<header>`, `<nav>`, `<main>`, `<footer>`, `role="search"`.
- **Form errors:** `aria-invalid="true"` + `aria-describedby` pointing to error message.
- **Loading states:** `aria-busy="true"` on updating regions; announce completion via live region.

---

## Keyboard Navigation

### Requirements
- All interactive elements reachable via Tab (or logical tab order).
- Enter/Space activate buttons and links.
- Arrow keys navigate within composite widgets (tabs, menus, radio groups, listboxes).
- Escape closes modals, dropdowns, and popovers.
- No keyboard traps except intentional modal focus traps with escape.

### Tab Order Rules
1. Follow visual reading order (left-to-right, top-to-bottom for LTR languages).
2. `tabindex="0"` adds element to natural tab order.
3. `tabindex="-1"` removes from tab order but allows programmatic focus.
4. Never use positive `tabindex` values (breaks natural order).

### Focus Management
- **On modal open:** Move focus to first focusable element (or modal container).
- **On modal close:** Return focus to trigger element.
- **On route change (SPA):** Move focus to `<h1>` or page title.
- **On delete/remove:** Move focus to logical next element (not body).
- **On form error:** Move focus to error summary or first invalid field.

### Visible Focus Indicators
```css
:focus-visible {
  outline: 2px solid var(--focus-color);
  outline-offset: 2px;
}
```
- Never use `outline: none` without a replacement focus style.
- Focus ring must have 3:1 contrast against adjacent colors (WCAG 2.2).

---

## ARIA Roles and Attributes

### First Rule of ARIA
**Don't use ARIA if native HTML suffices.** `<button>` is always better than `<div role="button">`.

### Common Roles (When Native HTML Insufficient)

| Role | Use Case |
|------|----------|
| `role="dialog"` | Modal dialogs (with `aria-modal="true"`) |
| `role="alert"` | Important, time-sensitive messages |
| `role="status"` | Advisory messages (polite live region) |
| `role="tablist/tab/tabpanel"` | Tab interfaces |
| `role="menu/menuitem"` | Application menus (not navigation) |
| `role="listbox/option"` | Custom select components |
| `role="combobox"` | Autocomplete inputs |
| `role="progressbar"` | Progress indicators |
| `role="navigation"` | When `<nav>` insufficient (rare) |

### Essential ARIA Attributes
- `aria-label` — accessible name when no visible label
- `aria-labelledby` — references element(s) providing name
- `aria-describedby` — references descriptive/help text
- `aria-expanded` — toggle button/menu open state
- `aria-selected` — selected tab/option
- `aria-checked` — checkbox/radio/switch state
- `aria-disabled` — disabled state for custom widgets
- `aria-hidden` — hide from accessibility tree
- `aria-live` — announce dynamic content changes
- `aria-current` — indicate current page/step/item

### ARIA Anti-Patterns
- `role="presentation"` on semantic elements that convey meaning
- `aria-label` duplicating visible text (redundant)
- Empty `aria-label` on elements with visible text
- `role="button"` on `<a href>` (pick one element type)
- Live regions firing on every keystroke

---

## Common Accessibility Failures and Fixes

| Failure | Impact | Fix |
|---------|--------|-----|
| Missing `alt` on informative images | Screen reader users miss content | Descriptive `alt`; `alt=""` for decorative |
| `<div onclick>` instead of `<button>` | Not keyboard accessible, wrong role | Use `<button>` or add role + keyboard handlers |
| Form inputs without labels | Screen readers can't identify fields | `<label for>` or `aria-label` |
| Low contrast text | Unreadable for low vision users | Meet 4.5:1 ratio; test with tools |
| No focus indicator | Keyboard users lose position | `:focus-visible` styles |
| Auto-playing media | Disorienting, violates 1.4.2 | User-initiated play; provide controls |
| Infinite scroll only | Keyboard/screen reader users can't reach content | "Load more" button; pagination option |
| Modal without focus trap | Focus escapes to background | Trap focus; restore on close |
| Color-only status indicators | Colorblind users miss meaning | Add icon/text/shape |
| `tabindex` > 0 | Illogical tab order | Remove; use DOM order |
| Missing page `<title>` | Users can't identify tabs/windows | Unique, descriptive titles |
| Tables for layout | Screen readers misinterpret structure | CSS for layout; `<table>` for data only |
| Icon-only buttons without labels | Purpose unknown | `aria-label` on button |
| CAPTCHA without alternative | Blocks users with disabilities | Audio CAPTCHA, honeypot, or alternative verification |
| PDF-only content | Often inaccessible | HTML alternative or tagged, accessible PDF |
| Custom dropdown without ARIA | Not operable by keyboard/AT | Implement combobox pattern (WAI-ARIA APG) |

---

## Testing Tools

### Automated Testing
| Tool | Type | Notes |
|------|------|-------|
| axe DevTools | Browser extension | Industry standard; catches ~30–50% of issues |
| Lighthouse (Chrome) | Built-in audit | Good baseline; accessibility score |
| WAVE | Browser extension | Visual feedback overlay |
| pa11y | CLI / CI | Automated pipeline integration |
| eslint-plugin-jsx-a11y | Linting | Catch issues during development |

### Manual Testing Checklist
1. Navigate entire page using keyboard only (Tab, Shift+Tab, Enter, Space, Escape, arrows).
2. Test with screen reader (VoiceOver on Mac: Cmd+F5).
3. Zoom to 200% — verify no content loss or horizontal scroll.
4. Test with Windows High Contrast Mode.
5. Verify all form fields have visible labels and error messages.
6. Test with reduced motion (`prefers-reduced-motion: reduce`).
7. Test on mobile with TalkBack (Android) or VoiceOver (iOS).

### User Testing
- Include people with disabilities in usability testing.
- Disability advocacy organizations and services (e.g., Fable, Access Works) provide testers.
- Automated tools catch code issues; only humans catch real-world usability barriers.

### CI/CD Integration
```bash
# Example: pa11y in CI pipeline
npx pa11y https://localhost:3000 --standard WCAG2AA
```

---

## Legal and Compliance Context

- **United States:** ADA Title III increasingly applied to websites; DOJ guidance references WCAG 2.1 AA.
- **European Union:** European Accessibility Act (EAA), effective June 2025, requires WCAG 2.1 AA for e-commerce, banking, e-books, and more.
- **Section 508 (US Federal):** Requires WCAG 2.0 AA (being updated to 2.1).
- **EN 301 549 (EU):** References WCAG 2.1 for ICT procurement.

**Recommendation:** Target WCAG 2.1 Level AA as minimum for all public-facing products.

---

## Sources

- W3C (2018). *Web Content Accessibility Guidelines (WCAG) 2.1*. https://www.w3.org/TR/WCAG21/
- W3C (2024). *W3C Accessibility Guidelines (WCAG) 3.0 Working Draft*. https://www.w3.org/WAI/standards-guidelines/wcag/wcag3-intro/
- W3C. *WAI-ARIA Authoring Practices Guide (APG)*. https://www.w3.org/WAI/ARIA/apg/
- WebAIM. *Contrast Checker*. https://webaim.org/resources/contrastchecker/
- WebAIM. *Screen Reader User Survey*. https://webaim.org/projects/screenreadersurvey/
- Deque Systems. *axe Accessibility Testing*. https://www.deque.com/axe/
- Apple. *Accessibility Programming Guide*. https://developer.apple.com/accessibility/
- Google. *Material Design Accessibility*. https://m3.material.io/foundations/accessible-design
- MDN Web Docs. *ARIA*. https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA
- European Commission. *European Accessibility Act*. https://employment-social-affairs.ec.europa.eu/policies-and activities/health-and-safety-work/european-accessibility-act_en
