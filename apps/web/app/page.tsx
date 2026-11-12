import {
  decodeConfig,
  encodeConfig,
  formatConfigError,
  projectNameSchema,
  renderProject,
} from "@seedlayer/core";
import { listPresets, loadCatalog, loadPreset } from "@seedlayer/packs";
import { Configurator } from "@/components/configurator";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ c?: string; name?: string }>;
}) {
  const params = await searchParams;
  let error: string | null = null;
  let config = loadPreset("startup-speed");
  if (params.c) {
    try {
      config = decodeConfig(params.c);
    } catch (caught) {
      error = formatConfigError(caught);
    }
  }
  const name = projectNameSchema.safeParse(params.name ?? "my-app");
  const projectName = name.success ? name.data : "my-app";
  if (!name.success) error = "The name in the link was invalid. Showing my-app.";
  const files = renderProject({ config, projectName, catalog: loadCatalog() }).map((file) => ({
    path: file.path,
    contents: file.contents,
  }));

  return (
    <Configurator
      presets={listPresets()}
      initialConfig={config}
      initialCode={encodeConfig(config)}
      initialName={projectName}
      initialFiles={files}
      initialError={error}
    />
  );
}
