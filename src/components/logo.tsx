export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <path
        d="M50,85 C35,82 15,75 10,58 C7,48 10,38 20,35 C28,33 34,38 37,46 C40,55 45,72 50,85 Z"
        fill="#1b835c"
      />
      <ellipse
        cx="13"
        cy="53"
        rx="7"
        ry="9"
        fill="#1b835c"
        transform="rotate(-20 13 53)"
      />
      <path
        d="M50,85 C65,82 85,75 90,58 C93,48 90,38 80,35 C72,33 66,38 63,46 C60,55 55,72 50,85 Z"
        fill="#1b835c"
      />
      <ellipse
        cx="87"
        cy="53"
        rx="7"
        ry="9"
        fill="#1b835c"
        transform="rotate(20 87 53)"
      />
      <path
        d="M50,45 C41,37 30,30 30,20 C30,13 36,8 43,11 C46,12 48,15 50,19 C52,15 54,12 57,11 C64,8 70,13 70,20 C70,30 59,37 50,45 Z"
        fill="#28a373"
      />
    </svg>
  );
}
