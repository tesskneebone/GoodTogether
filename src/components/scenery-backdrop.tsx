interface CloudProps {
  x: number;
  y: number;
  scale?: number;
  opacity?: number;
}

function Cloud({ x, y, scale = 1, opacity = 0.9 }: CloudProps) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
      <path
        d="M0 24c-11 0-20-9-20-20 0-10 7-18 17-20 3-9 12-16 22-16 11 0 21 8 24 18 9 1 16 9 16 18 0 11-9 20-20 20H0Z"
        fill="#ffffff"
        stroke="#b3e8ff"
        strokeWidth="2"
      />
    </g>
  );
}

function Sprig({ x, y, flip = false }: { x: number; y: number; flip?: boolean }) {
  const t = flip ? "scale(-1 1)" : "";
  return (
    <g transform={`translate(${x} ${y}) ${t}`} stroke="#176d78" strokeWidth="3" fill="none" strokeLinecap="round">
      <path d="M0 60 C 2 35, -4 20, 6 0" />
      <path d="M2 30 C -10 26, -18 16, -16 4" fill="#d7f0f2" />
      <path d="M0 45 C 14 42, 22 32, 20 20" fill="#d7f0f2" />
    </g>
  );
}

function Sun({ x, y, r = 54, warm = false }: { x: number; y: number; r?: number; warm?: boolean }) {
  const fill = warm ? "#ffe6d5" : "#fff4ed";
  const stroke = warm ? "#e6440f" : "#ff7d47";
  const rays = Array.from({ length: 12 }, (_, i) => (i * 360) / 12);
  return (
    <g transform={`translate(${x} ${y})`}>
      {rays.map((deg) => (
        <line
          key={deg}
          x1={0}
          y1={0}
          x2={0}
          y2={-(r + 16)}
          stroke={stroke}
          strokeWidth="3"
          strokeLinecap="round"
          opacity={0.6}
          transform={`rotate(${deg})`}
        />
      ))}
      <circle r={r} fill={fill} stroke={stroke} strokeWidth="3" />
      <circle cx={-r * 0.32} cy={-r * 0.08} r={r * 0.07} fill={stroke} />
      <circle cx={r * 0.32} cy={-r * 0.08} r={r * 0.07} fill={stroke} />
      <path
        d={`M ${-r * 0.3} ${r * 0.28} Q 0 ${r * 0.5} ${r * 0.3} ${r * 0.28}`}
        stroke={stroke}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
    </g>
  );
}

const VARIANTS = {
  profile: {
    skyFrom: "#eff9fa",
    skyVia: "#fff4ed",
    skyTo: "#effaff",
    sun: { x: 1260, y: 90, r: 58, warm: false },
    clouds: [
      { x: 170, y: 70, scale: 1.1 },
      { x: 360, y: 125, scale: 0.75, opacity: 0.8 },
      { x: 1080, y: 150, scale: 0.6, opacity: 0.6 },
    ],
    hillBack: "#d7f0f2",
    hillFront: "#b0e1e6",
    sprigs: [
      { x: 70, y: 310 },
      { x: 150, y: 330, flip: true },
    ],
  },
  feed: {
    skyFrom: "#effaff",
    skyVia: "#eff9fa",
    skyTo: "#fff4ed",
    sun: { x: 190, y: 85, r: 50, warm: false },
    clouds: [
      { x: 520, y: 60, scale: 0.9 },
      { x: 1180, y: 100, scale: 1.05 },
      { x: 1340, y: 160, scale: 0.6, opacity: 0.65 },
    ],
    hillBack: "#dcf3ff",
    hillFront: "#b3e8ff",
    sprigs: [
      { x: 1320, y: 320 },
      { x: 1390, y: 335, flip: true },
    ],
  },
  dashboard: {
    skyFrom: "#fff4ed",
    skyVia: "#eff9fa",
    skyTo: "#effaff",
    sun: { x: 1180, y: 110, r: 66, warm: true },
    clouds: [
      { x: 140, y: 60, scale: 1 },
      { x: 420, y: 140, scale: 0.55, opacity: 0.6 },
      { x: 960, y: 70, scale: 0.7, opacity: 0.75 },
    ],
    hillBack: "#ffe6d5",
    hillFront: "#d7f0f2",
    sprigs: [
      { x: 60, y: 300 },
      { x: 1400, y: 320, flip: true },
    ],
  },
} as const;

export function SceneryBackdrop({ variant }: { variant: keyof typeof VARIANTS }) {
  const v = VARIANTS[variant];
  const gradId = `sky-${variant}`;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[360px] overflow-hidden sm:h-[400px]" aria-hidden="true">
      <svg
        viewBox="0 0 1440 400"
        preserveAspectRatio="xMidYMax slice"
        className="h-full w-full"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0.3">
            <stop offset="0%" stopColor={v.skyFrom} />
            <stop offset="55%" stopColor={v.skyVia} />
            <stop offset="100%" stopColor={v.skyTo} />
          </linearGradient>
        </defs>
        <rect width="1440" height="400" fill={`url(#${gradId})`} />

        <Sun x={v.sun.x} y={v.sun.y} r={v.sun.r} warm={v.sun.warm} />
        {v.clouds.map((c, i) => (
          <Cloud key={i} {...c} />
        ))}

        <path
          d="M0 320 C 220 260, 420 360, 680 300 C 920 250, 1140 340, 1440 280 L1440 400 L0 400 Z"
          fill={v.hillBack}
        />
        <path
          d="M0 360 C 260 310, 480 390, 760 340 C 1020 300, 1220 380, 1440 330 L1440 400 L0 400 Z"
          fill={v.hillFront}
        />

        {v.sprigs.map((s, i) => (
          <Sprig key={i} {...s} />
        ))}
      </svg>
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[var(--background)]" />
    </div>
  );
}
