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
  updated: "2026-11-24T12:42:00+05:30",
  tip: "Use @Git in Cursor to ground the chat in your diff instead of pasting hunks by hand.",
  model: {
    name: "Gemini 4 Hydrogen",
    price: "$1.50 / $7.50",
    why: "Free tier plus paid rate unchanged — best Gemini 4 bang per token today.",
  },
};
