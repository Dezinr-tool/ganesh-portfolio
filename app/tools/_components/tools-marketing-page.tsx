"use client";

import Link from "next/link";
import { ToolsHeroBackground } from "./tools-hero-background";
import { ToolsNav } from "./tools-nav";
import "./tools-marketing.css";

const PLATFORM = [
  {
    id: "01",
    slug: "moodboard",
    href: "/moodboard",
    name: "Moodboard",
    subtitle: "Brand direction before pixels.",
    title: "Moodboard",
    lead: "The direction engine behind every decision.",
    body: "Researches the brand, runs smart intake, and generates contrasting visual directions — then decides what ships in the deck.",
    mock: "anchor" as const,
  },
  {
    id: "02",
    slug: "audit",
    href: "/design-audit",
    name: "Design Audit",
    subtitle: "Structured UX critique at scale.",
    title: "Design Audit",
    lead: "Where your firm's standards live.",
    body: "Write your critique criteria once. Design Audit scores every Figma file, URL, and screenshot against heuristics automatically.",
    mock: "policy" as const,
  },
  {
    id: "03",
    slug: "ia",
    href: "/ia",
    name: "Information Architecture",
    subtitle: "Screen maps and flows before UI.",
    title: "Information Architecture",
    lead: "One link. Start in seconds.",
    body: "Drop a product brief in. Every screen map and flow is validated against your product context before visual design begins.",
    mock: "gateway" as const,
  },
  {
    id: "04",
    slug: "ea",
    href: "/ea/dashboard",
    name: "Virtual EA",
    subtitle: "Client intelligence built in.",
    title: "Virtual EA",
    lead: "Intelligence built into everyday tools.",
    body: "Meeting prep, follow-ups, and client memory enforced across every engagement before delivery.",
    mock: "guard" as const,
  },
  {
    id: "05",
    slug: "command",
    href: "/dashboard",
    name: "Command",
    subtitle: "Live oversight and controls.",
    title: "Command",
    lead: "The control center for client work.",
    body: "See everything across your engagements. What shipped, what is in progress, and what needs attention — all in one place.",
    mock: "command" as const,
  },
] as const;

const FLOW_SURFACES = [
  "Moodboard",
  "Design Audit",
  "IA Generator",
  "Virtual EA",
  "Brief Upload",
  "Deck Export",
] as const;

const FLOW_OUTPUTS = ["Customers", "Stakeholders", "Design teams", "Engineering", "Clients", "Public decks"] as const;

const INDUSTRIES = [
  {
    id: "01",
    title: "Brand & identity studios",
    body: "Move from ambiguous briefs to three visual territories before any logo or UI work begins.",
    sub: "For identity designers, brand strategists, and creative directors.",
    href: "/moodboard",
  },
  {
    id: "02",
    title: "Product design teams",
    body: "Audit live products and map IA before visual design — catch structural issues early.",
    sub: "For in-house designers, PMs, and design systems teams.",
    href: "/design-audit",
  },
  {
    id: "03",
    title: "Consultancies & agencies",
    body: "Standardize discovery output across designers with the same intake quality and deck structure.",
    sub: "For agencies shipping client work at scale.",
    href: "/ia",
  },
] as const;

const TEAMS = [
  { id: "01", title: "Design leads", sub: "For heads of design.", body: "Lock visual direction and UX standards before handoff to production.", href: "/moodboard" },
  { id: "02", title: "UX researchers", sub: "For research and critique.", body: "Turn heuristic reviews into scored, shareable reports in minutes.", href: "/design-audit" },
  { id: "03", title: "Founders & PMs", sub: "For product leadership.", body: "See product structure and flow gaps before expensive design sprints.", href: "/ia" },
  { id: "04", title: "Operations", sub: "For client ops teams.", body: "Invoices, agreements, and records alongside your design tools.", href: "/dashboard" },
] as const;

