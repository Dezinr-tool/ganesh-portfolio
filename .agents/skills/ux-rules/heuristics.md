# Usability Heuristics Reference

A consolidated reference for evaluating interface usability using Nielsen's heuristics, Shneiderman's Golden Rules, Gerhardt-Powals cognitive principles, and recent Nielsen Norman Group (NNG) guidance.

---

## Nielsen's 10 Usability Heuristics (Full)

Source: Jakob Nielsen, 1994 (revised 2020). These remain the most widely cited heuristic evaluation framework.

### 1. Visibility of System Status

The system should always keep users informed about what is going on, through appropriate feedback within reasonable time.

**What it means:** Users should never wonder whether their action registered, whether data is loading, or what state the system is in.

**Application examples:**
- Show a spinner or skeleton screen within 100–300ms of a user action that triggers loading
- Display "Saved" or a checkmark after autosave completes
- Use progress bars for multi-step uploads with percentage and time estimate
- Show connection status indicators in real-time collaborative apps
- Breadcrumb trails that reflect current location in deep hierarchies

**Common violations:**
- Button click with no visual feedback for 2+ seconds
- Form submission with no loading state, causing double-submits
- Background sync with no indication data may be stale
- Modal closes before async operation completes, leaving user uncertain

**Severity examples:** Double-submit causing duplicate orders = Severity 4; missing save confirmation = Severity 2

---

### 2. Match Between System and the Real World

The system should speak the users' language, with words, phrases, and concepts familiar to the user, rather than system-oriented terms.

**What it means:** Use domain vocabulary your audience understands. Follow real-world conventions and mental models.

**Application examples:**
- E-commerce: "Cart" not "Basket entity"
- Calendar: drag events to reschedule, mirroring paper planners
- Trash/Recycle bin metaphor for deletable items
- "Inbox" for messages, not "Message queue buffer"
- Currency and date formats matching user locale

**Common violations:**
- Error codes like `ERR_AUTH_0x4F2` shown to end users
- Technical jargon ("invalidate cache") in consumer apps
- Icons with no cultural familiarity (e.g., floppy disk for save to Gen Z users)
- Internal product codenames in user-facing UI

---

### 3. User Control and Freedom

Users often choose system functions by mistake and need a clearly marked "emergency exit" to leave the unwanted state without going through an extended dialogue.

**What it means:** Support undo, cancel, back navigation, and easy escape from any state.

**Application examples:**
- Undo/redo in text editors and design tools
- "Cancel" on every modal and multi-step wizard
- Back button in checkout that preserves cart contents
- Unsubscribe in one click from email footers
- Soft-delete with recovery period before permanent deletion

**Common violations:**
- Irreversible actions without confirmation (delete account, send email)
- No way to exit fullscreen onboarding without completing it
- Browser back button breaks SPA state
- Trapping users in modal loops

---

### 4. Consistency and Standards

Users should not have to wonder whether different words, situations, or actions mean the same thing.

**What it means:** Follow platform conventions, internal design system rules, and industry standards.

**Application examples:**
- Primary actions always in the same position (bottom-right of modals)
- Consistent terminology: never alternate "Delete" and "Remove" for the same action
- Link styling consistent across the product (color, underline on hover)
- iOS: swipe-back gesture; Android: system back button behavior
- Form labels above fields throughout, not mixed above/inline

**Common violations:**
- Same action labeled differently on different pages
- Inconsistent button hierarchy (primary vs secondary colors swapped)
- Mixing design systems (Material buttons with iOS-style toggles)
- Date formats varying across screens (MM/DD vs DD/MM)

---

### 5. Error Prevention

Even better than good error messages is a careful design which prevents a problem from occurring in the first place.

**What it means:** Constrain inputs, confirm destructive actions, disable invalid options, and guide users toward success.

**Application examples:**
- Disable "Submit" until required fields are valid
- Confirmation dialog before permanent deletion
- Autocomplete and address validation at checkout
- Gray out unavailable time slots in booking
- Password strength meter before submission
- Prevent selecting end date before start date

