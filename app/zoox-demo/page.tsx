import { ZooxHeroExperience } from "@/components/zoox";

export default function ZooxDemoPage() {
  return (
    <main>
      <ZooxHeroExperience />
      <section
        style={{
          minHeight: "50vh",
          padding: "4rem 2.4rem",
          background: "#d3e4df",
        }}
      >
        <p style={{ maxWidth: "45rem", fontSize: "1.6rem", lineHeight: 1.4 }}>
          Scroll continues here after the pinned robotaxi section — matching
          Zoox&apos;s transition into &quot;A better way to ride&quot; content
          blocks.
        </p>
      </section>
    </main>
  );
}
