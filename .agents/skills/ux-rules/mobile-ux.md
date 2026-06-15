# Mobile UX Reference

Authoritative mobile UX patterns for iOS, Android, and responsive web apps.

---

## iOS Human Interface Guidelines (Latest)

Apple's HIG emphasizes **clarity, deference, and depth**.

### Navigation
- Use tab bars for 3–5 top-level sections; never more than five tabs
- Use navigation bars with clear back affordance and large titles where appropriate
- Prefer standard transitions; custom animations must not disorient

### Layout & Safe Areas
- Respect safe areas (notch, Dynamic Island, home indicator)
- Minimum tappable target: **44×44 pt** (Apple HIG)
- Use SF Symbols for consistency; match weight to adjacent text

### Typography
- System font: SF Pro / SF Pro Rounded
- Minimum body text: **17 pt** for primary reading content
- Support Dynamic Type — never disable accessibility text sizing

### Feedback
- Haptic feedback for confirmations and errors (UIImpactFeedbackGenerator)
- Pull-to-refresh for content feeds
- Swipe actions on list rows for secondary actions

---

## Material Design 3 (Latest)

Material 3 centers **personal color (Material You)**, expressive motion, and adaptive layouts.

### Key principles
- **Dynamic color** from user wallpaper or brand seed color
- **Tonal palettes** instead of flat primary/secondary only
- **Shape**: rounded corners with semantic size tokens (small/medium/large)
- **Elevation**: use surface tints and shadows sparingly on mobile

### Components
- Top app bar: center-aligned or small/large collapsing variants
- FAB for single primary action per screen
- Bottom sheets for contextual actions (prefer over full-screen modals)
- Snackbars: 4–10 seconds, one action max

### Touch targets
- Minimum **48×48 dp** touch target (Material accessibility guidance)

---

## Thumb Zone Mapping (Steven Hoober Research)

Based on observations of 1,333 mobile users:

| Zone | Reachability | Best for |
|------|--------------|----------|
| Easy (lower center) | Natural thumb arc | Primary CTAs, tab bar, FAB |
| Stretch (upper center) | Requires hand shift | Secondary actions |
| Hard (top corners) | Difficult one-handed | Avoid critical actions |

**Design rules:**
- Place primary actions in bottom 40% of screen
- Keep destructive actions away from easy zone unless intentional friction
- On large phones (6.5"+), enable reachability or bottom-aligned controls

---

## Mobile Navigation Patterns

| Pattern | Best for | Caution |
|---------|----------|---------|
| Tab bar | 3–5 sections | Too many tabs reduce discoverability |
| Hamburger | Many sections, infrequent access | Hides IA; hurts discoverability |
| Bottom sheet nav | Secondary destinations | Don't nest deeply |
| Gesture nav (iOS back swipe) | Standard stack | Don't break system back gesture |

---

## Touch Gesture Standards

| Gesture | Convention |
|---------|------------|
| Tap | Primary selection |
| Long press | Context menu / secondary options |
| Swipe horizontal | Delete, archive, navigate carousel |
| Swipe from edge | Back navigation (iOS/Android) |
| Pinch | Zoom maps and images |
| Pull down | Refresh |

Never override system gestures without strong justification.

---

## Mobile Typography Minimums

| Element | iOS | Android/Web |
|---------|-----|-------------|
| Body | 17 pt | 16 sp minimum |
| Caption | 12 pt min | 12 sp min |
| Button label | 17 pt semibold | 14 sp medium+ |
| Input text | 16 px min (prevents iOS zoom) | 16 sp |

Line height: 1.4–1.6 for body text on small screens.

---

## Performance UX

- **Perceived performance** beats raw speed — show progress within 100ms
- **Skeleton screens** for lists and cards (match final layout geometry)
- **Optimistic UI** for likes, toggles, cart adds with rollback on failure
- **Progressive loading**: hero content first, below-fold lazy
- Target **LCP < 2.5s** on 4G; avoid layout shift (CLS < 0.1)

---

## Offline UX Patterns

- Indicate offline state in app bar or banner (non-blocking)
- Cache last successful data for read-only browsing
- Queue writes with clear "pending sync" status
- Disable actions that require network with explanation
- Sync conflicts: show diff and let user choose

---

## Notification Best Practices

- Request permission **in context** (after user sees value), not on first launch
- Categorize: transactional vs promotional
- Allow granular opt-out per category
- Deep link to relevant screen, not home
- Respect quiet hours and frequency caps

---

## Mobile Form Design

- One field per row; label above field (not placeholder-only)
- Use appropriate keyboards (`email`, `tel`, `numeric`)
- Autofill and password manager support
- Inline validation after blur, not on every keystroke
- Break long forms into steps with progress indicator
- Sticky CTA on keyboard-visible screens

---

## Sources

- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design 3](https://m3.material.io/)
- [Steven Hoober — How Do Users Really Hold Mobile Devices](https://www.uxmatters.com/mt/archives/2013/02/how-do-users-really-hold-their-mobile-devices.php)
- [Web.dev — Core Web Vitals](https://web.dev/vitals/)
- [Nielsen Norman Group — Mobile UX](https://www.nngroup.com/topic/mobile/)
