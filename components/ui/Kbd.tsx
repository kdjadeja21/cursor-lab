import { cn } from "@/lib/cn";

export function Kbd({ keys, className }: { keys: string[]; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-[3px]", className)}>
      {keys.map((key) => (
        <kbd
          key={key}
          className="grid h-[17px] min-w-[17px] place-items-center rounded-[5px] border border-line bg-ink-750 px-[5px] font-sans text-[10px] leading-none font-medium text-fg-subtle"
        >
          {key}
        </kbd>
      ))}
    </span>
  );
}
