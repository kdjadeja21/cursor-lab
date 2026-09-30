"use client";

import { useState } from "react";
import { ConnectionEditor } from "@/components/connection-editor";
import { PageHeader } from "@/components/page-header";
import { newConnectionDraft } from "@/lib/connection";

export default function NewConnectionPage() {
  // The draft id is generated once so saving and navigating stay in sync.
  const [draft] = useState(newConnectionDraft);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={{ href: "/connections", label: "Connections" }}
        title="Add API connection"
        description="Configure the request, test it, and inspect what comes back before you save."
      />
      <ConnectionEditor initialConnection={draft} mode="create" />
    </div>
  );
}
