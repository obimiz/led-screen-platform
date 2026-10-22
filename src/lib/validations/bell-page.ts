import { z } from "zod";
import {
  safeImage,
  sanitizeRichContent,
  textDocument,
} from "@/lib/publishing/rich-content";
const image = z
  .string()
  .max(2000)
  .refine((v) => !v || safeImage(v), "Choose a valid image");
export const bellPageSchema = z
  .object({
    heading: z.string().trim().min(3).max(160),
    subtitle: z.string().trim().max(300),
    introduction: z.string().trim().min(20).max(3000),
    heroImage: image,
    heroAlt: z.string().max(300),
    sectionHeading: z.string().trim().min(3).max(160),
    showcaseText: z.string().max(2000),
    content: z.unknown().transform((v, ctx) => {
      try {
        return sanitizeRichContent(v);
      } catch {
        ctx.addIssue({ code: "custom", message: "Invalid rich text" });
        return z.NEVER;
      }
    }),
    coverImageUrl: image,
    coverAlt: z.string().max(300),
    imageUrls: z.array(image).max(40),
    imageAlts: z.array(z.string().max(300)).max(40),
    ctaText: z.string().trim().min(2).max(80),
    seoTitle: z.string().max(160),
    seoDescription: z.string().max(320),
  })
  .strict();
export type BellPageContent = z.output<typeof bellPageSchema>;
export const defaultBellPage: BellPageContent = {
  heading: "Clear, scheduled alerts for your organisation.",
  subtitle: "Electronic Bell & Alarm",
  introduction:
    "Plan programmable bell and alarm systems for schools, churches, offices, factories, estates and institutions. We can help with equipment selection, installation, configuration and support.",
  heroImage: "",
  heroAlt: "",
  sectionHeading: "Built for clear, dependable alerts",
  showcaseText: "Explore our published electronic bell and alarm systems.",
  content: textDocument(
    "Discuss schedules, operating modes, installation and support with our team.",
  ),
  coverImageUrl: "",
  coverAlt: "",
  imageUrls: [],
  imageAlts: [],
  ctaText: "Request Quote",
  seoTitle: "",
  seoDescription: "",
};
