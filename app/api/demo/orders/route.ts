import { NextResponse } from "next/server";

const STATUSES = ["completed", "pending", "refunded", "cancelled"] as const;
const REGIONS = ["North", "South", "East", "West"] as const;

/**
 * Bundled sample endpoint so the connection wizard has something to talk to
 * without depending on an external service. Values drift slightly on each call
 * so scheduled refresh is visible.
 */
export function GET() {
  const now = Date.now();
  const orders = Array.from({ length: 24 }, (_, index) => {
    const date = new Date(now - index * 86_400_000 * 0.5);
    const amount = 90 + ((index * 37) % 220) + (now % 17);
    return {
      id: `ORD-${1000 + index}`,
      date: date.toISOString().slice(0, 10),
      customer: `Customer ${String.fromCharCode(65 + (index % 12))}`,
      region: REGIONS[index % REGIONS.length],
      status: STATUSES[index % STATUSES.length],
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
