export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      stroke="#1b835c"
      strokeWidth={7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path
        d="M50,46 C41,37 28,30 28,19 C28,12 34,7 41,10 C45,12 48,15 50,19 C52,15 55,12 59,10 C66,7 72,12 72,19 C72,30 59,37 50,46 Z"
        fill="#ff5c1f"
        stroke="none"
      />
      <path d="M46,68 C33,74 15,70 11,52 C9,43 14,36 23,36" />
      <path d="M23,36 L18,24" />
      <path d="M28,38 L25,26" />
      <path d="M33,41 L32,28" />
      <path d="M54,68 C67,74 85,70 89,52 C91,43 86,36 77,36" />
      <path d="M77,36 L82,24" />
      <path d="M72,38 L75,26" />
      <path d="M67,41 L68,28" />
    </svg>
  );
}
