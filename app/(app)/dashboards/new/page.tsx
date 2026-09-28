"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { useWorkspace } from "@/lib/store/workspace";

const BLANK = "blank";

export default function NewDashboardPage() {
  const { state, createDashboard } = useWorkspace();
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startFrom, setStartFrom] = useState(BLANK);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Give the dashboard a name.");
      return;
    }
    const dashboard = createDashboard({ name, description });
    router.push(
      startFrom === BLANK
        ? `/dashboards/${dashboard.id}/edit`
        : `/dashboards/${dashboard.id}/widgets/new?connectionId=${startFrom}`,
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Dashboards
        </Link>
        <h1 className="mt-2 text-xl font-semibold">Create dashboard</h1>
      </div>

      <Card>
        <CardHeader title="Dashboard details" />
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
          <TextField
            label="Name"
            placeholder="Operations overview"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError(null);
            }}
          />
          <TextAreaField
            label="Description (optional)"
            rows={3}
            className="font-sans text-sm"
            placeholder="What this dashboard is for"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <SelectField
            label="Start from"
            value={startFrom}
            onChange={(event) => setStartFrom(event.target.value)}
            hint={
              state.connections.length === 0
                ? "You have no connections yet. Create the dashboard, then add one."
                : "Starting from a connection takes you straight to the widget builder."
            }
          >
            <option value={BLANK}>Blank dashboard</option>
            {state.connections.map((connection) => (
              <option key={connection.id} value={connection.id}>
                {connection.name}
              </option>
            ))}
          </SelectField>

          {error ? <p className="text-xs text-danger">{error}</p> : null}

          <div className="flex items-center gap-2">
            <Button type="submit" variant="primary">
              Create dashboard
            </Button>
            <Link href="/" className={buttonClasses({ variant: "ghost" })}>
              Cancel
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
