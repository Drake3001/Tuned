"use client";

type Props = {
  background?: string;
  children: React.ReactNode;
};

export function GameCard({ background, children }: Props) {
  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center p-6">
      <div
        className="tuned-card relative h-[460px] w-full max-w-2xl overflow-hidden"
        style={background ? { background } : undefined}
      >
        {children}
      </div>
    </div>
  );
}

export function CardTopLeft({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="absolute left-6 top-6 text-sm font-medium"
      style={{ color: "rgba(255,255,255,0.7)" }}
    >
      {children}
    </div>
  );
}

export function CardTopRight({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="absolute right-6 top-6 font-mono text-sm"
      style={{ color: "rgba(255,255,255,0.4)" }}
    >
      {children}
    </div>
  );
}

export function CardActionButton({
  onClick,
  ariaLabel,
  children,
}: {
  onClick: () => void;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="absolute bottom-5 right-5 grid h-14 w-14 place-items-center rounded-full bg-white text-black shadow-lg transition hover:scale-105 active:scale-95"
    >
      {children}
    </button>
  );
}
