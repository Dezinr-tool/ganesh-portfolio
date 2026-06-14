import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { DesignAuditResult } from "@/lib/design-audit/types";
import {
  ALL_DIMENSION_KEYS,
  DIMENSION_LABELS,
} from "@/lib/design-audit/types";

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10, color: "#111" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 8 },
  score: { fontSize: 16, marginBottom: 12 },
  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  bullet: { marginLeft: 8, marginBottom: 2 },
});

export function DesignAuditPdf({
  result,
  product,
}: {
  result: DesignAuditResult;
  product?: string;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Design Audit Report</Text>
        {product ? <Text style={{ marginBottom: 8 }}>Product: {product}</Text> : null}
        <Text style={styles.score}>Overall: {result.overall_score}/10</Text>
        <Text style={{ marginBottom: 16 }}>{result.summary}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Critical issues</Text>
          {result.priority_issues.critical.map((item) => (
            <Text key={item} style={styles.bullet}>
              • {item}
            </Text>
          ))}
        </View>

        {ALL_DIMENSION_KEYS.map((key) => {
          const dim = result.dimensions[key];
          return (
            <View key={key} style={styles.section} wrap={false}>
              <Text style={styles.sectionTitle}>
                {DIMENSION_LABELS[key]} — {dim.score}/10 ({dim.status})
              </Text>
              {dim.issues.slice(0, 3).map((issue) => (
                <Text key={issue} style={styles.bullet}>
                  Issue: {issue}
                </Text>
              ))}
              {dim.fixes.slice(0, 2).map((fix) => (
                <Text key={fix} style={styles.bullet}>
                  Fix: {fix}
                </Text>
              ))}
            </View>
          );
        })}
      </Page>
    </Document>
  );
}
