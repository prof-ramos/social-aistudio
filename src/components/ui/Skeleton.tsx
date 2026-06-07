export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-none bg-slate/10 ${className}`}
    />
  );
}
