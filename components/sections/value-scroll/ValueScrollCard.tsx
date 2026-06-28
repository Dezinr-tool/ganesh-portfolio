import type { ValueScrollCard as ValueScrollCardData } from "@/lib/value-scroll/constants";

export function ValueScrollCard({ card }: { card: ValueScrollCardData }) {
  return (
    <div className="vs-arm">
      <article className={`vs-card vs-card--${card.tone}`}>
        <div className="vs-card__surface" aria-hidden="true" />
        <div className="vs-card__content">
          <span className="vs-card__index" aria-hidden="true">
            {card.index}
          </span>
          <h3 className="vs-card__title">{card.title}</h3>
          <p className="vs-card__body">{card.body}</p>
        </div>
      </article>
    </div>
  );
}
