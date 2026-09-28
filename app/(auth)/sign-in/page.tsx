"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TextField } from "@/components/ui/field";
import { useWorkspace } from "@/lib/store/workspace";

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
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 grid size-10 place-items-center rounded-xl bg-brand text-white">
            <Zap className="size-5" aria-hidden />
          </span>
          <h1 className="text-xl font-semibold">Fetchboard</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Connect APIs. Build your dashboard.
          </p>
        </div>

        <Card className="p-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            {error ? <p className="text-xs text-danger">{error}</p> : null}
            <Button type="submit" variant="primary" className="w-full">
              Continue
            </Button>
          </form>
        </Card>

        <p className="mt-4 text-center text-xs text-ink-subtle">
          Placeholder sign-in. There is no account system yet — your dashboards
          and connections are stored in this browser only.
        </p>
      </div>
    </div>
  );
}
