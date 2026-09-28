"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { ConnectionEditor } from "@/components/connection-editor";
import { newConnectionDraft } from "@/lib/connection";

export default function NewConnectionPage() {
  // The draft id is generated once so saving and navigating stay in sync.
  const [draft] = useState(newConnectionDraft);

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
        <h1 className="mt-2 text-xl font-semibold">Add API connection</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Configure the request, test it, and inspect what comes back before you
          save.
        </p>
      </div>

      <ConnectionEditor initialConnection={draft} mode="create" />
    </div>
  );
}
