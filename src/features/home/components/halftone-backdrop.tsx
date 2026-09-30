export function HalftoneBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden opacity-25">
      <div className="absolute -top-32 -left-32 size-[650px] rounded-full bg-primary-container opacity-40 blur-[140px]" />
      <div className="absolute top-1/2 -right-24 size-[500px] rounded-full bg-secondary-container opacity-20 blur-[160px]" />
      <svg className="size-full opacity-30" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="halftone-dots" width="16" height="16" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.8" className="fill-on-surface" />
          </pattern>
          <pattern id="halftone-stripes" width="40" height="40" patternTransform="rotate(-25)" patternUnits="userSpaceOnUse">
            <line x1="0" x2="0" y1="0" y2="40" strokeWidth="2" opacity="0.1" className="stroke-primary-fixed" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#halftone-dots)" />
        <rect width="100%" height="100%" fill="url(#halftone-stripes)" />
      </svg>
    </div>
  );
}
