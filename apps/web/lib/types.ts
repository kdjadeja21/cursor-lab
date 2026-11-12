import type { SeedlayerConfig } from "@seedlayer/core";

export type PreviewFile = { path: string; contents: string };

export type PresetOption = { id: string; config: SeedlayerConfig };
