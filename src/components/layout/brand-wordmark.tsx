export function BrandWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display text-headline-md uppercase italic ${className}`}>
      TYPE<span className="text-primary-container">{"//"}</span>STRIKE
    </span>
  );
}
