"use client";

import { ValueScrollCards } from "./ValueScrollCards";
import { ValueScrollHeadline } from "./ValueScrollHeadline";
import { useValueScrollAnimations } from "./use-value-scroll";
import "./value-scroll.css";

export function ValueScrollSection() {
  const rootRef = useValueScrollAnimations();

  return (
    <div ref={rootRef} className="value-scroll">
      <ValueScrollHeadline />
      <ValueScrollCards />
    </div>
  );
}
