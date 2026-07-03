import Link from "next/link";
import { BRUCIRA_LEGAL_NAME } from "./constants";
import { ProposalCoverHero } from "./proposal-cover-hero";
import { PHONEPE_MD_DOWNLOAD, PHONEPE_PDF_DOWNLOAD, PHONEPE_PROPOSAL_SECTIONS } from "./sections";

export function ProposalCover() {
  return <ProposalCoverHero />;
}

type ProposalTopbarProps = {
  onPrint: () => void;
};

export function ProposalTopbar({ onPrint }: ProposalTopbarProps) {
  return (
    <div className="phonepe-proposal-topbar">
      <span className="phonepe-proposal-topbar-brand">Brucira × PhonePe</span>
      <div className="phonepe-proposal-topbar-actions">
        <Link href="/" className="phonepe-proposal-btn">
          Exit
        </Link>
        <a href={PHONEPE_PDF_DOWNLOAD} download className="phonepe-proposal-btn phonepe-proposal-btn--accent">
          Download PDF
        </a>
        <a href={PHONEPE_MD_DOWNLOAD} download className="phonepe-proposal-btn">
          Download MD
        </a>
        <button type="button" className="phonepe-proposal-btn" onClick={onPrint}>
          Print / PDF
        </button>
      </div>
    </div>
  );
}

export function ProposalSidebar() {
  return (
    <aside className="phonepe-proposal-sidebar" aria-label="Document sections">
      <p className="phonepe-proposal-sidebar-label">Contents</p>
      <nav>
        <ul className="phonepe-proposal-nav">
          {PHONEPE_PROPOSAL_SECTIONS.map((section) => (
            <li key={section.id}>
              <a href={`#${section.id}`} data-section={section.id}>
                <span className="phonepe-proposal-nav-num">{section.num}</span>{" "}
                {section.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export function ProposalFooter() {
  return (
    <footer className="phonepe-proposal-footer">
      <span>{BRUCIRA_LEGAL_NAME} · Confidential · July 2026</span>
      <a href={PHONEPE_MD_DOWNLOAD} download className="phonepe-proposal-btn">
        Download source
      </a>
    </footer>
  );
}
