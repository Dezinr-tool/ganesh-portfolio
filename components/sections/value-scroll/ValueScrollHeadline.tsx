import { VALUE_SCROLL_TEXT } from "@/lib/value-scroll/constants";

function SplitLine({
  text,
  accent,
}: {
  text: string;
  accent?: boolean;
}) {
  return (
    <p className={`vs-headline__line${accent ? " vs-headline__line--accent" : ""}`}>
      {[...text].map((char, index) => (
        <span key={`${index}-${char}`} className="vs-headline__char" aria-hidden="true">
          <span className="vs-headline__char-inner">
            {char === " " ? "\u00a0" : char}
          </span>
        </span>
      ))}
    </p>
  );
}

export function ValueScrollHeadline() {
  const srText = [...VALUE_SCROLL_TEXT.desktop].join(" ");

  return (
    <section className="vs-headline" aria-labelledby="value-scroll-heading">
      <h2 id="value-scroll-heading" className="sr-only">
        {srText}
      </h2>
      <div className="vs-headline__pin">
        <div className="vs-headline__stage">
          <div className="vs-headline__copy vs-headline__copy--desktop">
            {VALUE_SCROLL_TEXT.desktop.map((line) => (
              <SplitLine key={line} text={line} />
            ))}
          </div>
          <div className="vs-headline__copy vs-headline__copy--mobile" aria-hidden="true">
            {VALUE_SCROLL_TEXT.mobile.map((line, index) => (
              <SplitLine
                key={line}
                text={line}
                accent={index >= VALUE_SCROLL_TEXT.mobileAccentFromLine}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
