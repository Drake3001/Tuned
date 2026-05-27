export function LifeIcons({ lives, max }: { lives: number; max: number }) {
  return (
    <span aria-label={`${lives} of ${max} lives`} className="inline-flex gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className="text-sm"
          style={{ color: i < lives ? "#ef4444" : "rgba(255,255,255,0.15)" }}
        >
          ♥
        </span>
      ))}
    </span>
  );
}
