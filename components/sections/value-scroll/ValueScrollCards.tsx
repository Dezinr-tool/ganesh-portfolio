import { VALUE_SCROLL_CARDS } from "@/lib/value-scroll/constants";
import { ValueScrollCard } from "./ValueScrollCard";

export function ValueScrollCards() {
  return (
    <section className="vs-cards" aria-label="Capabilities">
      <div className="vs-cards__pin">
        <div className="vs-cards__stage">
          <div className="vs-cards__wheel">
            {VALUE_SCROLL_CARDS.map((card) => (
              <ValueScrollCard key={card.id} card={card} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
