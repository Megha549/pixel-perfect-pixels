import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";

export function Glow() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-40 -left-32 size-[520px] rounded-full bg-brand/25 blur-3xl" />
      <div className="absolute top-1/3 -right-40 size-[560px] rounded-full bg-accent/25 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 size-[480px] rounded-full bg-brand/15 blur-3xl" />
    </div>
  );
}

export function Mark() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid size-9 place-items-center rounded-xl gradient-brand font-display font-bold text-primary-foreground shadow-lg shadow-brand/30">
        B
      </div>
      <span className="font-display text-lg font-semibold tracking-tight">Bridge</span>
      <span className="ml-1 mt-0.5 hidden font-mono text-[11px] text-muted-foreground sm:inline">
        SQL → real-world
      </span>
    </div>
  );
}

const NAV = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/concept/join", label: "Concept flow" },
  { to: "/evidence", label: "Evidence" },
  { to: "/profile", label: "Profile" },
] as const;

export function AppShell({ name, children }: { name: string; children: ReactNode }) {
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const initials =
    name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "ST";

  return (
    <div className="relative min-h-screen bg-surface text-ink">
      <Glow />
      <header className="sticky top-0 z-50 border-b border-white/50 bg-card/55 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/dashboard">
            <Mark />
          </Link>
          <nav className="hidden items-center gap-1 text-sm lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeProps={{ className: "bg-card/70 text-brand shadow-sm" }}
                inactiveProps={{ className: "text-muted-foreground hover:text-brand" }}
                className="rounded-full px-3.5 py-2 font-medium transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button
              onClick={signOut}
              className="hidden text-xs font-medium text-muted-foreground transition-colors hover:text-brand md:inline"
            >
              Sign out
            </button>
            <div className="grid size-9 place-items-center rounded-full gradient-brand text-xs font-semibold text-primary-foreground">
              {initials}
            </div>
          </div>
        </div>
      </header>
      <div className="relative mx-auto max-w-7xl px-6 py-8">{children}</div>
    </div>
  );
}

export function GlassCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-white/60 bg-card/60 p-5 shadow-xl shadow-brand/5 backdrop-blur-2xl ${className}`}
    >
      {children}
    </div>
  );
}

export function Meter({ pct }: { pct: number }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full gradient-brand transition-all duration-500"
        style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
      />
    </div>
  );
}
