import { z } from "zod";

const optionValue = z.union([z.string(), z.number(), z.boolean()]);

export const packOptionSchema = z
  .object({
    type: z.enum(["string", "number", "boolean"]),
    default: optionValue,
    from: z.string().optional(),
  })
  .strict()
  .superRefine((option, ctx) => {
    const actual = typeof option.default;
    if (actual !== option.type) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["default"],
        message: `Default must be a ${option.type}`,
      });
    }
  });

export const packOutputSchema = z
  .object({
    template: z.string().min(1),
    to: z.string().min(1),
    when: z.string().min(1).optional(),
  })
  .strict();

export const packManifestSchema = z
  .object({
    name: z.string().regex(/^[a-z0-9-]+$/),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    requires: z.array(z.string()).default([]),
    conflicts: z.array(z.string()).default([]),
    options: z.record(packOptionSchema).default({}),
    outputs: z.array(packOutputSchema).default([]),
    agentRules: z.array(z.string()).default([]),
  })
  .strict();

export type PackManifest = z.infer<typeof packManifestSchema>;
export type PackOption = z.infer<typeof packOptionSchema>;
export type PackOutput = z.infer<typeof packOutputSchema>;

export function parseManifest(input: unknown): PackManifest {
  return packManifestSchema.parse(input);
}