**Common violations:**
- Allowing form submission with empty required fields
- No validation until server round-trip
- Easy accidental taps on destructive actions adjacent to primary actions
- Paste blocked in password confirmation fields

---

### 6. Recognition Rather Than Recall

Minimize the user's memory load by making objects, actions, and options visible.

**What it means:** Show options rather than requiring users to remember commands, codes, or prior steps.

**Application examples:**
- Recently viewed items on e-commerce homepages
- Autocomplete search with suggestions
- Visible navigation menus vs hidden command-line interfaces
- Tooltips on icon-only buttons
- Pre-filled forms with known user data
- "Continue where you left off" on streaming platforms

**Common violations:**
- Requiring users to remember reference numbers without lookup
- Hidden navigation behind hamburger with no signifiers
- Multi-step flows that don't show completed step summaries
- Command palettes without discoverability hints for new users

---

### 7. Flexibility and Efficiency of Use

Accelerators — unseen by the novice user — may often speed up the interaction for the expert user such that the system can cater to both inexperienced and experienced users.

**What it means:** Provide shortcuts, customization, and power-user features without burdening beginners.

**Application examples:**
- Keyboard shortcuts (Cmd+K command palette, Cmd+S save)
- Bulk actions for power users alongside single-item flows
- Customizable dashboards and saved filters
- "Skip tutorial" alongside guided onboarding
- Recent/favorites for frequent destinations
- Macros and templates in productivity tools

**Common violations:**
- No keyboard navigation in data-heavy admin tools
- Forcing experts through the same onboarding every login
- No way to save preferred settings or views
- Single-path workflows for tasks that vary by user expertise

---

### 8. Aesthetic and Minimalist Design

Dialogues should not contain information which is irrelevant or rarely needed. Every extra unit of information competes with the relevant units and diminishes their relative visibility.

**What it means:** Remove clutter. Prioritize content hierarchy. Every element must earn its place.

**Application examples:**
- Progressive disclosure: show advanced settings on demand
- Clean landing pages with single primary CTA
- Collapsible sidebar in complex dashboards
- Empty states with one clear action, not five
- Notification badges only for actionable items

**Common violations:**
- Homepage with 12 competing CTAs
- Settings pages with every option visible at once
- Banner stacking (cookie + promo + maintenance + upgrade)
- Data tables with 30 columns when users need 5

---

### 9. Help Users Recognize, Diagnose, and Recover from Errors

Error messages should be expressed in plain language (no codes), precisely indicate the problem, and constructively suggest a solution.

**What it means:** Errors are teaching moments. Tell users what went wrong, why, and exactly how to fix it.

**Application examples:**
- "Email must include @" not "Invalid input"
- Inline field validation with specific guidance
- Retry button on network failure with explanation
- Link to relevant help article from error state
- Preserve user input after failed submission

**Common violations:**
- Generic "Something went wrong" with no next step
- Red border only, no explanatory text
- Blaming the user ("You entered wrong data")
- Error messages that disappear before user can read them
- Stack traces in production UI

---

### 10. Help and Documentation

Even though it is better if the system can be used without documentation, it may be necessary to provide help. Such information should be easy to search, focused on the user's task, and list concrete steps.

**What it means:** Contextual, searchable, task-oriented help — not manuals nobody reads.

**Application examples:**
- Contextual "?" tooltips next to complex fields
- In-app help panel that doesn't navigate away
- Searchable knowledge base with task-based articles
- Interactive tutorials for first-run experience
- Empty states that explain how to get started

**Common violations:**
- PDF manual as only help resource
- Help that describes features, not tasks
- Broken help links
- No help available at point of failure

---

## Shneiderman's 8 Golden Rules of Interface Design

Source: Ben Shneiderman, *Designing the User Interface* (multiple editions).

### 1. Strive for Consistency
Consistent sequences of actions, terminology, layout, color, typography, and help. Applies across products in a suite and with platform conventions.

