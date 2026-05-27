"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ fontFamily: "system-ui", padding: 24 }}>
        <h1>fatal error</h1>
        <pre>{error.message}</pre>
        <button onClick={reset}>retry</button>
      </body>
    </html>
  );
}
