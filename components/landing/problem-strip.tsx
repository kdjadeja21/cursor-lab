export function ProblemStrip() {
  return (
    <section className="bg-accent text-accent-foreground" aria-labelledby="problem-heading">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-6 py-10 md:py-14">
        <h2
          id="problem-heading"
          className="max-w-[22ch] text-balance text-2xl font-semibold tracking-tight md:text-3xl"
        >
          The calendar thread this replaces
        </h2>
        <p className="max-w-[68ch] text-pretty text-base leading-7">
          You send a time. They send another. The meeting waits in the inbox. One shared link ends that.
        </p>
      </div>
    </section>
  )
}
