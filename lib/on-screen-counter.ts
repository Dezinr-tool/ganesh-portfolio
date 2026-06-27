import gsap from "gsap";

const ROOT_SELECTOR = ".on-screen";
const INDEX_SELECTOR = ".on-screen__index";

export function setOnScreenIndex(value: string) {
  const indexEl = document.querySelector<HTMLElement>(INDEX_SELECTOR);
  if (indexEl) indexEl.textContent = value;
}

export function showOnScreen(index: string) {
  setOnScreenIndex(index);
  document.body.classList.add("on-screen-on");

  gsap.fromTo(
    ROOT_SELECTOR,
    { scale: 0.97, autoAlpha: 0 },
    { scale: 1, autoAlpha: 1, ease: "back.out(1.7)", duration: 0.16 },
  );
}

export function hideOnScreen() {
  document.body.classList.remove("on-screen-on");
  gsap.to(ROOT_SELECTOR, {
    scale: 0.97,
    autoAlpha: 0,
    ease: "expo.in",
    duration: 0.16,
  });
}

export function formatOnScreenIndex(value: number, digits = 3): string {
  return String(value).padStart(digits, "0");
}
