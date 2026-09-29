import { NextResponse } from "next/server";

const STATUSES = ["completed", "pending", "refunded", "cancelled"] as const;
const REGIONS = ["North", "South", "East", "West"] as const;
const CUSTOMERS = [
  "Ada Lovelace",
  "Grace Hopper",
  "Alan Turing",
  "Katherine Johnson",
  "Linus Torvalds",
  "Margaret Hamilton",
] as const;

/**
 * Bundled sample endpoint so the connection wizard has something to talk to
 * without depending on an external service. Amounts drift on each call, and a
 * handful of order statuses advance so a 5-minute table refresh can highlight
 * those cells in place instead of looking like a full grid reload. Every order
 * carries an avatar URL so the image-aware card recommendation has something
 * to detect.
 */
export function GET() {
  const now = Date.now();
  const statusTick = Math.floor(now / 15_000);
  const orders = Array.from({ length: 24 }, (_, index) => {
    const date = new Date(now - index * 86_400_000 * 0.5);
    const customer = CUSTOMERS[index % CUSTOMERS.length];
    const amount = 90 + ((index * 37) % 220) + (now % 17);
    const statusIndex =
      index % 5 === 0
        ? (index + statusTick) % STATUSES.length
        : index % STATUSES.length;
    return {
      id: `ORD-${1000 + index}`,
      date: date.toISOString().slice(0, 10),
      customer,
      avatar: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(customer)}`,
      region: REGIONS[index % REGIONS.length],
      status: STATUSES[statusIndex],
      amount: Number(amount.toFixed(2)),
      items: 1 + (index % 5),
    };
  });

  const revenue = orders.reduce((total, order) => total + order.amount, 0);

  return NextResponse.json(
    {
      summary: {
        totalOrders: orders.length,
        revenue: Number(revenue.toFixed(2)),
        currency: "USD",
        conversionRate: 0.184,
        generatedAt: new Date(now).toISOString(),
      },
      orders,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