### 2. Enable Frequent Users to Use Shortcuts
Abbreviations, function keys, hidden commands, and macro facilities. Experts should accomplish tasks faster than novices.

### 3. Offer Informative Feedback
For every user action, provide meaningful, proportional feedback. Frequent actions deserve subtle feedback; infrequent or high-stakes actions deserve prominent confirmation.

### 4. Design Dialog to Yield Closure
Sequences of actions should be grouped with a beginning, middle, and end. Completion feedback relieves anxiety and prepares users for the next task.

### 5. Offer Simple Error Handling
Design so users cannot make serious errors. If errors occur, make detection and recovery easy. Disable invalid menu items rather than allowing errors.

### 6. Permit Easy Reversal of Actions
Undo supports exploratory learning and reduces anxiety. Reversible actions should be one or two steps to reverse.

### 7. Support Internal Locus of Control
Experienced users want to feel in control. Surprising system actions, lengthy unavoidable processes, and inability to customize undermine confidence.

### 8. Reduce Short-Term Memory Load
Humans can hold roughly 7±2 items in working memory. Recognition, visual displays, and one-action-per-screen reduce cognitive burden.

---

## Gerhardt-Powals' Cognitive Engineering Principles

Source: Jill Gerhardt-Powals, 1996. Focus on reducing cognitive load through automation and information design.

### 1. Automate Unwanted Workload
Automate computations, comparisons, and data transformations the user would otherwise perform mentally.

### 2. Reduce Uncertainty
Display data in a manner that is clear and obvious. Eliminate ambiguity about system state and data meaning.

### 3. Fuse Data
Present information together that is needed together. Don't make users mentally integrate data from separate screens.

### 4. Present New Information with Meaningful Aids to Interpretation
Use familiar frameworks, labels, and comparisons (e.g., "vs last month") to help users interpret new data.

### 5. Use Names That Are Conceptually Related to Function
Command names and labels should map to user mental models and task vocabulary.

### 6. Limit Data-Driven Tasks
Reduce the amount of data users must remember or manipulate to complete a task.

### 7. Include in the Displays Only Information Needed at a Given Time
Progressive disclosure and contextual relevance reduce noise.

### 8. Provide Multiple Coding of Data When Appropriate
Use color, shape, position, and labels redundantly so information is accessible across perceptual channels.

### 9. Practice Judicious Redundancy
Critical information should be conveyed through more than one channel (e.g., icon + text + color for status).

---

## NNG Updates and Guidance (2024–2025)

Nielsen Norman Group continues to refine heuristic application for modern interfaces. Key themes from recent research and articles:

### AI-Augmented Interfaces
- **Transparency heuristic extension:** Users must understand when AI is involved, what it can and cannot do, and how to override or correct AI output.
- **Confidence calibration:** Show uncertainty appropriately; overconfident AI erodes trust faster than acknowledged limitations.
- **Human-in-the-loop:** Always provide edit, reject, and regenerate paths for AI-generated content.

### Mobile-First Heuristic Evaluation
- Touch target size and thumb-zone placement are now baseline expectations, not optional enhancements.
- Gesture discoverability must be taught or signified; hidden gestures fail heuristic #6 (recognition).
- Mobile error recovery must account for smaller screens and interrupted sessions.

