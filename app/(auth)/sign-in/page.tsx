"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Check,
  Layers,
  RefreshCw,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TextField } from "@/components/ui/field";
import { useWorkspace } from "@/lib/store/workspace";

const HIGHLIGHTS = [
  {
    icon: Layers,
    title: "REST and GraphQL in one place",
    body: "Configure the request, test it, and inspect exactly what comes back.",
  },
  {
    icon: BarChart3,
    title: "Views suggested from your data",
    body: "Tables, KPI cards, galleries, and charts ranked by what the response actually contains.",
  },
  {
    icon: RefreshCw,
    title: "Kept in sync",
    body: "Each endpoint refreshes on its own schedule and every widget shares the same fetch.",
  },
  {
    icon: ShieldCheck,
    title: "Requests run server-side",
    body: "The browser never calls your endpoints directly, so cross-origin APIs just work.",
  },
];

export default function SignInPage() {
  const { ready, session, signIn } = useWorkspace();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ready && session) router.replace("/");
  }, [ready, router, session]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed.includes("@")) {
      setError("Enter an email address to name your local workspace.");
      return;
    }
    signIn(trimmed, name);
    router.replace("/");
  };

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10 sm:py-16">
      <div className="grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[1.1fr_minmax(0,24rem)]">
        <section className="hidden flex-col gap-8 lg:flex">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-brand-strong shadow-xs">
              <Zap className="size-3.5" aria-hidden />
              Fetchboard
            </span>
            <h1 className="mt-5 text-4xl leading-[1.08] font-semibold">
              Connect APIs.
              <br />
              Build your dashboard.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-muted">
              Add the endpoints you already use, pick the visualizations that fit
              what they return, and combine them into one dashboard that keeps
              itself up to date. No frontend code.
            </p>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2">
            {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-3">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl border border-line bg-surface text-brand-strong shadow-xs">
                  <Icon className="size-4" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
                    {body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="w-full">
          <div className="mb-6 flex flex-col items-center gap-2 text-center lg:hidden">
            <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-brand to-accent text-white shadow-card">
              <Zap className="size-5" aria-hidden />
            </span>
            <h1 className="text-2xl font-semibold">Fetchboard</h1>
            <p className="text-sm text-ink-muted">
              Connect APIs. Build your dashboard.
            </p>
          </div>

          <Card className="p-6">
            <h2 className="text-base font-semibold">Open your workspace</h2>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">
              Your email names the workspace saved in this browser. No password,
              no account.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
              <TextField
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError(null);
                }}
              />
              <TextField
                label="Display name (optional)"
                placeholder="Alex Doe"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              {error ? (
                <p role="alert" className="text-xs text-danger">
                  {error}
                </p>
              ) : null}
              <Button type="submit" variant="primary" size="lg" className="w-full">
                Continue
                <Check className="size-4" aria-hidden />
              </Button>
            </form>

            <p className="mt-4 border-t border-line pt-4 text-[11px] leading-relaxed text-ink-subtle">
              Placeholder sign-in: dashboards, connections, and credentials are
              stored in this browser only, and scheduled refresh runs while a tab
              is open.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
