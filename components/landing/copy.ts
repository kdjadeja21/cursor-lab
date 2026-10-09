export const headline = "Book a time without the email thread."

export const offer =
  "Slotly is a scheduling app where you share a link and people book time with you."

export const steps = [
  {
    label: "1",
    title: "Set the hours you can meet.",
    detail: "Those hours are the only times on your link.",
  },
  {
    label: "2",
    title: "Share one link.",
    detail: "The other person opens it and sees when you are free.",
  },
  {
    label: "3",
    title: "They book an open slot.",
    detail: "The time they pick lands on your calendar.",
  },
] as const

export const productPoints = [
  {
    title: "A public booking page",
    detail: "People open your link and pick a time you can meet.",
  },
  {
    title: "Your availability",
    detail: "You decide the hours. Nothing outside them can be booked.",
  },
  {
    title: "A calendar connection",
    detail: "A booked slot is a time on your calendar, not another email to answer.",
  },
] as const

export const exampleSlotsLabel = "Example"

export const exampleOpenTimes = [
  { day: "Tuesday", times: ["9:00", "9:30", "10:00"] },
  { day: "Wednesday", times: ["13:00", "14:30"] },
] as const
