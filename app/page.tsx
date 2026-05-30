import { Hero } from "@/components/sections/Hero";
import { HeroNameLayer } from "@/components/sections/HeroNameLayer";
import { HeroScrollTransition } from "@/components/sections/HeroScrollTransition";
import { Journey } from "@/components/sections/Journey";
import { Tools } from "@/components/sections/Tools";
import { FeaturedWork } from "@/components/sections/FeaturedWork";

export default function Home() {
  return (
    <main
      id="main-content"
      className="relative isolate overflow-x-clip bg-[#0a0a0a] text-[#f0f0f0]"
      tabIndex={-1}
    >
      <HeroNameLayer />
      <HeroScrollTransition>
        <Hero />
      </HeroScrollTransition>
      <FeaturedWork />
      <Tools />
      <Journey />
    </main>
  );
}
