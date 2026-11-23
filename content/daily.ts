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
  updated: "2026-11-23T14:48:00+05:30",
  tip: "In Cursor, scope the chat with @folder so context is not spent on files you will not change.",
  model: {
    name: "Gemini 4 Hydrogen",
    price: "$1.50 / $7.50",
    why: "Already under Carbon's intro rate, and this price holds past Dec 1.",
  },
};
