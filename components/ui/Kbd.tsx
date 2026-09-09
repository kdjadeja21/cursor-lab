import { cn } from "@/lib/cn";

type Props = {
  keys: string[];
  className?: string;
};

export function Kbd({ keys, className }: Props) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {keys.map((k, i) => (
        <kbd
          key={`${k}-${i}`}
          className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[4px] border border-line-1 bg-bg-3 px-1 font-sans text-[10.5px] font-medium leading-none text-fg-2"
        >
          {k}
        </kbd>
      ))}
    </span>
  );
}
