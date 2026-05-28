import Link from "next/link";
import { UserMenu } from "./UserMenu";
import { ResumeLobbyBanner } from "@/components/lobby/ResumeLobbyBanner";

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-1 font-mono text-xl font-bold tracking-tight"
        >
          <span style={{ color: "var(--tuned-orange)" }}>tuned</span>
          <span>.gg</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
          <Link href="/play/solo" className="hover:text-foreground">
            play
          </Link>
          <Link href="/leaderboard" className="hover:text-foreground">
            leaderboard
          </Link>
          <Link href="/daily" className="hover:text-foreground">
            daily
          </Link>
          <ResumeLobbyBanner />
        </nav>
        <UserMenu />
      </div>
    </header>
  );
}
