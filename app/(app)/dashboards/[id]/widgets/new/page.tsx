"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { use } from "react";
import { WidgetBuilder } from "@/components/widget-builder";
import { PageHeader } from "@/components/page-header";
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
    <div className="flex flex-col gap-6">
      <PageHeader
        back={{ href: `/dashboards/${id}/edit`, label: dashboard.name }}
        title="Add widget"
        description="Pick a suggested view or map the fields yourself, then add it to the dashboard."
      />

      <WidgetBuilder dashboardId={id} initialConnectionId={connectionId} />
    </div>
  );
}
