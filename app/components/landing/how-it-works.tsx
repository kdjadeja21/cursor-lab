const steps = [
  {
    step: "1",
    title: "Create a workspace",
    description: "Name it and invite collaborators when you’re ready.",
  },
  {
    step: "2",
    title: "Add pages",
    description: "Start from a blank doc or a simple template.",
  },
  {
    step: "3",
    title: "Work together",
    description: "Comment, assign tasks, and link related pages.",
  },
];

export function HowItWorks() {
  return (
    <section
      aria-labelledby="how-heading"
      className="border-y border-zinc-200/60 bg-zinc-50 py-16 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2
          id="how-heading"
          className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl"
        >
          How it works
        </h2>
        <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-6">
          {steps.map((item) => (
            <li key={item.step} className="relative flex flex-col">
              <span
                className="flex size-10 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white"
                aria-hidden="true"
              >
                {item.step}
              </span>
              <h3 className="mt-4 font-semibold text-zinc-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                {item.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
