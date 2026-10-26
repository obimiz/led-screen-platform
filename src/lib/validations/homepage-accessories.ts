import { z } from "zod";
import { defaultHomepageAccessorySettings } from "@/lib/constants/homepage-accessories";
import {
  defaultHomepageServicesSettings,
  defaultHomepageHeroSettings,
} from "@/lib/constants/homepage";

const sectionCopy = (
  defaults: { heading: string; description: string },
  label: string,
) =>
  z
    .object({
      heading: z
        .string()
        .trim()
        .min(1, `${label} heading is required`)
        .max(160)
        .default(defaults.heading),
      description: z
        .string()
        .trim()
        .min(1, `${label} description is required`)
        .max(2000)
        .default(defaults.description),
    })
    .strict();

export const homepageAccessorySettingsSchema = sectionCopy(
  defaultHomepageAccessorySettings,
  "Accessories",
);
export const homepageHeroSettingsSchema = sectionCopy(
  defaultHomepageHeroSettings,
  "Hero",
).extend({
  headingTwo: z.string().trim().max(160).default(""),
});
export type HomepageAccessorySettings = z.output<
  typeof homepageAccessorySettingsSchema
>;
export type HomepageHeroSettings = z.output<typeof homepageHeroSettingsSchema>;

const internalLink = z
  .string()
  .trim()
  .max(300)
  .regex(/^\/(?![\/\\])[^\s\\]*$/, "Use a local path beginning with /");
export const homepageServicesSettingsSchema = sectionCopy(
  defaultHomepageServicesSettings,
  "Services",
).extend({
  buttonLabel: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .default(defaultHomepageServicesSettings.buttonLabel),
  buttonHref: internalLink.default(defaultHomepageServicesSettings.buttonHref),
  items: z
    .array(
      z
        .object({
          title: z.string().trim().min(1).max(160),
          description: z.string().trim().min(1).max(2000),
          href: internalLink,
        })
        .strict(),
    )
    .length(4)
    .default(defaultHomepageServicesSettings.items),
});
export type HomepageServicesSettings = z.output<
  typeof homepageServicesSettingsSchema
>;
