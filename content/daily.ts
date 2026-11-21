type Daily = {
  updated: string;
  tip: string;
  model: {
    name: string;
    price: string;
    why: string;
  };
};

export const daily: Daily = {
  updated: "2026-11-21T11:35:00+05:30",
  tip: "Thinking tokens are billed as output. A long chain of thought can cost more than the reply.",
  model: {
    name: "Gemini 4 Neon",
    price: "$3 / $15",
    why: "near-Carbon quality at Flash speed.",
  },
};
