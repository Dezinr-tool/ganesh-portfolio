import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Agreement, AgreementCurrency } from "@/app/dashboard/_lib/agreements";
import {
  CONFIDENTIALITY_TEXT,
  DEEMED_ACCEPTANCE_TEXT,
  formatDate,
  formatDateTime,
  formatClientEmails,
  IP_TRANSFER_TEXT,
  killFeeClauseText,
  latePaymentClauseText,
  LIMITATION_OF_LIABILITY_TEXT,
  MILESTONE_INVOICE_TERMS,
  MILESTONE_PAYMENT_INTRO,
  MILESTONE_PAYMENT_METHOD,
  paymentStructureLabel,
  PORTFOLIO_RIGHTS_TEXT,
  reviewWindowClauseText,
  scopeHasHours,
  terminationNoticeClauseText,
  totalDeliverablesCost,
  totalScopeHours,
} from "@/app/dashboard/_lib/agreements";
import {
  DEFAULT_DESIGN_TOKENS,
  type DesignTokens,
} from "@/lib/design-tokens";

// Helvetica (the PDF font) has no glyph for ₹, €, or £ in some viewers and
// renders them as a garbled character. Currency codes ("INR 1,000.00")
// render safely regardless of font support.
function formatCurrency(amount: number, currency: AgreementCurrency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    currencyDisplay: "code",
    minimumFractionDigits: 2,
  }).format(amount);
}

function outOfScopeClauseText(
  rate: number | null,
  currency: AgreementCurrency = "INR",
): string {
  if (rate != null && rate > 0) {
    const formatted = formatCurrency(rate, currency);
    return `Any work requested beyond the agreed Scope of Work will be treated as a change order, quoted separately, and billed at ${formatted}/hour unless a new fixed fee is agreed in writing`;
  }
  return "Any work requested beyond the agreed Scope of Work will be treated as a change order, quoted separately, and billed at the designer's standard hourly rate unless a new fixed fee is agreed in writing";
}

function createAgreementPdfStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    page: {
      padding: 48,
      fontSize: 9.5,
      fontFamily: "Helvetica",
      color: tokens.text,
      backgroundColor: tokens.bg,
      lineHeight: 1.45,
    },
    title: {
      fontSize: 18,
      fontFamily: "Helvetica-Bold",
      lineHeight: 1.2,
    },
    subtitle: {
      fontSize: 10,
      marginTop: 10,
    },
    meta: {
      fontSize: 8,
      marginTop: 2,
      color: tokens.text,
    },
    headerDivider: {
      borderBottomWidth: 1,
      borderBottomColor: tokens.text,
      paddingBottom: 16,
      marginBottom: 16,
    },
    section: {
      marginTop: 14,
    },
    sectionTitle: {
      fontSize: 9.5,
      fontFamily: "Helvetica-Bold",
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    divider: {
      borderBottomWidth: 1,
      borderBottomColor: tokens.text,
      marginTop: 14,
      opacity: 0.1,
    },
    row: {
      flexDirection: "row",
      marginTop: 10,
    },
    col: {
      flex: 1,
    },
    label: {
      fontSize: 7.5,
      fontFamily: "Helvetica-Bold",
      textTransform: "uppercase",
    },
    value: {
      fontSize: 9.5,
      marginTop: 2,
    },
    bodyText: {
      fontSize: 9.5,
      marginTop: 6,
      lineHeight: 1.5,
    },
    bullet: {
      flexDirection: "row",
      marginTop: 4,
    },
    bulletDot: {
      width: 10,
      fontSize: 9.5,
    },
    bulletText: {
      flex: 1,
      fontSize: 9.5,
      lineHeight: 1.45,
    },
    table: {
      marginTop: 8,
    },
    tableHeaderRow: {
      flexDirection: "row",
      borderBottomWidth: 1.2,
      borderBottomColor: tokens.text,
      paddingBottom: 4,
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 0.5,
      borderBottomColor: tokens.text,
      paddingVertical: 4,
    },
    tableFooterRow: {
      flexDirection: "row",
      borderTopWidth: 1.2,
      borderTopColor: tokens.text,
      paddingTop: 4,
    },
    th: {
      fontSize: 8.5,
      fontFamily: "Helvetica-Bold",
    },
    td: {
      fontSize: 9,
    },
    colTask: { flex: 3 },
    colHours: { flex: 1, textAlign: "right" },
    colPriority: { flex: 1 },
    colDeliverable: { flex: 3 },
    colMilestone: { flex: 2 },
    colAmount: { flex: 1, textAlign: "right" },
    colDueOn: { flex: 1.5 },
    // phased breakdown columns
    colNum: { width: 20 },
    colPhaseDeliverable: { flex: 2 },
    colPhaseTimeline: { flex: 1.2 },
    colPhaseEffort: { flex: 0.8, textAlign: "right" },
    colPhaseCost: { flex: 1, textAlign: "right" },
    colPhaseNotes: { flex: 2.5 },
    phaseHeaderRow: {
      flexDirection: "row",
      backgroundColor: "#B22222",
      paddingVertical: 5,
      paddingHorizontal: 4,
      marginTop: 6,
    },
    phaseHeaderText: {
      fontSize: 8.5,
      fontFamily: "Helvetica-Bold",
      color: "#ffffff",
    },
    phaseTotal: {
      flexDirection: "row",
      borderTopWidth: 1.5,
      borderTopColor: tokens.text,
      paddingTop: 5,
      marginTop: 2,
    },
    phaseTotalText: {
      fontSize: 9.5,
      fontFamily: "Helvetica-Bold",
    },
    breakdownFooter: {
      flexDirection: "row",
      marginTop: 10,
      gap: 24,
    },
    breakdownFooterText: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
    },
    signatureBox: {
      marginTop: 8,
      height: 64,
      borderWidth: 1,
      borderColor: tokens.text,
      justifyContent: "flex-end",
      padding: 6,
    },
    signatureImage: {
      maxHeight: 40,
      objectFit: "contain",
    },
    signaturePlaceholder: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    signaturePlaceholderText: {
      fontSize: 8,
      color: tokens.text,
    },
    signedAt: {
      fontSize: 7.5,
      marginTop: 4,
    },
  });
}

