import fs from "fs";
import path from "path";
import { ProposalDocument } from "@/components/phonepe-proposal/proposal-document";

function loadProposalMarkdown(): string {
  const filePath = path.join(
    process.cwd(),
    "docs/phonepe-brand-consistency-capabilities-response.md",
  );
  const raw = fs.readFileSync(filePath, "utf-8");
  const start = raw.indexOf("## 1. Executive Summary");
  if (start === -1) return raw;
  return raw.slice(start);
}

export default function PhonePeProposalPage() {
  const markdown = loadProposalMarkdown();

  return <ProposalDocument markdown={markdown} />;
}