function FeatureMock({ type }: { type: (typeof PLATFORM)[number]["mock"] }) {
  if (type === "anchor") {
    return (
      <div className="zd-mock zd-mock--flow">
        <div className="zd-mock-card">
          <p className="zd-mock-eyebrow">✦ Client brief</p>
          <p className="zd-mock-code zd-mock-code--bad">
            Composed {"{"}
            <br />
            <span className="zd-mock-tag">// vague</span>
            <br />
            &quot;Make it feel premium but approachable&quot;
            <br />
            {"}"}
          </p>
        </div>
        <span className="zd-mock-arrow">→</span>
        <div className="zd-mock-card zd-mock-card--brand">
          <p className="zd-mock-eyebrow">
            <span className="zd-mock-dot" /> Moodboard
          </p>
          <p className="zd-mock-code zd-mock-code--good">
            Sent {"{"}
            <br />
            <span className="zd-mock-tag">// Direction 02</span>
            <br />
            Editorial Warmth — palette, type, 8 UI refs
            <br />
            {"}"}
          </p>
        </div>
      </div>
    );
  }

  if (type === "policy") {
    return (
      <div className="zd-mock zd-mock--policy">
        <div className="zd-mock-policy-sheet">
          <p className="zd-mock-policy-brand">Design Audit</p>
          <p className="zd-mock-policy-brand">Your firm&apos;s standards</p>
          <dl className="zd-mock-policy-dl">
            <div><dt>Rule:</dt><dd>Touch targets minimum 44px on mobile</dd></div>
            <div><dt>Type:</dt><dd>Accessibility policy</dd></div>
            <div><dt>Applies to:</dt><dd>All product audits</dd></div>
            <div><dt>When matched:</dt><dd>Flagged</dd></div>
          </dl>
        </div>
      </div>
    );
  }

  if (type === "gateway") {
    return (
      <div className="zd-mock zd-mock--gateway">
        <p className="zd-mock-code-line"><span className="zd-mock-tag">// Before</span></p>
        <p className="zd-mock-code-dim">Manual Pinterest · slides · stakeholder chaos</p>
        <div className="zd-mock-gateway-mid">
          <span className="zd-mock-dot" /> designbyganesh
        </div>
        <p className="zd-mock-code-line"><span className="zd-mock-tag">// After</span></p>
        <p className="zd-mock-code-dim">designbyganesh.com/tools → pick a tool · paste brief</p>
        <p className="zd-mock-note">• Works with Claude, GPT, and Gemini •</p>
      </div>
    );
  }

  if (type === "guard") {
    return (
      <div className="zd-mock zd-mock--guard">
        {[
          { label: "← Research", items: ["Brand URL", "Brief PDF", "Competitors", "Questionnaire"] },
          { label: "← Design tools", items: ["Figma", "Moodboard", "Audit", "IA"] },
          { label: "← Deliverables", items: ["Deck", "PDF", "Markdown", "Wireframes"] },
        ].map((row) => (
          <div key={row.label} className="zd-mock-guard-row">
            <p className="zd-mock-guard-label">{row.label}</p>
            <div className="zd-mock-guard-icons">
              {row.items.map((item) => (
                <span key={item} className="zd-mock-guard-icon" title={item}>
                  {item.slice(0, 1)}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="zd-mock zd-mock--command">
      <p className="zd-mock-command-label">Sessions</p>
      <p className="zd-mock-command-total">AI Sessions Run</p>
      <p className="zd-mock-command-num">1,247</p>
      <div className="zd-mock-command-stats">
        <div><span>Directions ready</span><strong>892</strong></div>
        <div><span>Audits complete</span><strong>234</strong></div>
        <div><span>In progress</span><strong>121</strong></div>
      </div>
      <p className="zd-mock-note">• Every session. every designer. this month. •</p>
      <a href="#platform" className="zd-link">See the Platform</a>
    </div>
  );
}

export function ToolsMarketingPage() {
  return (
    <div className="tools-zd">
      <ToolsNav />

      <a href="/moodboard" className="tools-zd-ticker">
        <span className="tools-zd-ticker-badge">New</span>
        <span className="tools-zd-ticker-text">
          Moodboard — three contrasting brand directions from a single brief
        </span>
        <span className="tools-zd-ticker-arrow">→</span>
      </a>

      <main>
        <section id="overview" className="tools-zd-hero">
          <ToolsHeroBackground />
          <div className="tools-zd-wrap tools-zd-hero-content">
            <button type="button" className="tools-zd-play">
              <span className="tools-zd-play-ring" aria-hidden />
              Play video
            </button>
            <h1 className="tools-zd-h1">The AI toolkit for designers.</h1>
            <div className="tools-zd-hero-btns">
              <a href="mailto:hello@designbyganesh.com?subject=Demo%20request" className="tools-zd-btn-primary">
                Get a Demo
              </a>
              <a href="#platform" className="tools-zd-btn-ghost">
                See the Platform
              </a>
            </div>
            <p className="tools-zd-hero-desc">
              Research brands, define visual direction, audit interfaces, and map product architecture
              — each tool turns messy briefs into client-ready output before expensive design work begins.
            </p>
          </div>
        </section>

        <section className="tools-zd-logos">
          <div className="tools-zd-wrap">
            <h2 className="tools-zd-logos-title">Built for design-led teams worldwide.</h2>
            <ul className="tools-zd-logos-list">
              {["Moodboard", "Design Audit", "IA", "Virtual EA", "Invoices", "Export"].map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="tools-zd-firewall">
          <div className="tools-zd-wrap">
            <div className="tools-zd-firewall-component">
              <div className="tools-zd-firewall-step">
                <div className="tools-zd-firewall-rail" aria-hidden>
                  <div className="tools-zd-firewall-step-num">
                    <span className="tools-zd-firewall-step-text is-active">//01</span>
                  </div>
                  <span className="tools-zd-firewall-rail-dot is-first" />
                  <span className="tools-zd-firewall-rail-line is-short" />
                </div>
                <h2 className="tools-zd-h2 tools-zd-firewall-title">One toolkit.</h2>
              </div>

              <div className="tools-zd-firewall-step">
                <div className="tools-zd-firewall-rail" aria-hidden>
                  <span className="tools-zd-firewall-rail-dot" />
                  <div className="tools-zd-firewall-step-num">
                    <span className="tools-zd-firewall-step-text">//02</span>
                  </div>
                  <span className="tools-zd-firewall-rail-dot" />
                  <span className="tools-zd-firewall-rail-line is-long" />
                  <span className="tools-zd-firewall-rail-dot" />
                </div>
                <div className="tools-zd-firewall-step-inner">
                  <h2 className="tools-zd-h2 tools-zd-firewall-title">Every phase of design.</h2>
                  <div className="tools-zd-firewall-panel is-inputs">
                    <div className="tools-zd-firewall-panel-inner">
                      <div className="tools-zd-firewall-panel-header">
                        <p className="tools-zd-firewall-panel-label">Inputs</p>
                      </div>
                      <div className="tools-zd-firewall-panel-body">
                        <div className="tools-zd-firewall-panel-bar is-top" />
                        <div className="tools-zd-firewall-panel-grid">
                          {FLOW_SURFACES.map((item) => (
                            <div key={item} className="tools-zd-firewall-item">
                              <span className="tools-zd-firewall-item-ai">AI</span>
                              <span className="tools-zd-firewall-item-label">{item}</span>
                            </div>
                          ))}
                        </div>
                        <div className="tools-zd-firewall-panel-bar is-bottom" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="tools-zd-firewall-step">
                <div className="tools-zd-firewall-rail" aria-hidden>
                  <div className="tools-zd-firewall-step-num">
                    <span className="tools-zd-firewall-step-text">//03</span>
                  </div>
                </div>
                <div className="tools-zd-firewall-step-inner">
                  <h2 className="tools-zd-h2 tools-zd-firewall-title">
                    Enforces clarity on every engagement before design execution.
                  </h2>
                  <div className="tools-zd-firewall-panel">
                    <div className="tools-zd-firewall-panel-inner">
                      <div className="tools-zd-firewall-panel-header">
                        <p className="tools-zd-firewall-panel-label">Outputs</p>
                      </div>
                      <div className="tools-zd-firewall-panel-body">
                        <div className="tools-zd-firewall-panel-bar is-top" />
                        <div className="tools-zd-firewall-panel-grid">
                          {FLOW_OUTPUTS.map((item) => (
                            <div key={item} className="tools-zd-firewall-item is-arrow">
                              <span className="tools-zd-firewall-item-arrow">→</span>
                              <span className="tools-zd-firewall-item-label">{item}</span>
                            </div>
                          ))}
                        </div>
                        <div className="tools-zd-firewall-panel-bar is-bottom" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="tools-zd-strip-section">
          <div className="tools-zd-strip">
            {PLATFORM.map((p) => (
              <a key={p.slug} href={`#${p.slug}`} className="tools-zd-strip-link">
                <span className="zd-num">//{p.id}</span>
                <span className="tools-zd-strip-name">{p.name}</span>
                <span className="tools-zd-strip-sub">{p.subtitle}</span>
              </a>
            ))}
          </div>
        </section>

        <section id="platform" className="tools-zd-features">
          {PLATFORM.map((p, i) => (
            <article
              key={p.slug}
              id={p.slug}
              className={`tools-zd-feature ${i % 2 === 1 ? "tools-zd-feature--flip" : ""}`}
            >
              <div className="tools-zd-wrap tools-zd-feature-grid">
                <div className="tools-zd-feature-copy">
                  <p className="zd-num">//{p.id}</p>
                  <h2 className="tools-zd-h2 tools-zd-h2--feature">{p.title}</h2>
                  <p className="tools-zd-feature-lead">{p.lead}</p>
                  <p className="tools-zd-body">{p.body}</p>
                  <Link href={p.href} className="zd-link">
                    Learn more
                  </Link>
                </div>
                <div className="tools-zd-feature-visual">
                  <FeatureMock type={p.mock} />
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="tools-zd-intro">
          <div className="tools-zd-wrap">
            <h2 className="tools-zd-h2 tools-zd-h2--intro">Introducing Moodboard.</h2>
            <p className="tools-zd-body tools-zd-intro-p">
              The direction engine behind the toolkit. Moodboard researches your brand, asks only what
              is missing, and generates contrasting visual territories in real time.
            </p>
            <div className="tools-zd-pillars">
              {[
                ["01", "Deterministic where it matters.", "Smart intake skips questions already answered in your brief."],
                ["02", "Every direction is explainable.", "Shows the research, rationale, and references behind each territory."],
                ["03", "Weak directions never slip through.", "Quality gate retries generic output before delivery."],
                ["04", "Tuned to your brand.", "Adapts to your industry, audience, and project type."],
              ].map(([num, title, body]) => (
                <div key={num} className="tools-zd-pillar">
                  <p className="zd-num">//{num}</p>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              ))}
            </div>
            <div className="tools-zd-spec">
              <h4 className="tools-zd-spec-title">Moodboard Specifications</h4>
              <div className="tools-zd-spec-cols">
                <div>
                  <p className="tools-zd-spec-head">Architecture</p>
                  <dl>
                    <div><dt>Model</dt><dd>Claude Sonnet 4.6</dd></div>
                    <div><dt>Design</dt><dd>Research + intake + generation pipeline</dd></div>
                    <div><dt>Decisions</dt><dd>Research · Intake · Generate · Export</dd></div>
                  </dl>
                </div>
                <div>
                  <p className="tools-zd-spec-head">Coverage and Trust</p>
                  <dl>
                    <div><dt>Coverage</dt><dd>Brand, UX, IA, and client deliverables</dd></div>
                    <div><dt>Explainability</dt><dd>Every direction cites research sources</dd></div>
                    <div><dt>Export</dt><dd>Interactive deck · PDF</dd></div>
                  </dl>
                </div>
              </div>
            </div>
            <Link href="/moodboard" className="zd-link tools-zd-intro-link">
              Read about Moodboard
            </Link>
          </div>
        </section>

        <section id="solutions" className="tools-zd-industries">
          <div className="tools-zd-industries-glow" aria-hidden />
          <div className="tools-zd-wrap">
            <h2 className="tools-zd-h2">Built for the teams clients trust most.</h2>
            <p className="tools-zd-body tools-zd-industries-sub">
              Deep coverage for the workflows that govern brand direction, UX quality, and product clarity.
            </p>
            <div className="tools-zd-cards-3">
              {INDUSTRIES.map((item) => (
                <article key={item.id} className="tools-zd-card">
                  <p className="zd-num">//{item.id}</p>
                  <h3>{item.title}</h3>
                  <p className="tools-zd-card-body">{item.body}</p>
                  <p className="tools-zd-card-sub">{item.sub}</p>
                  <Link href={item.href} className="zd-link">Read more</Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="teams" className="tools-zd-teams">
          <div className="tools-zd-teams-bg" aria-hidden />
          <div className="tools-zd-wrap">
            <div className="tools-zd-teams-bento">
              <div className="tools-zd-teams-cell is-corner" aria-hidden />
              <div className="tools-zd-teams-cell is-heading">
                <h2 className="tools-zd-h2">Built for the teams that ship design.</h2>
              </div>
              {TEAMS.slice(0, 2).map((item) => (
                <article key={item.id} className="tools-zd-teams-cell is-card">
                  <p className="zd-num">//{item.id}</p>
                  <h3>{item.title}</h3>
                  <p className="tools-zd-card-sub">{item.sub}</p>
                  <p className="tools-zd-card-body">{item.body}</p>
                  <Link href={item.href} className="zd-link">Read more</Link>
                </article>
              ))}
              <div className="tools-zd-teams-cell is-corner-right" aria-hidden />
              <div className="tools-zd-teams-cell is-corner-bottom" aria-hidden />
              <div className="tools-zd-teams-cell is-lead">
                <p>One platform. One workflow. Every engagement from brief to deliverable.</p>
              </div>
              {TEAMS.slice(2).map((item) => (
                <article key={item.id} className="tools-zd-teams-cell is-card is-bottom">
                  <p className="zd-num">//{item.id}</p>
                  <h3>{item.title}</h3>
                  <p className="tools-zd-card-sub">{item.sub}</p>
                  <p className="tools-zd-card-body">{item.body}</p>
                  <Link href={item.href} className="zd-link">Read more</Link>
                </article>
              ))}
              <div className="tools-zd-teams-cell is-corner-bottom-right" aria-hidden />
            </div>
          </div>
        </section>

        <section id="code" className="tools-zd-code">
          <div className="tools-zd-wrap">
            <h2 className="tools-zd-h2">One link. Start in seconds.</h2>
            <p className="tools-zd-body">
              Add AI-powered design workflows without rebuilding your stack.
            </p>
            <div className="tools-zd-code-box">
              <p><span className="zd-num">// Before</span></p>
              <p className="tools-zd-code-dim">Manual Pinterest · slides · stakeholder chaos</p>
              <p><span className="zd-num">// After</span></p>
              <p className="tools-zd-code-dim">designbyganesh.com/tools</p>
            </div>
            <p className="tools-zd-code-foot">Works with Claude, GPT, and Gemini models.</p>
            <a href="mailto:hello@designbyganesh.com" className="zd-link">
              Talk to an Engineer
            </a>
          </div>
        </section>

        <section className="tools-zd-enterprise">
          <div className="tools-zd-wrap">
            <h2 className="tools-zd-h2">Built for serious client work.</h2>
            <p className="tools-zd-body">
              Password protection, session persistence, and export controls for design-led organizations.
            </p>
            <ul className="tools-zd-badges">
              {["Password-protected", "Session persistence", "Export-ready", "Multi-model"].map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <p className="tools-zd-enterprise-note">
              Per-session isolation with local and server persistence.
            </p>
            <Link href="/dashboard" className="zd-link">
              Visit the Dashboard
            </Link>
          </div>
        </section>

        <section className="tools-zd-cta">
          <div className="tools-zd-wrap tools-zd-cta-inner">
            <h2 className="tools-zd-h2">Ready to ship design with clarity enforced?</h2>
            <p className="tools-zd-body">
              See how the toolkit researches brands, audits interfaces, and maps architecture before
              expensive design work begins.
            </p>
            <div className="tools-zd-hero-btns">
              <a href="mailto:hello@designbyganesh.com?subject=Demo%20request" className="tools-zd-btn-primary">
                Get a Demo
              </a>
              <a href="mailto:hello@designbyganesh.com?subject=Sales" className="tools-zd-btn-ghost">
                Talk to Sales
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="tools-zd-footer">
        <div className="tools-zd-wrap">
          <p className="tools-zd-footer-label">FOOTER</p>
          <p className="tools-zd-footer-wordmark">The AI toolkit for designers.</p>
          <div className="tools-zd-footer-cols">
            <div>
              <p className="zd-num">//01 Platform</p>
              <ul>
                {PLATFORM.map((p) => (
                  <li key={p.slug}><Link href={p.href}>{p.name}</Link></li>
                ))}
                <li><Link href="/voice-notes">Voice Notes</Link></li>
              </ul>
            </div>
            <div>
              <p className="zd-num">//02 Solutions</p>
              <ul>
                <li><Link href="/moodboard">Brand direction</Link></li>
                <li><Link href="/design-audit">UX critique</Link></li>
                <li><Link href="/ia">Product clarity</Link></li>
              </ul>
            </div>
            <div>
              <p className="zd-num">//03 Company</p>
              <ul>
                <li><Link href="/">Portfolio</Link></li>
                <li><a href="mailto:hello@designbyganesh.com">Contact</a></li>
              </ul>
            </div>
            <div>
              <p className="zd-num">//04 Connect</p>
              <ul>
                <li><a href="mailto:hello@designbyganesh.com">hello@designbyganesh.com</a></li>
              </ul>
            </div>
          </div>
          <ul className="tools-zd-footer-badges">
            <li>Password-protected</li>
            <li>Session persistence</li>
            <li>Export-ready</li>
          </ul>
          <div className="tools-zd-footer-end">
            <span className="tools-zd-logo">designbyganesh</span>
            <p>© {new Date().getFullYear()} Ganesh Das. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
