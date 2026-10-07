import { Badge } from "@/components/ui/badge";
import { Reveal } from "./reveal";

export function SectionHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body?: string;
}) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <Badge variant="secondary" className="mb-4">
        {eyebrow}
      </Badge>
      <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
        {title}
      </h2>
      {body ? (
        <p className="mt-4 text-lg text-pretty text-muted-foreground">{body}</p>
      ) : null}
    </Reveal>
  );
}