type AgreementPdfProps = {
  agreement: Agreement;
  designTokens?: DesignTokens;
};

export function AgreementPdf({
  agreement,
  designTokens = DEFAULT_DESIGN_TOKENS,
}: AgreementPdfProps) {
  const styles = createAgreementPdfStyles(designTokens);
  const currency = agreement.currency;
  const totalHours = totalScopeHours(agreement.scopeOfWork);
  const showScopeHours = scopeHasHours(agreement.scopeOfWork);
  const hasPhases = (agreement.deliverablePhases?.length ?? 0) > 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerDivider}>
          <Text style={styles.title}>Design Services Agreement</Text>
          <Text style={styles.subtitle}>{agreement.title}</Text>
          <Text style={styles.meta}>{formatDate(agreement.agreementDate)}</Text>
        </View>

        <View>
          <Text style={styles.sectionTitle}>Parties</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Designer</Text>
              <Text style={styles.value}>Ganesh Das</Text>
              <Text style={styles.value}>Design by Ganesh</Text>
              <Text style={styles.value}>hello@designbyganesh.com</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Client</Text>
              <Text style={styles.value}>{agreement.clientName}</Text>
              {agreement.clientCompany ? (
                <Text style={styles.value}>{agreement.clientCompany}</Text>
              ) : null}
              <Text style={styles.value}>
                {formatClientEmails(agreement.clientEmails)}
              </Text>
              {agreement.clientPhone ? (
                <Text style={styles.value}>{agreement.clientPhone}</Text>
              ) : null}
              {agreement.clientAddress ? (
                <Text style={styles.value}>{agreement.clientAddress}</Text>
              ) : null}
              {agreement.clientGstNumber ? (
                <Text style={styles.value}>GST: {agreement.clientGstNumber}</Text>
              ) : null}
              <Text style={styles.value}>
                Representative: {agreement.clientRepresentative}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project Overview</Text>
          <Text style={styles.bodyText}>{agreement.projectOverview}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scope of Work</Text>
          <View style={styles.table}>
            {showScopeHours ? (
              <>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.th, styles.colTask]}>Task</Text>
                  <Text style={[styles.th, styles.colHours]}>
                    Est. Hours (optional)
                  </Text>
                </View>
                {agreement.scopeOfWork.map((item) => (
                  <View key={item.id} style={styles.tableRow}>
                    <Text style={[styles.td, styles.colTask]}>{item.task}</Text>
                    <Text style={[styles.td, styles.colHours]}>
                      {item.hours}
                    </Text>
                  </View>
                ))}
                <View style={styles.tableFooterRow}>
                  <Text style={[styles.th, styles.colTask]}>Total</Text>
                  <Text style={[styles.th, styles.colHours]}>{totalHours}</Text>
                </View>
              </>
            ) : (
              agreement.scopeOfWork.map((item) => (
                <View key={item.id} style={styles.bullet}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{item.task}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deliverables, Timeline &amp; Cost Breakdown</Text>
          {/* Table column headers */}
          <View style={[styles.tableHeaderRow, { marginTop: 8 }]}>
            <Text style={[styles.th, styles.colNum]}>#</Text>
            <Text style={[styles.th, styles.colPhaseDeliverable]}>Deliverables</Text>
            <Text style={[styles.th, styles.colPhaseTimeline]}>Timeline</Text>
            <Text style={[styles.th, styles.colPhaseEffort]}>Hrs</Text>
            <Text style={[styles.th, styles.colPhaseCost]}>Cost</Text>
            <Text style={[styles.th, styles.colPhaseNotes]}>Notes</Text>
          </View>
          {agreement.deliverablePhases?.map((phase) => (
            <View key={phase.id}>
              {/* Phase header row */}
              <View style={styles.phaseHeaderRow}>
                <Text style={[styles.phaseHeaderText, { flex: 1 }]}>
                  {phase.name}
                </Text>
              </View>
              {phase.items.map((item, idx) => (
                <View key={item.id} style={styles.tableRow}>
                  <Text style={[styles.td, styles.colNum]}>{idx + 1}</Text>
                  <Text style={[styles.td, styles.colPhaseDeliverable]}>
                    {item.deliverable}
                  </Text>
                  <Text style={[styles.td, styles.colPhaseTimeline]}>
                    {item.timeline}
                  </Text>
                  <Text style={[styles.td, styles.colPhaseEffort]}>
                    {item.effortHours ?? ""}
                  </Text>
                  <Text style={[styles.td, styles.colPhaseCost]}>
                    {item.cost != null ? formatCurrency(item.cost, currency) : ""}
                  </Text>
                  <Text style={[styles.td, styles.colPhaseNotes]}>
                    {item.notes}
                  </Text>
                </View>
              ))}
            </View>
          ))}
          {/* Footer: total cost + timeline */}
          {agreement.deliverablePhases?.length > 0 ? (
            <View style={styles.breakdownFooter}>
              <Text style={styles.breakdownFooterText}>
                Total Project Cost:{" "}
                {formatCurrency(
                  totalDeliverablesCost(agreement.deliverablePhases),
                  currency,
                )}
              </Text>
              {agreement.totalTimeline ? (
                <Text style={styles.breakdownFooterText}>
                  {"  |  "}Estimated Timeline: {agreement.totalTimeline}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Approval &amp; Acceptance</Text>
          <View style={styles.bullet}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              {reviewWindowClauseText(agreement.reviewWindowDays)}
            </Text>
          </View>
          {agreement.deemedAcceptance ? (
            <View style={styles.bullet}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{DEEMED_ACCEPTANCE_TEXT}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <Text style={styles.bodyText}>{agreement.timeline}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Terms</Text>
          {agreement.paymentStructure === "milestone" &&
          agreement.milestones.length > 0 ? (
            <>
              <Text style={styles.bodyText}>{MILESTONE_PAYMENT_INTRO}</Text>
              <View style={styles.table}>
                {/* Header row */}
                <View style={[styles.phaseHeaderRow, { marginTop: 8 }]}>
                  <Text style={[styles.phaseHeaderText, { flex: 3 }]}>Milestone</Text>
                  <Text style={[styles.phaseHeaderText, { flex: 1, textAlign: "right" }]}>Percentage</Text>
                  <Text style={[styles.phaseHeaderText, { flex: 1.5, textAlign: "right" }]}>Amount ({currency})</Text>
                </View>
                {agreement.milestones.map((item) => (
                  <View key={item.id} style={styles.tableRow}>
                    <Text style={[styles.td, { flex: 3 }]}>{item.name}</Text>
                    <Text style={[styles.td, { flex: 1, textAlign: "right" }]}>{item.percent}%</Text>
                    <Text style={[styles.td, { flex: 1.5, textAlign: "right" }]}>
                      {formatCurrency(item.amount, currency)}
                    </Text>
                  </View>
                ))}
                {/* Total row */}
                <View style={[styles.tableFooterRow]}>
                  <Text style={[styles.th, { flex: 3 }]}>Total Project Cost</Text>
                  <Text style={[styles.th, { flex: 1 }]} />
                  <Text style={[styles.th, { flex: 1.5, textAlign: "right", color: "#B22222" }]}>
                    {formatCurrency(
                      totalDeliverablesCost(agreement.deliverablePhases ?? []) ||
                        agreement.milestones.reduce((s, m) => s + m.amount, 0),
                      currency,
                    )}
                  </Text>
                </View>
              </View>
              <Text style={styles.bodyText}>{MILESTONE_PAYMENT_METHOD}</Text>
            </>
          ) : (
            <>
              <Text style={styles.bodyText}>
                Payment Structure: {paymentStructureLabel(agreement.paymentStructure)}
              </Text>
              {agreement.paymentStructure === "custom" && agreement.customPaymentTerms ? (
                <Text style={styles.bodyText}>{agreement.customPaymentTerms}</Text>
              ) : null}
              {agreement.hourlyRate !== null ? (
                <Text style={styles.bodyText}>
                  Hourly Rate: {formatCurrency(agreement.hourlyRate, currency)}/hr
                </Text>
              ) : null}
              {agreement.fixedCost !== null ? (
                <Text style={styles.bodyText}>
                  Fixed Cost: {formatCurrency(agreement.fixedCost, currency)}
                </Text>
              ) : null}
            </>
          )}
          {agreement.latePaymentClause ? (
            <Text style={styles.bodyText}>
              {latePaymentClauseText(agreement.latePaymentDays, agreement.latePaymentInterest)}
            </Text>
          ) : null}
          {agreement.paymentNotes ? (
            <Text style={styles.bodyText}>{agreement.paymentNotes}</Text>
          ) : null}
        </View>

        <View style={styles.divider} />

        {agreement.paymentStructure === "milestone" ? (
          <View style={styles.section}>
            <Text style={styles.bodyText}>{MILESTONE_INVOICE_TERMS}</Text>
          </View>
        ) : null}

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revision Policy</Text>
          <Text style={styles.bodyText}>
            Revisions included: {agreement.revisionsIncluded}
          </Text>
          {agreement.revisionScopeNote ? (
            <Text style={styles.bodyText}>{agreement.revisionScopeNote}</Text>
          ) : null}
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal Clauses</Text>
          {agreement.ipTransfer ? (
            <View style={styles.bullet}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{IP_TRANSFER_TEXT}</Text>
            </View>
          ) : null}
          {agreement.confidentiality ? (
            <View style={styles.bullet}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{CONFIDENTIALITY_TEXT}</Text>
            </View>
          ) : null}
          {agreement.killFee ? (
            <View style={styles.bullet}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>
                {killFeeClauseText()}
              </Text>
            </View>
          ) : null}
          {agreement.portfolioRights ? (
            <View style={styles.bullet}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{PORTFOLIO_RIGHTS_TEXT}</Text>
            </View>
          ) : null}
          {agreement.outOfScopeClause ? (
            <View style={styles.bullet}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>
                {outOfScopeClauseText(agreement.outOfScopeRate, currency)}
              </Text>
            </View>
          ) : null}
          {agreement.limitationOfLiability ? (
            <View style={styles.bullet}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>
                {LIMITATION_OF_LIABILITY_TEXT}
              </Text>
            </View>
          ) : null}
          <View style={styles.bullet}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              {terminationNoticeClauseText(agreement.terminationNoticeDays)}
            </Text>
          </View>
          <View style={styles.bullet}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              This agreement shall be governed by the laws of{" "}
              {agreement.governingLaw}.
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Signatures</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Client</Text>
              <View style={styles.signatureBox}>
                {agreement.clientSignature ? (
                  // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image has no alt prop
                  <Image
                    src={agreement.clientSignature}
                    style={styles.signatureImage}
                    cache={false}
                  />
                ) : (
                  <View style={styles.signaturePlaceholder}>
                    <Text style={styles.signaturePlaceholderText}>
                      Awaiting signature
                    </Text>
                  </View>
                )}
              </View>
              {agreement.clientSignedAt ? (
                <Text style={styles.signedAt}>
                  Signed {formatDateTime(agreement.clientSignedAt)}
                </Text>
              ) : null}
              <Text style={styles.value}>{agreement.clientRepresentative}</Text>
              <Text style={styles.meta}>{agreement.clientCompany}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Designer</Text>
              <View style={styles.signatureBox}>
                {agreement.ganeshSignature ? (
                  // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image has no alt prop
                  <Image
                    src={agreement.ganeshSignature}
                    style={styles.signatureImage}
                    cache={false}
                  />
                ) : (
                  <View style={styles.signaturePlaceholder}>
                    <Text style={styles.signaturePlaceholderText}>
                      Awaiting signature
                    </Text>
                  </View>
                )}
              </View>
              {agreement.ganeshSignedAt ? (
                <Text style={styles.signedAt}>
                  Signed {formatDateTime(agreement.ganeshSignedAt)}
                </Text>
              ) : null}
              <Text style={styles.value}>Ganesh Das</Text>
              <Text style={styles.meta}>Design by Ganesh</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
