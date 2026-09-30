"use client";

import Link from "next/link";
import { use } from "react";
import { ConnectionEditor } from "@/components/connection-editor";
import { PageHeader } from "@/components/page-header";
import { MethodBadge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useWorkspace } from "@/lib/store/workspace";

export default function EditConnectionPage({
  params,
}: PageProps<"/connections/[id]">) {
  const { id } = use(params);
  const { ready, state } = useWorkspace();
  const connection = state.connections.find((item) => item.id === id);

  if (!connection) {
    return ready ? (
      <EmptyState
        title="Connection not found"
        description="It may have been deleted, or saved in a different browser."
        action={
          <Link href="/connections" className={buttonClasses()}>
            Back to connections
          </Link>
        }
      />
    ) : null;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={{ href: "/connections", label: "Connections" }}
        title={connection.name}
        meta={
          <span className="flex items-center gap-2">
            <MethodBadge
              method={
                connection.apiType === "graphql" ? "POST" : connection.method
              }
            />
            <span className="truncate font-mono text-xs text-ink-subtle">
              {connection.url}
            </span>
          </span>
        }
      />
      <ConnectionEditor
        key={connection.id}
        initialConnection={connection}
        mode="edit"
      />
    </div>
  );
}
