import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="text-8xl font-black tracking-tight">
        <span className="bg-gradient-to-r from-red-500 via-yellow-400 to-blue-500 bg-clip-text text-transparent">
          404
        </span>
      </div>
      <p className="mt-4 text-muted-foreground">page not found</p>
      <Link
        href="/"
        className="mt-6 rounded-lg px-4 py-2 font-bold"
        style={{
          background: "var(--tuned-orange)",
          color: "var(--tuned-orange-fg)",
        }}
      >
        back home
      </Link>
    </main>
  );
}
