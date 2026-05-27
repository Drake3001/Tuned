"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-bold">something broke</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-lg px-4 py-2 font-bold"
        style={{
          background: "var(--tuned-orange)",
          color: "var(--tuned-orange-fg)",
        }}
      >
        try again
      </button>
    </main>
  );
}
