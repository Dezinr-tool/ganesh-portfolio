type SectionPlaceholderProps = {
  minHeight?: string;
  className?: string;
};

export function SectionPlaceholder({
  minHeight = "50vh",
  className = "",
}: SectionPlaceholderProps) {
  return (
    <div
      className={className}
      style={{ minHeight }}
      aria-hidden="true"
    />
  );
}
