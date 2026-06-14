import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { Invoice } from "@/app/dashboard/_lib/invoices";

export type InvoicePdfBilling = {
  upiId: string;
  bankAccountHolder: string;
  bankName: string;
  bankAccountNumber: string;
  bankIfsc: string;
  panNumber: string;
};

const DEFAULT_BILLING: InvoicePdfBilling = {
  upiId: "7304492888@ptaxis",
  bankAccountHolder: "Ganesh Das",
  bankName: "State Bank Of India",
  bankAccountNumber: "39643511245",
  bankIfsc: "SBIN0014915",
  panNumber: "BIKPD1450N",
};

const SENDER_ADDRESS =
  "3101, Venus, Forest Enclave, Hiranandani Fortune City, Panvel";

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#000000",
    backgroundColor: "#FFFFFF",
    lineHeight: 1.45,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  headerLeft: {
    maxWidth: "55%",
  },
  senderName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
  },
  senderAddress: {
    fontSize: 10,
    color: "#111111",
  },
  headerRight: {
    alignItems: "flex-end",
    maxWidth: "40%",
  },
  invoiceTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
  },
  headerMeta: {
    fontSize: 10,
    marginBottom: 3,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  clientName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },
  clientLine: {
    fontSize: 10,
    marginBottom: 2,
  },
  clientSection: {
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    paddingBottom: 6,
    marginBottom: 2,
  },
  tableHeaderCell: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#cccccc",
    paddingVertical: 8,
  },
  descriptionCol: {
    width: "75%",
    paddingRight: 12,
  },
  costCol: {
    width: "25%",
    textAlign: "right",
  },
  totalsSection: {
    marginTop: 20,
    marginBottom: 24,
  },
  totalLine: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
  },
  amountWords: {
    fontSize: 10,
    lineHeight: 1.5,
  },
  paymentSection: {
    marginBottom: 28,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#000000",
  },
  paymentTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
  },
  paymentLine: {
    fontSize: 10,
    marginBottom: 3,
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "#cccccc",
    paddingTop: 12,
  },
  footerLeft: {
    fontSize: 8,
    color: "#333333",
    maxWidth: "70%",
  },
  signature: {
    fontSize: 12,
    fontFamily: "Helvetica-Oblique",
  },
});

function formatPdfDate(date: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function formatPdfAmount(amount: number): string {
  return amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const ones = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const tens = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function twoDigitWords(n: number): string {
  if (n === 0) return "";
  if (n < 20) return ones[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return o === 0 ? tens[t] : `${tens[t]} ${ones[o]}`;
}

function threeDigitWords(n: number): string {
  if (n === 0) return "";
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const hundred = h > 0 ? `${ones[h]} Hundred` : "";
  const remainder = rest > 0 ? twoDigitWords(rest) : "";
  if (hundred && remainder) return `${hundred} ${remainder}`;
  return hundred || remainder;
}

function convertToIndianWords(n: number): string {
  if (n === 0) return "Zero";

  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const hundred = n % 1000;

  const parts: string[] = [];
  if (crore > 0) parts.push(`${convertToIndianWords(crore)} Crore`);
  if (lakh > 0) parts.push(`${threeDigitWords(lakh)} Lakh`);
  if (thousand > 0) parts.push(`${threeDigitWords(thousand)} Thousand`);
  if (hundred > 0) parts.push(threeDigitWords(hundred));

  return parts.join(" ").replace(/\s+/g, " ").trim();
}

export function amountInWords(total: number): string {
  const rupees = Math.floor(total);
  const paise = Math.round((total - rupees) * 100);

  let words = `${convertToIndianWords(rupees)} Rupees`;
  if (paise > 0) {
    words += ` and ${convertToIndianWords(paise)} Paise`;
  }

  return `${words} Only`;
}

type InvoicePdfProps = {
  invoice: Invoice;
  billing?: InvoicePdfBilling;
  qrDataUrl?: string;
};

export function InvoicePdf({
  invoice,
  billing = DEFAULT_BILLING,
  qrDataUrl,
}: InvoicePdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.senderName}>Ganesh Das</Text>
            <Text style={styles.senderAddress}>{SENDER_ADDRESS}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.invoiceTitle}>Invoice</Text>
            <Text style={styles.headerMeta}>
              INVOICE NO: {invoice.invoiceNumber}
            </Text>
            <Text style={styles.headerMeta}>
              Date: {formatPdfDate(invoice.issueDate)}
            </Text>
          </View>
        </View>

        <View style={styles.clientSection}>
          <Text style={styles.sectionLabel}>CLIENT:</Text>
          <Text style={styles.clientName}>{invoice.clientName}</Text>
          {invoice.clientCompany ? (
            <Text style={styles.clientLine}>{invoice.clientCompany}</Text>
          ) : null}
          {invoice.clientAddress ? (
            <Text style={styles.clientLine}>{invoice.clientAddress}</Text>
          ) : null}
        </View>

        <View>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.descriptionCol]}>
              Description
            </Text>
            <Text style={[styles.tableHeaderCell, styles.costCol]}>Cost</Text>
          </View>

          {invoice.lineItems.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.descriptionCol}>{item.description}</Text>
              <Text style={styles.costCol}>
                ₹{formatPdfAmount(item.amount)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsSection}>
          <Text style={styles.totalLine}>
            Total Estimated Cost: ₹{formatPdfAmount(invoice.total)}
          </Text>
          <Text style={styles.amountWords}>
            Amount Chargeable (In Words): {amountInWords(invoice.total)}
          </Text>
        </View>

        <View style={styles.paymentSection}>
          <Text style={styles.paymentTitle}>Payment Details</Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.paymentLine}>
                Account Holder: {billing.bankAccountHolder}
              </Text>
              <Text style={styles.paymentLine}>Bank Name: {billing.bankName}</Text>
              <Text style={styles.paymentLine}>
                Account Number: {billing.bankAccountNumber}
              </Text>
              <Text style={styles.paymentLine}>IFSC Code: {billing.bankIfsc}</Text>
              <Text style={styles.paymentLine}>UPI: {billing.upiId}</Text>
            </View>
            {qrDataUrl ? (
              <View style={{ alignItems: "center", marginLeft: 16 }}>
                <Image src={qrDataUrl} style={{ width: 80, height: 80 }} />
                <Text
                  style={{
                    fontSize: 8,
                    textAlign: "center",
                    marginTop: 4,
                    color: "#333333",
                  }}
                >
                  Scan to Pay
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerLeft}>
            PAN: {billing.panNumber} | +91 7304492888 | ganeshdesigncraft@gmail.com
          </Text>
          <Text style={styles.signature}>{billing.bankAccountHolder}</Text>
        </View>
      </Page>
    </Document>
  );
}
