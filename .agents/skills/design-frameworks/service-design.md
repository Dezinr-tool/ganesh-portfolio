# Service Design

## Overview

Service Design is the practice of planning and organizing people, infrastructure, communication, and material components of a service to improve its quality and the interaction between service provider and customers. It treats the entire service experience—not just digital touchpoints—as the design canvas.

Coined and formalized through work at Köln International School of Design and organizations like Service Design Network, the discipline bridges UX, operations, business strategy, and organizational change. A service designer asks: "What happens before, during, and after the user interacts with our app?"

## Core Concepts

### Service vs Product

| Product | Service |
|---------|---------|
| Tangible, owned | Intangible, experienced |
| Uniform quality | Variable (depends on people, context) |
| User interacts with object | User interacts with system over time |
| Design focus: interface | Design focus: end-to-end journey |

Most modern offerings are **service-product hybrids** (e.g., Uber = app + drivers + payments + support). Service design ensures the hybrid coheres.

### Touchpoints

A touchpoint is any moment of interaction between the user and the service:

- **Digital:** Website, app, email, chatbot, push notification
- **Physical:** Store, packaging, printed receipt, signage
- **Human:** Phone call, in-person meeting, support agent
- **Environmental:** Waiting room, vehicle interior, event space

Touchpoints are not isolated—they form chains. A failure at one (confusing email) cascades to others (support call volume spike).

### Frontstage vs Backstage

| Layer | Visible to Customer | Examples |
|-------|---------------------|----------|
| **Frontstage** | Yes | App UI, staff behavior, physical environment, marketing |
| **Backstage** | No | CRM systems, kitchen operations, training manuals, inventory |
| **Support processes** | No | HR policies, IT infrastructure, vendor contracts |

Service design connects backstage processes to frontstage experience. A slow backstage (manual approval workflow) inevitably degrades frontstage (long wait times).

## Key Artifacts

### Customer Journey Map

A narrative visualization of the user's experience across time, channels, and emotions.

**Components:**
- **Phases:** Pre-service, service entry, core service, exit, post-service
- **Actions:** What the user does at each step
- **Touchpoints:** Channels and interactions
- **Emotions:** Emotional curve (frustration, delight, anxiety)
- **Pain points:** Friction and failure moments
- **Opportunities:** Design intervention areas

**Journey map vs service blueprint:** Journey maps are user-centered (outside-in). Blueprints add internal process detail (inside-out).

### Service Blueprint

A diagram that maps frontstage, backstage, and support processes aligned to customer journey phases.

**Blueprint layers (top to bottom):**

1. **Physical evidence** — What user sees (devices, documents, environment)
2. **Customer actions** — Steps user takes
3. **Line of interaction** — ─── separates customer from company ───
4. **Frontstage actions** — Visible employee actions and digital responses
5. **Line of visibility** — ─── separates frontstage from backstage ───
6. **Backstage actions** — Internal activities invisible to customer
7. **Line of internal interaction** — ─── separates company from partners ───
8. **Support processes** — Systems, third parties, infrastructure enabling service

**Example: Hotel check-in**

| Phase | Customer | Frontstage | Backstage | Support |
|-------|----------|------------|-----------|---------|
| Arrive | Enters lobby | Greeter welcomes | Front desk notified via tablet | PMS system |
| Check in | Provides ID | Staff verifies, assigns room | Housekeeping confirms room ready | Key card encoder |
| Room | Walks to room | Bellhop offers help | Maintenance on standby | Elevator monitoring |

### Ecosystem Map

Shows all actors (users, partners, competitors, regulators) and value exchanges in the service ecosystem. Useful for platform and marketplace services.

### Service Scenario

Story-based walkthrough of a future service experience, often with illustrations or video. Communicates vision to stakeholders better than diagrams alone.

## Service Design Process

### 1. Explore (Research)
- Stakeholder interviews across departments (not just customers)
- Shadowing staff and customers (contextual inquiry)
- Service safari: experience competitor and analogous services
- Data analysis: support tickets, NPS verbatims, operational metrics

### 2. Model (Synthesis)
- Personas or job-based segments
- Journey maps (current state)
- Service blueprints (current state)
- Pain point prioritization

### 3. Create (Ideation)
- Service staging workshops (cross-functional)
- Future-state journey and blueprint co-design
- Touchpoint redesign and new touchpoint concepts
- Business model implications

### 4. Implement (Delivery)
- Pilot programs in limited contexts
- Staff training and script updates
- Process documentation (SOPs)
- Digital touchpoint build
- Metrics and monitoring

### 5. Iterate (Continuous)
- Post-service surveys and mystery shopping
- Operational KPI review (wait times, error rates, cost per service)
- Blueprint updates as processes change

## Tools

### Research & Synthesis
- **Miro / FigJam** — Journey maps, blueprints, ecosystem maps
- **Dovetail** — Research repository with service tags
- **Excel / Airtable** — Touchpoint inventory and ownership matrix
- **Video ethnography** — Record service encounters (with consent)

