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
  updated: "2026-11-25T10:38:00+05:30",
  tip: "In Agent mode, name the acceptance check in the prompt so the model verifies before it stops.",
  model: {
    name: "Gemini 4 Hydrogen",
    price: "$1.50 / $7.50",
    why: "Unchanged rate; only Gemini 4 model on Google's page with both free and paid tiers.",
  },
};
