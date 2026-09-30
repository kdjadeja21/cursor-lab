"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import { resolveCards } from "@/lib/widget-data";
import type { CardsConfig } from "@/lib/types";
import { FieldValue } from "./field-value";
import { WidgetIssues } from "./widget-issues";

/**
 * Image URLs come from arbitrary third-party APIs, so a broken or blocked image
 * falls back to a neutral placeholder instead of a broken-image icon.
 */
function CardImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="grid aspect-[16/10] w-full place-items-center rounded-lg bg-surface-sunken text-ink-subtle">
        <ImageOff className="size-5" aria-hidden />
        <span className="sr-only">Image could not be loaded</span>
      </div>
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
      className="aspect-[16/10] w-full rounded-lg bg-surface-sunken object-cover"
    />
  );
}

export function CardsWidget({
  config,
  data,
}: {
  config: CardsConfig;
  data: unknown;
}) {
  const resolved = resolveCards(config, data);

  if (resolved.error || !resolved.value) {
    return <WidgetIssues error={resolved.error} missing={resolved.missing} />;
  }

  if (resolved.value.length === 0) {
    return <p className="text-xs text-ink-muted">No records to show yet.</p>;
  }

  const hasImages = resolved.value.some((record) => record.imageUrl);

  return (
    <div className="flex h-full flex-col gap-2.5">
      <WidgetIssues missing={resolved.missing} />
      <div
        className={
          hasImages
            ? "scroll-slim grid min-h-0 flex-1 grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-3 overflow-auto"
            : "scroll-slim grid min-h-0 flex-1 grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] gap-2.5 overflow-auto"
        }
      >
        {resolved.value.map((record, index) => (
          <article
            key={index}
            className="animate-in-fade flex flex-col gap-2 rounded-xl border border-line bg-surface p-2.5 shadow-xs transition-shadow duration-200 hover:shadow-card"
          >
            {record.imageUrl ? (
              <CardImage
                src={record.imageUrl}
                alt={record.title ?? `Record ${index + 1}`}
              />
            ) : null}

            {record.title ? (
              <h4 className="truncate text-sm font-semibold text-ink">
                {record.title}
              </h4>
            ) : null}

            <dl className="flex flex-col gap-1">
              {record.fields.map((field) => (
                <div
                  key={field.mapping.path.join(".")}
                  className="flex items-baseline justify-between gap-2 border-b border-line/60 pb-1 last:border-0 last:pb-0"
                >
                  <dt className="truncate text-[11px] text-ink-subtle">
                    {field.mapping.label}
                  </dt>
                  <dd className="min-w-0 truncate text-right text-xs font-medium tabular-nums">
                    <FieldValue value={field.value} format={field.mapping.format} />
                  </dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
    </div>
  );
}
