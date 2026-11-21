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
  tip: "Change this file, then commit. The page is that commit — it will not refresh itself.",
  model: {
    name: "Claude Sonnet",
    price: "$3 / MTok in · $15 / MTok out",
    why: "A steady default for a small daily edit.",
  },
};