### Design Systems and Consistency at Scale
- NNG emphasizes that consistency (#4) now applies across omni-channel experiences (web, mobile, email, support).
- Token-based design systems are the practical implementation of heuristic consistency.

### Accessibility as Baseline Usability
- NNG 2024–2025 guidance treats WCAG AA compliance as a prerequisite for heuristic evaluation, not a separate audit.
- Focus management, screen reader announcements, and keyboard paths are evaluated under heuristics #1, #3, #6, and #9.

### Microinteractions and Feedback Timing
- Feedback must appear within 0.1s for perceived instant response (button press) and within 1s for system status changes.
- Skeleton screens preferred over spinners for content-heavy loads (maintains context per heuristic #1).

### Dark Patterns as Anti-Heuristics
- NNG explicitly documents deceptive patterns as violations of heuristics #3 (user control), #5 (error prevention), and #8 (minimalism).
- Examples: confirmshaming, hidden costs, forced continuity, trick questions in unsubscribe flows.

### Remote and Async Collaboration UX
- System status (#1) must reflect real-time presence, editing conflicts, and sync state in collaborative tools.
- Undo and version history are critical for multi-user editing (heuristics #3 and #5).

---

## Heuristic Evaluation Severity Rating Scale (0–4)

Standard severity scale used in heuristic evaluation sessions (Nielsen, 1994):

| Rating | Label | Description | Action Priority |
|--------|-------|-------------|-----------------|
| **0** | Not a usability problem | Observation noted but not a problem for users | No action needed |
| **1** | Cosmetic | Fix only if extra time available | Low / backlog |
| **2** | Minor | Low priority; causes minor frustration | Schedule fix |
| **3** | Major | High priority; significant impact on usability | Fix before release |
| **4** | Catastrophic | Imperative to fix; may cause task failure, data loss, or legal harm | Block release |

### Severity Factors to Consider
1. **Frequency:** How often do users encounter the problem?
2. **Impact:** How severe is the consequence when encountered?
3. **Persistence:** Is it a one-time annoyance or repeated friction?
4. **Workaround:** Can users accomplish the task despite the problem?

### Combining Multiple Evaluators
When 3–5 evaluators independently rate issues, use the **average severity** or the **maximum severity** depending on organizational risk tolerance. NNG recommends reporting both frequency and severity for prioritization matrices.

---

## Practical Heuristic Evaluation Workflow

1. **Define scope:** Specify user personas, key tasks, and platforms to evaluate.
2. **Select evaluators:** 3–5 people with UX knowledge (not necessarily the designers).
3. **Walk through tasks:** Each evaluator independently completes core user journeys.
4. **Document violations:** Note heuristic violated, location, description, and severity.
5. **Consolidate findings:** Merge duplicate issues; calculate severity consensus.
6. **Prioritize fixes:** Address all Severity 3–4 before release; plan Severity 2 for next sprint.
7. **Re-evaluate:** After fixes, run targeted re-evaluation on changed areas.

---

## Cross-Reference: Heuristic to Common Audit Areas

| Heuristic | Accessibility | Mobile | Conversion |
|-----------|--------------|--------|------------|
| #1 Status | Live regions, loading announcements | Pull-to-refresh feedback | Cart count updates |
| #3 Control | Focus trap escape in modals | Swipe-to-dismiss | Guest checkout option |
| #5 Prevention | Required field indicators | Accidental tap prevention | Address validation |
| #6 Recognition | Visible labels on all inputs | Bottom nav persistence | Product image thumbnails |
| #9 Errors | Accessible error summaries | Touch-friendly error links | Inline checkout errors |

---

## Sources

- Nielsen, J. (1994, revised 2020). *10 Usability Heuristics for User Interface Design*. Nielsen Norman Group. https://www.nngroup.com/articles/ten-usability-heuristics/
- Nielsen, J. (1994). *Severity Ratings for Usability Problems*. Nielsen Norman Group. https://www.nngroup.com/articles/how-to-rate-the-severity-of-usability-problems/
- Shneiderman, B., et al. *Designing the User Interface: Strategies for Effective Human-Computer Interaction*. Pearson. https://www.cs.umd.edu/users/ben/
- Gerhardt-Powals, J. (1996). Cognitive engineering principles for enhancing human-computer performance. *International Journal of Human-Computer Interaction*, 8(2), 189–211.
- Nielsen Norman Group (2024–2025). AI UX, mobile usability, and dark patterns articles. https://www.nngroup.com/articles/
- Nielsen Norman Group. *Heuristic Evaluation: How-To*. https://www.nngroup.com/articles/how-to-conduct-a-heuristic-evaluation/
- ISO 9241-110:2020. Ergonomics of human-system interaction — Dialogue principles. https://www.iso.org/standard/77520.html
