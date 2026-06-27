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
        const card = cards[idx];
        card?.classList.add("is-on");
        if (card) {
          gsap.set(card, { rotation: idx * rotationStep });
          gsap.from(card, {
            scale: 0.94,
            ease: "elastic.out(0.6, 0.3)",
            duration: 0.5,
          });
        }
      } else if (activeIndex >= 0) {
        cards[activeIndex]?.classList.remove("is-on");
      }

      gsap.to(circles, {
        rotation: -idx * rotationStep + (rotationStep / 2) * idx,
        ease: "elastic.out(0.6, 0.3)",
        duration: 0.5,
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

  return () => {
    trigger.kill();
  };
}
