"use client";

import Link from "next/link";
import { use } from "react";
import { ArrowLeft } from "lucide-react";
import { ConnectionEditor } from "@/components/connection-editor";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonClasses } from "@/components/ui/button";
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
    <div className="flex flex-col gap-5">
      <div>
        <Link
          href="/connections"
          className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Connections
        </Link>
        <h1 className="mt-2 text-xl font-semibold">{connection.name}</h1>
        <p className="mt-1 font-mono text-xs text-ink-subtle">{connection.url}</p>
      </div>

      <ConnectionEditor
        key={connection.id}
        initialConnection={connection}
        mode="edit"
      />
    </div>
  );
}
