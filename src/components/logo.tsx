export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 100"
      className={className}
      fill="none"
      stroke="#1e8a96"
      strokeWidth={5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14,94 C8,72 8,48 16,32 C20,24 25,19 24,14 C23,10 18,11 17,16 C16,20 19,23 24,22 C34,26 44,38 50,52" />
      <path d="M18,62 C16,54 20,48 27,49 C33,50 35,56 31,61 C28,65 21,66 18,62" />
      <path d="M106,94 C112,72 112,48 104,32 C100,24 95,19 96,14 C97,10 102,11 103,16 C104,20 101,23 96,22 C86,26 76,38 70,52" />
      <path d="M102,62 C104,54 100,48 93,49 C87,50 85,56 89,61 C92,65 99,66 102,62" />
      <path
        d="M60,58 C48,48 30,38 30,23 C30,13 38,6 48,9 C53,10 57,14 60,19 C63,14 67,10 72,9 C82,6 90,13 90,23 C90,38 72,48 60,58 Z"
        fill="#1e8a96"
        stroke="none"
      />
    </svg>
  );
}
