"use server";

import {
  encodeConfig,
  formatConfigError,
  parseConfig,
  projectNameSchema,
  renderProject,
} from "@seedlayer/core";
import { loadCatalog } from "@seedlayer/packs";
import type { PreviewFile } from "@/lib/types";

export async function renderPreview(
  raw: unknown,
  projectName: string,
): Promise<{ ok: true; code: string; files: PreviewFile[] } | { ok: false; error: string }> {
  const name = projectNameSchema.safeParse(projectName);
  if (!name.success) {
    return { ok: false, error: "Use a lowercase project name such as my-app." };
  }
  try {
    const config = parseConfig(raw);
    const files = renderProject({
      config,
      projectName: name.data,
      catalog: loadCatalog(),
    }).map((file) => ({ path: file.path, contents: file.contents }));
    return { ok: true, code: encodeConfig(config), files };
  } catch (error) {
    return { ok: false, error: formatConfigError(error) };
  }
}
