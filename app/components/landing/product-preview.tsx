export function ProductPreview() {
  return (
    <div
      aria-hidden="true"
      className="w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg shadow-zinc-200/50"
    >
      <div className="flex items-center gap-2 border-b border-zinc-100 bg-zinc-50 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-zinc-300" />
        <span className="size-2.5 rounded-full bg-zinc-300" />
        <span className="size-2.5 rounded-full bg-zinc-300" />
        <span className="ml-2 flex-1 rounded-md bg-white px-3 py-1 text-xs text-zinc-400">
          harbor.app/workspace
        </span>
      </div>
      <div className="flex min-h-[280px] sm:min-h-[320px]">
        <aside className="hidden w-36 shrink-0 border-r border-zinc-100 bg-zinc-50/80 p-3 sm:block md:w-44">
          <div className="mb-3 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
            Workspace
          </div>
          <ul className="space-y-1.5 text-xs text-zinc-600">
            <li className="rounded-md bg-white px-2 py-1.5 font-medium text-zinc-900 shadow-sm">
              Product roadmap
            </li>
            <li className="px-2 py-1.5">Team wiki</li>
            <li className="px-2 py-1.5">Meeting notes</li>
            <li className="px-2 py-1.5">Sprint board</li>
          </ul>
        </aside>
        <div className="flex-1 p-4 sm:p-6">
          <div className="mb-4 h-6 w-2/3 max-w-xs rounded bg-zinc-900/90" />
          <div className="mb-2 h-3 w-full max-w-md rounded bg-zinc-100" />
          <div className="mb-2 h-3 w-full max-w-sm rounded bg-zinc-100" />
          <div className="mb-6 h-3 w-4/5 max-w-lg rounded bg-zinc-100" />
          <div className="mb-2 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
            Tasks
          </div>
          <ul className="space-y-2">
            {["Draft launch checklist", "Review wiki structure", "Assign Q4 goals"].map(
              (label) => (
                <li
                  key={label}
                  className="flex items-center gap-2 rounded-md border border-zinc-100 bg-zinc-50/50 px-3 py-2"
                >
                  <span className="size-3.5 shrink-0 rounded border border-zinc-300" />
                  <span className="text-xs text-zinc-600">{label}</span>
                </li>
              ),
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
