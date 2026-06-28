import { AboutText } from "@/components/sections/AboutText";
import { FeaturedWork } from "@/components/sections/FeaturedWork";
import { Footer } from "@/components/sections/Footer";
import { Hero } from "@/components/sections/Hero";
import { Testimonials } from "@/components/sections/Testimonials";
import { Tools } from "@/components/sections/Tools";
import { ValueScrollSection } from "@/components/sections/value-scroll/ValueScrollSection";
import { getHomepageRenderData } from "@/lib/content";

export default function Home() {
  const { content, projects, testimonials, headlineLines, badgeLines } =
    getHomepageRenderData();

  return (
    <main
      id="main-content"
      className="relative isolate overflow-x-clip bg-[var(--color-bg)] text-[var(--color-text)]"
      tabIndex={-1}
    >
      <Hero
        content={{
          headlineLines,
          subtext: content.hero.subtext,
          badgeLines,
        }}
      />
      <AboutText
        sectionLabel={content.about.sectionLabel}
        bodyText={content.about.bodyText}
      />
      <ValueScrollSection />
      <FeaturedWork
        projects={projects}
        sectionTitle={content.siteSettings.worksSectionTitle}
      />
      <Tools />
      <Testimonials
        heading={content.siteSettings.testimonialsHeading}
        testimonials={testimonials}
      />
      <Footer siteSettings={content.siteSettings} socialLinks={content.socialLinks} />
    </main>
  );
}
