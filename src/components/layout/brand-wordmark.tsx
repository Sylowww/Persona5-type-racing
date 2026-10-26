export function BrandWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display uppercase italic ${className}`}>
      TYPE<span className="text-primary-container">{"//"}</span>STRIKE
    </span>
  );
}
