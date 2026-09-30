"use client";

import type { WidgetConfig } from "@/lib/types";
import { CardsWidget } from "./cards-widget";
import { ChartWidget } from "./chart-widget";
import { KpiWidget } from "./kpi-widget";
import { TableWidget } from "./table-widget";

export function WidgetView({
  config,
  data,
}: {
  config: WidgetConfig;
  data: unknown;
}) {
  switch (config.kind) {
    case "table":
      return <TableWidget config={config} data={data} />;
    case "kpi":
      return <KpiWidget config={config} data={data} />;
    case "cards":
      return <CardsWidget config={config} data={data} />;
    case "chart":
      return <ChartWidget config={config} data={data} />;
    default: {
      const exhaustive: never = config;
      throw new Error(
        `Unsupported widget config: ${JSON.stringify(exhaustive)}`,
      );
    }
  }
}
