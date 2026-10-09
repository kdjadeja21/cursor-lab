export const downloadHref = "https://x.ai/bot"

export const hero = {
  eyebrow: "Grok Bot",
  title: "AI teammates that finish the work",
  messageTitle: "Message Bots like teammates",
  messageBody:
    "Give tasks to Bots like you would a teammate on desktop or iOS. Your AI teammates take projects from start to end, keep context on how you work and get smarter over time, and come back when your approval is needed.",
  manyTitle: "Work with many Bots at once",
  manyBody:
    "Create a Bot, give it a task, and add another when the work grows—one on a project, one on outbound, one on systems. AI teammates work in parallel, collaborate where it makes sense, and keep working 24/7.",
} as const

export const worksWhere = {
  title: "Grok Bot works where you work",
  body: "Log Grok Bot in once. It uses your apps and websites just like you would, including the tools that are harder to navigate.",
  points: [
    {
      title: "Grok Bot's own computer",
      status: "Working",
      control: "You're in control",
      prompt: "Sign in to Zendesk so I can work the support queue.",
      speaker: "You",
    },
    { title: "Signs into your tools" },
    { title: "Routines on a schedule" },
    { title: "Work anywhere: desktop, mobile, and more" },
  ],
} as const

export const teach = {
  title: "Show a Bot how it's done",
  body: "Ask a Bot to follow along as you complete a workflow once. It saves it as a routine and runs it on its own next time.",
  routine: "Weekly Reporting is watching and learning",
  elapsed: "0:04",
  action: "Teach a task",
  speaker: "You",
} as const

export const memory = {
  title: "Bots get smarter over time",
  body: "Bots keep context and learn from each other. Show one a workflow today, hand off the project by Friday.",
  reply:
    "Acme replied on pricing, same thread as last quarter. I already had the context, so I answered without waiting on you.",
  note: "Noted for next time: they only sign annual, and Dana is the one who approves.",
  updated: "Updated memory for",
  role: "Account Manager",
} as const

export const connect = {
  title: "Connect the Bots",
  body: "Put a few Bots in the same thread and they pass work between themselves. You watch them take action instead of approving every step.",
  status: "Asking Research…",
} as const

export const jobs = {
  title: "Give each Bot a job",
  roles: [
    {
      name: "Sales Outbound",
      description:
        "Generate pipeline overnight. Researches accounts, scores contacts with intent, drafts email and LinkedIn in your voice, and leaves a review list for you to approve.",
    },
    { name: "Talent Scout" },
    { name: "Paid Media" },
    { name: "Expense Manager" },
    { name: "Product Performance" },
    { name: "Bug Reproduction" },
    { name: "Account Health" },
    { name: "Chief of Staff" },
  ],
} as const

export const downloadSection = {
  title: "Download Grok Bot",
  body: "One team, wherever you are — on your desk and in your pocket.",
} as const

export const guides = {
  title: "Grok Bot Guides",
  items: [
    {
      id: "assistants",
      question: "How is Grok Bot different from AI assistants?",
      answer:
        "Bots have their own computer, so they can work inside your apps and tools. They also run in parallel, 24/7, even when your laptop is closed.",
    },
    {
      id: "enterprise",
      question: "Is Grok Bot available for enterprises?",
      answer:
        "Yes. Grok Bot is generally available for Enterprise, as well as for teams and businesses on Cursor and Grok plans. Contact sales to set up Enterprise access for your organization, including people who don’t already have a seat.",
    },
    {
      id: "privacy",
      question: "How does Grok Bot handle my data & privacy?",
      answer:
        "Grok Bot uses the same Cursor SSO, auth, and privacy mode you already trust. Your cloud computer is encrypted in transit and at rest, with training opt-out. Sensitive actions can go through Auto Review before they run. Enterprise admins can set DLP, certs, proxies, and network controls at boot.",
    },
  ],
} as const

export const closer = {
  title: "Meet your first Bot",
} as const

export const footerLinks = [
  { label: "Grok Bot", href: "https://x.ai/bot" },
  { label: "Guides", href: "https://x.ai/bot/guides" },
  { label: "Use cases", href: "https://x.ai/bot/use-cases" },
] as const

export const navLinks = [
  { label: "Works", href: "#works" },
  { label: "Connect", href: "#connect" },
  { label: "Jobs", href: "#jobs" },
  { label: "Guides", href: "#guides" },
] as const

export type Platform = "macos" | "ios"

export const downloadPlatforms = ["macos", "ios"] as const satisfies readonly Platform[]

export function platformLabel(platform: Platform): string {
  switch (platform) {
    case "macos":
      return "macOS Apple silicon"
    case "ios":
      return "iOS"
    default: {
      const unreachable: never = platform
      return unreachable
    }
  }
}

export function platformVariant(platform: Platform): "default" | "outline" {
  switch (platform) {
    case "macos":
      return "default"
    case "ios":
      return "outline"
    default: {
      const unreachable: never = platform
      return unreachable
    }
  }
}
