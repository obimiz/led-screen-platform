import { z } from "zod";
import { safeImage } from "@/lib/publishing/rich-content";
const image = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => !v || safeImage(v), "Choose a valid image")
  .default("");
export const homepageImagesSchema = z
  .object({
    bellImageUrl: image,
    bellImageAlt: z.string().trim().max(300).default(""),
    cameraImageUrl: image,
    cameraImageAlt: z.string().trim().max(300).default(""),
  })
  .strict();
export type HomepageImages = z.output<typeof homepageImagesSchema>;
export const defaultHomepageImages: HomepageImages = homepageImagesSchema.parse(
  {},
);
