"use client";

import { useState } from "react";
import { ExternalLink, ImageOff } from "lucide-react";
import { formatValue } from "@/lib/format";
import { looksLikeImageUrl, looksLikeUrl } from "@/lib/infer-schema";
import type { FieldFormat } from "@/lib/types";

function Thumbnail({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className="grid size-8 place-items-center rounded-md bg-surface-sunken text-ink-subtle">
        <ImageOff className="size-3.5" aria-hidden />
        <span className="sr-only">Image could not be loaded</span>
      </span>
    );
  }

  return (
    /* Remote URLs come from user-supplied APIs, so next/image cannot be
       configured for their hosts ahead of time. */
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className="size-8 rounded-md border border-line bg-surface-sunken object-cover"
    />
  );
}

/**
 * Renders one mapped value. Image and link formats become elements; every other
 * value is plain text, so markup returned by an API can never execute.
 */
export function FieldValue({
  value,
  format,
  label,
}: {
  value: unknown;
  format: FieldFormat;
  label?: string;
}) {
  if (value === null || value === undefined) {
    return <span className="text-ink-subtle">—</span>;
  }

  if (format.kind === "image" && looksLikeImageUrl(value)) {
    return <Thumbnail src={String(value)} alt={label ?? "Image"} />;
  }

  if (format.kind === "link" && looksLikeUrl(value)) {
    const href = String(value);
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className="inline-flex items-center gap-1 text-brand-strong hover:underline"
      >
        <span className="max-w-40 truncate">{href.replace(/^https?:\/\//, "")}</span>
        <ExternalLink className="size-3 shrink-0" aria-hidden />
      </a>
    );
  }

  return <>{formatValue(value, format)}</>;
}
