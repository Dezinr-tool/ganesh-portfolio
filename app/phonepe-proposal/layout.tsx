import type { Metadata } from "next";
import "./phonepe-proposal.css";

export const metadata: Metadata = {
  title: "PhonePe — Brand Governance Capabilities | Brucira",
  description:
    "Confidential capabilities response: brand governance and consistency at scale for PhonePe.",
  robots: { index: false, follow: false },
  icons: {
    icon: [{ url: "/phonepe-proposal/brucira-favicon.ico", sizes: "48x48" }],
    shortcut: "/phonepe-proposal/brucira-favicon.ico",
    apple: "/phonepe-proposal/brucira-apple-touch-icon.png",
  },
};

export default function PhonePeProposalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
