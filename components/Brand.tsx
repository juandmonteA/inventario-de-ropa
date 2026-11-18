export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect width="32" height="32" rx="8" fill="#D6F23B" />
      <path
        d="M9 24 L17 8 M14 24 L22 8 M19 24 L27 8"
        stroke="#0E2579"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Brand({ storeName }: { storeName: string }) {
  return (
    <div className="flex items-center gap-3">
      <BrandMark />
      <div className="min-w-0 leading-tight">
        <p className="font-display text-2xl font-semibold tracking-tight">
          Cancha
        </p>
        <p className="truncate text-xs text-white/70">{storeName}</p>
      </div>
    </div>
  );
}
