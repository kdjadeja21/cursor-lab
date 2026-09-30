"use client";

import Link from "next/link";
import { use } from "react";
import { WidgetBuilder } from "@/components/widget-builder";
import { PageHeader } from "@/components/page-header";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useDashboard } from "@/lib/store/workspace";

export default function EditWidgetPage({
  params,
}: PageProps<"/dashboards/[id]/widgets/[widgetId]">) {
  const { id, widgetId } = use(params);
  const { ready, dashboard, widgets } = useDashboard(id);
  const widget = widgets.find((item) => item.id === widgetId);

  if (!dashboard || !widget) {
    return ready ? (
      <EmptyState
        title="Widget not found"
        action={
          <Link href={`/dashboards/${id}/edit`} className={buttonClasses()}>
            Back to dashboard
          </Link>
        }
      />
    ) : null;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={{ href: `/dashboards/${id}/edit`, label: dashboard.name }}
        title={`Edit ${widget.title}`}
        description="Change the view, its field mapping, or where it sits on the dashboard."
      />

      <WidgetBuilder dashboardId={id} widget={widget} />
    </div>
  );
}
