import { z } from "zod";
const webUrl = z
  .string()
  .trim()
  .max(2000)
  .refine(
    (v) => !v || (/^https?:\/\//i.test(v) && URL.canParse(v)),
    "Use an http or https URL",
  );
export const organisationSchema = z
  .object({
    name: z.string().trim().min(2).max(180),
    logoUrl: z
      .string()
      .trim()
      .max(2000)
      .refine(
        (v) =>
          !v ||
          /^\/(?!\/)[^\\\s?#]+$/.test(v) ||
          (/^https?:\/\//i.test(v) && URL.canParse(v)),
        "Use a local /images/ path or http(s) URL",
      )
      .default(""),
    location: z.string().trim().max(180).default(""),
    website: webUrl.default(""),
    displayOrder: z.coerce.number().int().min(0).max(10000).default(0),
    featured: z.boolean().default(false),
    active: z.boolean().default(true),
  })
  .strict();
export type OrganisationValues = z.output<typeof organisationSchema>;
export type Organisation = OrganisationValues & { id: string; slug: string };
