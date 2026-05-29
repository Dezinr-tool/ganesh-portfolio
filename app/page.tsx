import { AboutText } from "@/components/sections/AboutText";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { FeaturedWork } from "@/components/sections/FeaturedWork";
import { Testimonials } from "@/components/sections/Testimonials";
import { Footer } from "@/components/sections/Footer";
import { Hero } from "@/components/sections/Hero";
import { Journey } from "@/components/sections/Journey";
import { Tools } from "@/components/sections/Tools";

export default function Home() {
  return (
    <main className="relative isolate bg-[#FFFFFF] text-[#111111]">
      <Hero />
      <AboutText />
      <Journey />
      <Tools />
      <FeaturedWork />
      <Testimonials />
      <ContactCTA />
      <Footer />
    </main>
  );
}
