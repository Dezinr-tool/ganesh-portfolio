import { AboutText } from "@/components/sections/AboutText";
import { FeaturedWork } from "@/components/sections/FeaturedWork";
import { Footer } from "@/components/sections/Footer";
import { Hero } from "@/components/sections/Hero";
import { Testimonials } from "@/components/sections/Testimonials";
import { Tools } from "@/components/sections/Tools";
import { ValueScrollSection } from "@/components/sections/ValueScrollSection";
import { OnScreenCounter } from "@/components/ui/OnScreenCounter";
import "@/components/sections/value-scroll.css";
import { getHomepageRenderData } from "@/lib/sanity/homepage";

export default async function Home() {
  const { content, projects, testimonials, headlineLines, badgeLines } =
    await getHomepageRenderData();

  return (
    <main
      id="main-content"
      className="relative isolate overflow-x-clip bg-[var(--color-bg)] text-[var(--color-text)]"
      tabIndex={-1}
    >
      <Hero
        content={{
          headlineLines,
          subtext: content.hero.subtext ?? "",
          badgeLines,
        }}
      />
      <AboutText
        sectionLabel={content.about.sectionLabel ?? ""}
        bodyText={content.about.bodyText ?? ""}
      />
      <ValueScrollSection />
      <OnScreenCounter />
      <FeaturedWork
        projects={projects}
        sectionTitle={content.siteSettings.worksSectionTitle ?? "recent works"}
      />
      <Tools />
      <Testimonials
        heading={
          content.siteSettings.testimonialsHeading ??
          "Trusted by the people I've built with"
        }
        testimonials={testimonials}
      />
      <Footer siteSettings={content.siteSettings} socialLinks={content.socialLinks} />
    </main>
  );
}
