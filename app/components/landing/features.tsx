const features = [
  {
    title: "Docs & notes",
    description: "Rich pages with headings, lists, and embeds.",
  },
  {
    title: "Team wikis",
    description: "Shared knowledge that stays organized as you grow.",
  },
  {
    title: "Tasks",
    description: "Checklists and status on the same page as your specs.",
  },
  {
    title: "Search",
    description: "Find pages and tasks across your workspace.",
  },
];

export function Features() {
  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="bg-white py-16 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2
          id="features-heading"
          className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl"
        >
          Everything your team writes, in one place
        </h2>
        <p className="mt-3 max-w-2xl text-zinc-600">
          Harbor is built for teams who outgrow scattered docs and sticky notes —
          without the clutter of another tool chain.
        </p>
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <li
              key={feature.title}
              className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-6"
            >
              <h3 className="font-semibold text-zinc-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                {feature.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
