export const navLinks = [
  { label: "Product", href: "#features" },
  { label: "Use cases", href: "#use-cases" },
  { label: "Integrations", href: "#integrations" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export const logos = ["Northwind", "Acme", "Globex", "Initech", "Umbrella", "Hooli", "Stark", "Wayne"];

export const stats = [
  { value: 2400000, suffix: "+", label: "People scheduling" },
  { value: 38, suffix: "M", label: "Meetings booked" },
  { value: 99.99, suffix: "%", label: "Uptime, last 12 months", decimals: 2 },
  { value: 65, suffix: "+", label: "Languages supported" },
];

export const steps = [
  { title: "Connect your calendar", body: "We cross-check every calendar you connect, so double bookings never happen." },
  { title: "Set your availability", body: "Block weekends, add buffers, cap daily meetings. Your time, your rules." },
  { title: "Choose how to meet", body: "Video call, phone, in person, or a walk in the park. Bookers pick what suits them." },
];

export const useCases = [
  {
    id: "sales",
    label: "Sales",
    title: "Route leads to the right rep, instantly",
    body: "Qualify with a short form, then round-robin or route by territory and book the call before the lead goes cold.",
    points: ["Attribute-based routing", "Round-robin and fairness", "CRM sync on every booking"],
  },
  {
    id: "healthcare",
    label: "Healthcare",
    title: "Patient scheduling, privacy first",
    body: "Encrypted storage, audit trails and consent-aware reminders keep sensitive appointments protected.",
    points: ["HIPAA-ready controls", "SMS and email reminders", "Reschedule without a phone call"],
  },
  {
    id: "support",
    label: "Support",
    title: "Fair distribution, shorter queues",
    body: "Spread sessions across your team by load and skill so customers never wait on a busy agent.",
    points: ["Load-based assignment", "Instant meetings", "Shared team availability"],
  },
  {
    id: "education",
    label: "Education",
    title: "Office hours and tutoring, sorted",
    body: "Recurring sessions, group events and paid slots make running a class schedule painless.",
    points: ["Recurring events", "Group bookings", "Accept payments"],
  },
];

export const integrations = [
  "Google Calendar", "Outlook", "Zoom", "Google Meet", "Teams", "Slack", "Stripe", "Salesforce",
  "HubSpot", "Notion", "Zapier", "Webhooks", "Apple Calendar", "Typeform",
];

export const plans = [
  {
    name: "Free",
    monthly: 0,
    annual: 0,
    blurb: "For individuals getting started.",
    features: ["Unlimited event types", "Calendar sync", "Stripe payments", "Built-in video"],
    cta: "Start for free",
  },
  {
    name: "Teams",
    monthly: 16,
    annual: 13,
    blurb: "For small teams that share the load.",
    features: ["Round-robin scheduling", "Shared availability", "Team workflows", "Collective events"],
    cta: "Start team trial",
    featured: true,
  },
  {
    name: "Organization",
    monthly: 37,
    annual: 30,
    blurb: "For companies that need control.",
    features: ["Org-wide admin", "SSO and SCIM", "Attribute routing", "Insights"],
    cta: "Start organization trial",
  },
  {
    name: "Enterprise",
    monthly: null,
    annual: null,
    blurb: "For regulated, large-scale needs.",
    features: ["Dedicated database", "Priority support", "Custom SLA", "Security review"],
    cta: "Talk to sales",
  },
];

export const comparison = [
  { feature: "Free plan with unlimited event types", us: true, them: false },
  { feature: "Open source and self-hostable", us: true, them: false },
  { feature: "Built-in video conferencing", us: true, them: false },
  { feature: "Workflow automations on free", us: true, them: false },
  { feature: "Embeds and developer API", us: true, them: true },
];

export const testimonials = [
  { quote: "More elegant than the alternatives and far more open. It just works and feels right.", name: "Maya Lindqvist", role: "Product Marketing, Lumen" },
  { quote: "We moved 400 reps over in a weekend. Routing alone paid for the switch.", name: "Daniel Okafor", role: "VP Sales, Brightwave" },
  { quote: "The easiest meeting I have ever scheduled. My clients said so unprompted.", name: "Priya Raman", role: "Founder, Tallyho" },
  { quote: "Finally a scheduler I can embed and theme to match our product.", name: "Tom Becker", role: "CTO, Fieldnote" },
  { quote: "No-shows dropped by a third after we turned on reminders.", name: "Elena Rossi", role: "Operations, Clinica" },
  { quote: "Privacy was non-negotiable for us. Slotly checked every box.", name: "Marcus Webb", role: "CEO, Navia Health" },
  { quote: "Setup took ten minutes. I have not touched it since, and it keeps working.", name: "Aiko Tanaka", role: "Designer, Freelance" },
  { quote: "Our support team finally has fair, balanced calendars.", name: "Sofia Alvarez", role: "Head of Support, Cobalt" },
  { quote: "Self-hosting it gave our security team the control they needed.", name: "Jonas Keller", role: "Platform Lead, Ostrava" },
];

export const faqs = [
  { q: "Is it really free?", a: "Yes. Individuals get unlimited event types, calendar sync, payments and video for free, forever." },
  { q: "How does it avoid double bookings?", a: "Slotly checks every connected calendar in real time before showing a slot, and again at the moment of booking." },
  { q: "Can my team share availability?", a: "Teams can use round-robin, collective and managed events with shared availability and fair distribution." },
  { q: "Is it secure enough for healthcare or finance?", a: "We offer encrypted storage, SOC 2 aligned controls, audit logs and an option to self-host or use a dedicated database." },
  { q: "Can I embed it in my product?", a: "Yes. Use the inline, pop-up or floating embed, or build fully custom flows with our API and React components." },
  { q: "What if I want to leave?", a: "Export your data any time. Because the core is open source you are never locked in." },
];

export const footerColumns = [
  { title: "Product", links: ["Scheduling", "Routing", "Workflows", "Embed", "Mobile app"] },
  { title: "Use cases", links: ["Sales", "Support", "Healthcare", "Education", "Recruiting"] },
  { title: "Developers", links: ["Docs", "API", "Self-hosting", "GitHub", "Changelog"] },
  { title: "Company", links: ["About", "Blog", "Jobs", "Security", "Privacy"] },
];
