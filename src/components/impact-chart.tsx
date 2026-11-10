import type { WeeklyImpactPoint } from "@/lib/volunteer-stats";

const WIDTH = 600;
const HEIGHT = 140;
const TOP_PAD = 10;
const BOTTOM_PAD = 24;

export function ImpactChart({ weeks }: { weeks: WeeklyImpactPoint[] }) {
  if (weeks.length === 0) return null;

  const maxHours = Math.max(1, ...weeks.map((w) => w.hours));
  const plotHeight = HEIGHT - TOP_PAD - BOTTOM_PAD;
  const stepX = weeks.length > 1 ? WIDTH / (weeks.length - 1) : 0;

  const points = weeks.map((w, i) => ({
    x: i * stepX,
    y: TOP_PAD + plotHeight - (w.hours / maxHours) * plotHeight,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x},${HEIGHT - BOTTOM_PAD} L${points[0].x},${HEIGHT - BOTTOM_PAD} Z`;

  const monthLabels: { x: number; label: string }[] = [];
  let lastMonth = -1;
  weeks.forEach((w, i) => {
    const month = new Date(w.weekStart).getMonth();
    if (month !== lastMonth) {
      monthLabels.push({
        x: points[i].x,
        label: new Date(w.weekStart).toLocaleDateString(undefined, { month: "short" }).toUpperCase(),
      });
      lastMonth = month;
    }
  });

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full h-auto"
      preserveAspectRatio="none"
      role="img"
      aria-label="Hours volunteered per week over the past 12 weeks"
    >
      <defs>
        <linearGradient id="impact-chart-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1b4d3e" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#1b4d3e" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line
        x1={0}
        y1={HEIGHT - BOTTOM_PAD}
        x2={WIDTH}
        y2={HEIGHT - BOTTOM_PAD}
        stroke="#c0c9c3"
        strokeWidth="1"
      />
      <path d={areaPath} fill="url(#impact-chart-fill)" stroke="none" />
      <path d={linePath} fill="none" stroke="#1b4d3e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === points.length - 1 ? 4.5 : 2.5}
          fill="#1b4d3e"
          opacity={i === points.length - 1 ? 1 : 0.55}
        />
      ))}
      {monthLabels.map((m, i) => (
        <text
          key={i}
          x={Math.min(Math.max(m.x, 14), WIDTH - 14)}
          y={HEIGHT - 6}
          fontSize="11"
          fill="#404945"
          textAnchor="middle"
        >
          {m.label}
        </text>
      ))}
    </svg>
  );
}
