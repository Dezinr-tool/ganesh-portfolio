import "./on-screen-counter.css";

export function OnScreenCounter() {
  return (
    <div className="on-screen" aria-live="polite" aria-atomic="true">
      <span className="on-screen__wording">On screen</span>
      <span className="on-screen__light" aria-hidden="true" />
      <span className="on-screen__index">001</span>
    </div>
  );
}
