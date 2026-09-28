import { NextResponse } from "next/server";

interface GraphqlBody {
  query?: unknown;
  variables?: unknown;
}

const PRODUCTS = [
  { sku: "KB-01", name: "Keyboard", category: "Peripherals", price: 89 },
  { sku: "MS-02", name: "Mouse", category: "Peripherals", price: 45 },
  { sku: "MN-27", name: "Monitor 27\"", category: "Displays", price: 329 },
  { sku: "MN-32", name: "Monitor 32\"", category: "Displays", price: 519 },
  { sku: "DK-04", name: "Dock", category: "Accessories", price: 149 },
  { sku: "HS-08", name: "Headset", category: "Audio", price: 119 },
];

/**
 * Minimal stand-in for a GraphQL service: it does not parse the query, it just
 * answers with a realistic `data` envelope so the explorer and widgets have a
 * GraphQL-shaped response to work with.
 */
export async function POST(request: Request) {
  let body: GraphqlBody = {};
  try {
    body = (await request.json()) as GraphqlBody;
  } catch {
    return NextResponse.json(
      { errors: [{ message: "Request body must be JSON." }] },
      { status: 400 },
    );
  }

  if (typeof body.query !== "string" || body.query.trim().length === 0) {
    return NextResponse.json(
      { errors: [{ message: "A GraphQL query is required." }] },
      { status: 400 },
    );
  }

  const variables =
    typeof body.variables === "object" && body.variables !== null
      ? (body.variables as Record<string, unknown>)
      : {};
  const limit =
    typeof variables.limit === "number" ? variables.limit : PRODUCTS.length;
  const now = Date.now();

  return NextResponse.json(
    {
      data: {
        catalog: {
          updatedAt: new Date(now).toISOString(),
          productCount: PRODUCTS.length,
          totalInventoryValue: PRODUCTS.reduce(
            (total, product) => total + product.price,
            0,
          ),
          products: PRODUCTS.slice(0, Math.max(1, limit)).map(
            (product, index) => ({
              ...product,
              unitsSold: 40 + ((index * 23 + now / 100_000) % 160),
              inStock: index % 4 !== 0,
            }),
          ),
        },
      },
    },
    { headers: { "cache-control": "no-store" } },
  );
}
