"use client";

import Link from "next/link";
import { use } from "react";
import { ArrowLeft } from "lucide-react";
import { WidgetBuilder } from "@/components/widget-builder";
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
    <div className="flex flex-col gap-5">
      <div>
        <Link
          href={`/dashboards/${id}/edit`}
          className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          {dashboard.name}
        </Link>
        <h1 className="mt-2 text-xl font-semibold">Edit {widget.title}</h1>
      </div>

      <WidgetBuilder dashboardId={id} widget={widget} />
    </div>
  );
}
