import { BRUCIRA_LEGAL_NAME, PHONEPE_TEAM } from "./constants";

export function ProposalCoverHero() {
  return (
    <header className="phonepe-proposal-cover">
      <div className="phonepe-proposal-cover-grid" aria-hidden />

      <div className="phonepe-proposal-cover-inner">
        <div className="phonepe-proposal-cover-copy">
          <p className="phonepe-proposal-cover-confidential">Confidential · July 2026</p>
          <p className="phonepe-proposal-cover-eyebrow">Brucira · Global Design & Engineering</p>
          <h1 className="phonepe-proposal-cover-title">
            Brand Governance &amp; Consistency at Scale
          </h1>
          <p className="phonepe-proposal-cover-subtitle">
            A partner-led approach to keeping one brand coherent across every product surface,
            campaign, and offline touchpoint — design system and guidelines at scale, with optional
            coded implementation if PhonePe chooses Brucira for development.
          </p>

          <p className="phonepe-proposal-cover-team-note">
            Core team: {PHONEPE_TEAM.designFte} design FTE · {PHONEPE_TEAM.engagementMonths} ·{" "}
            Developers ({PHONEPE_TEAM.developersFte} FTE) optional add-on (Section{" "}
            {PHONEPE_TEAM.developersSection})
          </p>

          <div className="phonepe-proposal-cover-meta">
            <div className="phonepe-proposal-cover-meta-item">
              <p className="phonepe-proposal-cover-meta-label">Prepared for</p>
              <p className="phonepe-proposal-cover-meta-value phonepe-proposal-cover-meta-value--brand">
                PhonePe
              </p>
            </div>
            <div className="phonepe-proposal-cover-meta-item">
              <p className="phonepe-proposal-cover-meta-label">Prepared by</p>
              <p className="phonepe-proposal-cover-meta-value">{BRUCIRA_LEGAL_NAME}</p>
            </div>
          </div>

          <p className="phonepe-proposal-cover-clients">
            Trusted by
            <span>·</span> Pine Labs
            <span>·</span> BharatPe
            <span>·</span> Verbaflo
            <span>·</span> Zepto
            <span>·</span> Bigbasket
            <span>·</span> Cashfree
            <span>·</span> Swiggy Sense
          </p>

          <p className="phonepe-proposal-cover-cta">
            <a
              href="#1-executive-summary"
              className="phonepe-proposal-btn phonepe-proposal-btn--phonepe"
            >
              Read document
            </a>
          </p>
        </div>
      </div>
    </header>
  );
}
