import {
  decodeConfig,
  formatConfigError,
  projectNameSchema,
  renderProject,
  zipFiles,
} from "@seedlayer/core";
import { loadCatalog } from "@seedlayer/packs";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("c");
  const name = url.searchParams.get("name") ?? "my-app";
  if (!code) return new Response("Missing config code.", { status: 400 });
  const parsedName = projectNameSchema.safeParse(name);
  if (!parsedName.success) return new Response("Invalid project name.", { status: 400 });
  try {
    const files = renderProject({
      config: decodeConfig(code),
      projectName: parsedName.data,
      catalog: loadCatalog(),
    });
    return new Response(new Uint8Array(zipFiles(files)), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${parsedName.data}.zip"`,
      },
    });
  } catch (error) {
    return new Response(formatConfigError(error), { status: 400 });
  }
}
