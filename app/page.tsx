import { StaleBadge } from "@/components/stale-badge";
import { daily } from "@/content/daily";

export const dynamic = "force-static";

const updatedFormatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

function formatUpdated(updated: string): string {
  const parsed = new Date(updated);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(
      `content/daily.ts updated must be an ISO-8601 timestamp, received ${JSON.stringify(updated)}`,
    );
  }
  return updatedFormatter.format(parsed);
}

export default function Home() {
  const updatedLabel = formatUpdated(daily.updated);

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-16 font-sans text-zinc-950 dark:bg-black dark:text-zinc-50">
      <main className="flex w-full max-w-[560px] flex-col gap-6">
        <header>
          <h1 className="text-lg font-semibold tracking-tight">
            Daily · Krushnasinh
          </h1>
        </header>

        <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Tip of the day
          </h2>
          <p className="mt-2 text-base leading-7">{daily.tip}</p>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Model pick
          </h2>
          <p className="mt-2 font-semibold">{daily.model.name}</p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {daily.model.price} · {daily.model.why}
          </p>
        </section>

        <footer className="flex flex-wrap items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <p>
            Last updated <time dateTime={daily.updated}>{updatedLabel}</time>{" "}
            IST
          </p>
          <StaleBadge updated={daily.updated} />
        </footer>
      </main>
    </div>
  );
}
