"use client";

import { useState } from "react";
import { HeartHandshake } from "lucide-react";

export function OpportunityImage({
  src,
  alt,
  className,
}: {
  src: string | null;
  alt: string;
  className: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-brand-100 via-sunset-100 to-sky-100 ${className}`}>
        <HeartHandshake className="h-8 w-8 text-brand-400" aria-hidden="true" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />
  );
}
