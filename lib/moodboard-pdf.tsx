import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { MoodboardDirection } from "@/lib/moodboard/types";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "var(--color-text)",
  },
  title: {
    fontSize: 22,
    marginBottom: 8,
    fontWeight: "bold",
  },
  eyebrow: {
    fontSize: 9,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "var(--color-text)",
    marginBottom: 16,
  },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "var(--color-text)",
    marginBottom: 6,
  },
  body: { lineHeight: 1.5 },
  swatchRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  swatch: {
    width: 48,
    height: 48,
    borderRadius: 4,
    border: "1 solid var(--color-text)",
  },
  chip: {
    backgroundColor: "var(--color-bg)",
    padding: "4 8",
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
    fontSize: 9,
  },
  chips: { flexDirection: "row", flexWrap: "wrap" },
});

export function MoodboardPdf({
  direction,
  tab,
}: {
  direction: MoodboardDirection;
  tab: string;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>{tab} moodboard direction</Text>
        <Text style={styles.title}>{direction.name}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Concept</Text>
          <Text style={styles.body}>{direction.concept}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Color palette</Text>
          <View style={styles.swatchRow}>
            {direction.colors.map((color) => (
              <View key={color.hex}>
                <View style={[styles.swatch, { backgroundColor: color.hex }]} />
                <Text style={{ fontSize: 8, marginTop: 4 }}>{color.name}</Text>
                <Text style={{ fontSize: 7, color: "var(--color-text)" }}>{color.hex}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Typography</Text>
          <Text style={styles.body}>
            Heading: {direction.typography.heading}
          </Text>
          <Text style={styles.body}>Body: {direction.typography.body}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Imagery</Text>
          <Text style={styles.body}>{direction.imagery}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mood</Text>
          <View style={styles.chips}>
            {direction.mood.map((word) => (
              <Text key={word} style={styles.chip}>
                {word}
              </Text>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visual references</Text>
          <Text style={styles.body}>{direction.visual_references}</Text>
        </View>
      </Page>
    </Document>
  );
}
