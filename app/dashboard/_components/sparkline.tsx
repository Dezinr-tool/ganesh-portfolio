type SparklineProps = {
  data: number[];
  color: string;
  variant?: "line" | "bar";
};

function getPoints(data: number[], width: number, height: number) {
  const padding = 2;
  const innerHeight = height - padding * 2;
  const max = Math.max(...data, 0);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const step = data.length > 1 ? width / (data.length - 1) : width / 2;

  return data.map((value, index) => ({
    x: data.length > 1 ? index * step : width / 2,
    y: padding + innerHeight - ((value - min) / range) * innerHeight,
    value,
  }));
}

function buildSmoothLinePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const controlX = (current.x + next.x) / 2;
    path += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
  }

  return path;
}

export function Sparkline({
  data,
  color,
  variant = "line",
}: SparklineProps) {
  const width = 100;
  const height = 40;

  if (data.length === 0) {
    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-10 w-full"
        preserveAspectRatio="none"
        aria-hidden
      />
    );
  }

  const max = Math.max(...data, 0);

  if (variant === "bar") {
    const slotWidth = width / data.length;

    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-10 w-full"
        preserveAspectRatio="none"
        aria-hidden
      >
        {data.map((value, index) => {
          const barHeight = max === 0 ? 0 : (value / max) * (height - 4);
          const x = index * slotWidth + 1;

          return (
            <rect
              key={index}
              x={x}
              y={height - barHeight - 2}
              width={Math.max(slotWidth - 2, 1)}
              height={Math.max(barHeight, value > 0 ? 2 : 0)}
              rx={1}
              fill={color}
              fillOpacity={index === data.length - 1 ? 0.95 : 0.45}
            />
          );
        })}
        {data[data.length - 1] > 0 ? (
          <circle
            cx={(data.length - 1) * slotWidth + slotWidth / 2}
            cy={height - (max === 0 ? 0 : (data[data.length - 1] / max) * (height - 4)) - 2}
            r={2.5}
            fill={color}
          />
        ) : null}
      </svg>
    );
  }

  const points = getPoints(data, width, height);
  const last = points[points.length - 1];
  const linePath = buildSmoothLinePath(points);
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-10 w-full"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path d={areaPath} fill={color} fillOpacity={0.12} />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {last ? <circle cx={last.x} cy={last.y} r={2.5} fill={color} /> : null}
    </svg>
  );
}
