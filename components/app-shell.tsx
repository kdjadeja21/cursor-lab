"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { LayoutDashboard, LogOut, Plug, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useWorkspace } from "@/lib/store/workspace";

const NAV = [
  { href: "/", label: "Dashboards", icon: LayoutDashboard },
  { href: "/connections", label: "Connections", icon: Plug },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname.startsWith("/dashboards");
  return pathname.startsWith(href);
}

function initialsOf(name: string) {
  return name
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function AppShell({ children }: { children: ReactNode }) {
  const { ready, session, signOut } = useWorkspace();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (ready && !session) router.replace("/sign-in");
  }, [ready, router, session]);

  if (!ready || !session) {
    return (
      <div className="flex flex-1 items-center justify-center p-10 text-sm text-ink-muted">
        Loading your workspace…
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold tracking-tight"
          >
            <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-brand to-accent text-white shadow-xs">
              <Zap className="size-4" aria-hidden />
            </span>
            Fetchboard
          </Link>

          <nav
            aria-label="Main"
            className="flex items-center gap-1 rounded-xl border border-line bg-surface-muted/70 p-1"
          >
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors duration-150",
                    active
                      ? "bg-surface text-brand-strong shadow-xs"
                      : "text-ink-muted hover:text-ink",
                  )}
                >
                  <Icon className="size-3.5" aria-hidden />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full border border-line bg-surface py-1 pr-3 pl-1 sm:flex">
              <span className="grid size-6 place-items-center rounded-full bg-brand-soft text-[10px] font-semibold text-brand-strong">
                {initialsOf(session.name || session.email)}
              </span>
              <span className="max-w-36 truncate text-xs text-ink-muted">
                {session.name}
              </span>
            </span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="size-3.5" aria-hidden />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>

      <footer className="border-t border-line px-4 py-4 text-center text-[11px] text-ink-subtle sm:px-6">
        Fetchboard stores dashboards and connections in this browser only.
      </footer>
    </div>
  );
}
