import { AboutText } from "@/components/sections/AboutText";
import { FeaturedWork } from "@/components/sections/FeaturedWork";
import { Footer } from "@/components/sections/Footer";
import { Hero } from "@/components/sections/Hero";
import { Testimonials } from "@/components/sections/Testimonials";
import { Tools } from "@/components/sections/Tools";
import { ValueScrollSection } from "@/components/sections/ValueScrollSection";
import "@/components/sections/value-scroll.css";

export default function Home() {
  return (
    <main
      id="main-content"
      className="relative isolate overflow-x-clip bg-[var(--color-bg)] text-[var(--color-text)]"
      tabIndex={-1}
    >
      <Hero />
      <AboutText />
      <ValueScrollSection />
      <FeaturedWork />
      <Tools />
      <Testimonials />
      <Footer />
    </main>
  );
}