### Prototyping
- **Role-play / bodystorming** — Act out service scenarios physically
- **Desktop walkthrough** — Step through service on paper with stakeholders
- **Pilot launch** — Real service in limited geography or segment
- **Figma** — Digital touchpoint prototypes within journey context

### Implementation
- **Service Blueprint tools:** Smaply, Lucidchart, Miro templates
- **Process documentation:** Confluence, Notion, Process Street
- **Training:** LMS platforms, video SOPs
- **Measurement:** Qualtrics (CSAT), Zendesk (support), operational dashboards

## When to Use Service Design

**Use when:**
- Experience spans multiple channels (digital + physical + human)
- Customer complaints persist despite UI improvements
- Launching or redesigning a service business (healthcare, hospitality, banking)
- Organizational silos cause inconsistent customer experience
- Operational costs are high due to process inefficiency
- New regulation requires end-to-end process change

**Avoid when:**
- Pure digital product with no human/physical component
- Problem is isolated UI usability (use UX research methods instead)
- No access to backstage stakeholders (can't map what you can't see)
- Organization unwilling to change processes (designing frontstage alone is theater)

## Common Mistakes

1. **Journey map without blueprint** — Identifying pain points but not addressing root cause in backstage processes.

2. **Designing frontstage only** — Beautiful app atop broken operations creates worse frustration (用户 sees modern UI, still waits 5 days).

3. **Ignoring employee experience** — Frontstage staff burnout degrades service. Service design includes internal touchpoints.

4. **Static artifacts** — Blueprints created once, never updated as business changes.

5. **No ownership** — Journey map recommends 20 improvements; no department owns implementation.

6. **Over-complex blueprints** — 50-step blueprint nobody reads. Start with critical path (happy path + top failure).

7. **Missing measurement** — No baseline metrics before redesign; impossible to prove impact.

## Facilitation Tips

- **Include backstage staff in workshops** — Call center agents know pain points executives miss.
- **Map current state before future state** — Shared reality before shared ambition.
- **Use color coding** — Pain (red), opportunity (green), new touchpoint (blue).
- **Timebox phases** — One workshop per journey phase if map is large.
- **Assign touchpoint owners** — Every touchpoint has a name and department on the final blueprint.

## Case Study: NHS Patient/page)

The UK National Health Service applied service design to reduce missed appointments. Journey mapping revealed the problem wasn't reminder quantity—it was **pre-appointment anxiety** about location, parking, and preparation.

Blueprint analysis showed backstage gap: GP systems didn't sync with patient communication preferences. Frontstage fix (personalized SMS with map and checklist) required backstage change (CRM integration with appointment system).

Pilot reduced no-shows 18% and support calls 32%. Service design connected a digital touchpoint change to operational data and organizational process update.

## Case Study: Airbnb Host Onboarding

Airbnb used service blueprinting for host onboarding spanning:
- **Customer actions:** Sign up, list property, set pricing, receive first booking
- **Frontstage:** App screens, welcome emails, community forum
- **Backstage:** Identity verification, photo review, pricing algorithm
- **Support:** Help center, superhost mentorship program

Blueprint revealed photo review backlog (backstage) caused 3-day listing delay (frontstage pain). Solution: AI-assisted photo quality check + human review only for flagged listings. Time-to-first-booking dropped 40%.

## Templates

### Touchpoint Inventory

```markdown
| Touchpoint | Channel | Phase | Owner (Dept) | Current CSAT | Pain Level | Priority |
|------------|---------|-------|--------------|--------------|------------|----------|
```

### Service Blueprint (Markdown)

```markdown
# Service Blueprint: [Service Name]
**Version:** 
**Last updated:** 

## Phase: [Phase Name]

### Physical Evidence
- 

### Customer Actions
1. 

### Frontstage Actions
- 

### Backstage Actions
- 

### Support Processes
- 

### Pain Points
- 

### Opportunities
- 
```

### Journey Map Emotional Curve

```markdown
Phase:     Awareness → Consider → Purchase → Use → Advocate
Emotion:   Curious    Anxious     Relieved   Frustrated → Delighted
Touchpoint: Ad       Website     Checkout   App    Referral email
Score (1-5):  3        2           4         2         5
```

## Sources

- Service Design Network — What is Service Design: https://www.service-design-network.org/about/service-design
- Nielsen Norman Group — Service Blueprints: https://www.nngroup.com/articles/service-blueprints-definition/
- Nielsen Norman Group — Journey Mapping 101: https://www.nngroup.com/articles/journey-mapping-101/
- This Is Service Design Doing (book): https://www.thisisservicedesigndoing.com/
- UK Government — Service Manual: https://www.gov.uk/service-manual
- Smaply — Service Blueprint Guide: https://smaply.com/blog/service-blueprint-templates
- Adaptive Path — Guide to Service Design Mapping: https://www.adaptivepath.com/
