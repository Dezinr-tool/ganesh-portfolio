import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/** madewithgsap.com h-cards carousel — exact rotation math from app2.js */
export function bindMwgCardsCarousel(options: {
  pinHeight: HTMLElement;
  container: HTMLElement;
  circles: HTMLElement;
  cards: HTMLElement[];
  rotationStep?: number;
  onIndexChange?: (index: number) => void;
}): () => void {
  const {
    pinHeight,
    container,
    circles,
    cards,
    rotationStep = 6.2,
    onIndexChange,
  } = options;

  let activeIndex = -1;

  const trigger = ScrollTrigger.create({
    id: "value-scroll-cards-pin",
    trigger: pinHeight,
    start: "top top",
    end: "bottom bottom",
    pin: container,
    scrub: true,
    anticipatePin: 1,
    onUpdate: (self) => {
      const idx = Math.min(
        cards.length - 1,
        Math.floor(self.progress * cards.length),
      );

      if (idx === activeIndex) return;

      if (idx > activeIndex) {
        // Add all skipped cards (handles fast scroll jumping multiple steps)
        for (let i = activeIndex + 1; i <= idx; i++) {
          const card = cards[i];
          if (!card) continue;
          card.classList.add("is-on");
          gsap.set(card, {
            rotation: i * rotationStep,
            scale: 1,
            zIndex: i + 1,
            force3D: true,
          });
        }
        // Entry pop only on the newly-arrived card
        const newCard = cards[idx];
        if (newCard) {
          gsap.from(newCard, {
            scale: 0.92,
            duration: 0.45,
            ease: "back.out(1.4)",
            overwrite: "auto",
          });
        }
      } else {
        // Remove all skipped-over cards when scrolling back
        for (let i = activeIndex; i > idx; i--) {
          const card = cards[i];
          if (!card) continue;
          card.classList.remove("is-on");
          gsap.set(card, { clearProps: "rotation,scale,zIndex" });
        }
      }

      gsap.to(circles, {
        rotation: -idx * rotationStep / 2,
        ease: "power3.out",
        duration: 0.4,
        overwrite: "auto",
        force3D: true,
      });

      activeIndex = idx;
      onIndexChange?.(idx);
    },
    onLeaveBack: () => {
      activeIndex = -1;
      cards.forEach((card) => {
        card.classList.remove("is-on");
        gsap.set(card, { rotation: 0, scale: 1 });
      });
      gsap.set(circles, { rotation: 0 });
    },
  });

  const reset = () => {
    activeIndex = -1;
    cards.forEach((card) => {
      card.classList.remove("is-on");
      gsap.set(card, { rotation: 0, scale: 1, clearProps: "all" });
    });
    gsap.set(circles, { rotation: 0, clearProps: "all" });
  };

  return () => {
    trigger.kill();
    reset();
  };
}
