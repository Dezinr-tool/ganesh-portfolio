import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/** Fanned card carousel — rotates arms around wheel center (MWG geometry). */
export function bindValueScrollCarousel(options: {
  pinHeight: HTMLElement;
  stage: HTMLElement;
  wheel: HTMLElement;
  arms: HTMLElement[];
  rotationStep?: number;
}): () => void {
  const { pinHeight, stage, wheel, arms, rotationStep = 6.2 } = options;

  let activeIndex = -1;

  const trigger = ScrollTrigger.create({
    id: "vs-cards-pin",
    trigger: pinHeight,
    start: "top top",
    end: "bottom bottom",
    pin: stage,
    scrub: true,
    anticipatePin: 1,
    onUpdate: (self) => {
      const idx = Math.min(arms.length - 1, Math.floor(self.progress * arms.length));
      if (idx === activeIndex) return;

      if (idx > activeIndex) {
        for (let i = activeIndex + 1; i <= idx; i++) {
          const arm = arms[i];
          if (!arm) continue;
          arm.classList.add("is-active");
          gsap.set(arm, {
            rotation: i * rotationStep,
            zIndex: (i + 1) * 10,
          });
        }

        const newArm = arms[idx];
        const card = newArm?.querySelector<HTMLElement>(".vs-card");
        if (card) {
          gsap.fromTo(
            card,
            { scale: 0.92 },
            {
              scale: 1,
              duration: 0.45,
              ease: "back.out(1.4)",
              overwrite: "auto",
            },
          );
        }
      } else {
        for (let i = activeIndex; i > idx; i--) {
          const arm = arms[i];
          if (!arm) continue;
          arm.classList.remove("is-active");
          gsap.set(arm, { clearProps: "rotation,zIndex" });
        }
      }

      gsap.to(wheel, {
        rotation: -idx * (rotationStep / 2),
        ease: "power3.out",
        duration: 0.4,
        overwrite: "auto",
      });

      activeIndex = idx;
    },
    onLeaveBack: () => {
      activeIndex = -1;
      arms.forEach((arm) => {
        arm.classList.remove("is-active");
        gsap.set(arm, { clearProps: "rotation,zIndex" });
        const card = arm.querySelector<HTMLElement>(".vs-card");
        if (card) gsap.set(card, { scale: 1, clearProps: "transform" });
      });
      gsap.set(wheel, { rotation: 0, clearProps: "transform" });
    },
  });

  const reset = () => {
    activeIndex = -1;
    arms.forEach((arm) => {
      arm.classList.remove("is-active");
      gsap.set(arm, { clearProps: "all" });
    });
    gsap.set(wheel, { rotation: 0, clearProps: "all" });
  };

  return () => {
    trigger.kill();
    reset();
  };
}
