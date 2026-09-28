"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { use } from "react";
import { ArrowLeft } from "lucide-react";
import { WidgetBuilder } from "@/components/widget-builder";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useDashboard } from "@/lib/store/workspace";

export default function NewWidgetPage({
  params,
}: PageProps<"/dashboards/[id]/widgets/new">) {
  const { id } = use(params);
  const { ready, dashboard } = useDashboard(id);
  const connectionId = useSearchParams().get("connectionId") ?? undefined;

  if (!dashboard) {
    return ready ? (
      <EmptyState
        title="Dashboard not found"
        action={
          <Link href="/" className={buttonClasses()}>
            Back to dashboards
          </Link>
        }
      />
    ) : null;
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link
          href={`/dashboards/${id}/edit`}
          className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          {dashboard.name}
        </Link>
        <h1 className="mt-2 text-xl font-semibold">Add widget</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Pick a suggested view or map the fields yourself, then add it to the
          dashboard.
        </p>
      </div>

      <WidgetBuilder dashboardId={id} initialConnectionId={connectionId} />
    </div>
  );
}
