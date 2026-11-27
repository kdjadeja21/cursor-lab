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
  updated: "2026-11-27T22:22:00+05:30",
  tip: "Pin your build or lint command in .cursor/rules so every Agent run uses the same verification steps.",
  model: {
    name: "Gemini 4 Hydrogen",
    price: "$1.50 / $7.50",
    why: "Still $1.50/$7.50; Carbon jumps Dec 1, but Hydrogen holds this rate.",
  },
};
