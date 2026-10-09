import { buildPageMetadata, listingSeo, type SearchValues } from "./metadata";
import { getPublicBusinessSettings } from "@/services/business-settings";

export const publicPages = {
  "/": [
    "LED screen sales, rental and support",
    "Explore LED screens, accessories, rental, installation and maintenance services, plus electronic bell systems and curated Christian music.",
  ],
  "/about": [
    "About us",
    "Learn about our LED display solutions, project support and related technology services.",
  ],
  "/contact": [
    "Contact us",
    "Contact our team about LED sales, rentals, installation, maintenance, accessories and electronic bell systems.",
  ],
  "/services": [
    "LED and technology services",
    "Explore LED screen sales, rental, installation, maintenance and electronic bell system services.",
  ],
  "/led-screens": [
    "LED screens",
    "Compare indoor and outdoor LED displays, review specifications and enquire about a screen for your project.",
  ],
  "/led-accessories": [
    "LED accessories and spare parts",
    "Browse LED modules, controllers, power supplies, receiving cards, cables and replacement parts.",
  ],
  "/rent-led-screen": [
    "LED screen rental",
    "Plan a temporary LED display for your event. Discuss dates, screen size, setup and equipment availability.",
  ],
  "/led-installation": [
    "LED screen installation",
    "Arrange a site assessment, equipment selection, installation and commissioning for a permanent LED display.",
  ],
  "/led-maintenance": [
    "LED maintenance and repairs",
    "Request LED screen fault diagnosis, repairs or preventive servicing for your existing display.",
  ],
  "/electronic-bell-alarm": [
    "Electronic bell and alarm systems",
    "Explore programmable bell systems and enquire about equipment selection, installation and support.",
  ],
  "/electronic-bell-alarm/products": [
    "Electronic bell and alarm products",
    "Browse published electronic bell systems and enquire about a suitable configuration for your organisation.",
  ],
  "/electronic-bell-alarm/accessories": [
    "Bell and alarm accessories",
    "Explore accessories for electronic bell systems and contact us to confirm equipment compatibility.",
  ],
  "/music": [
    "Christian and Catholic music",
    "Discover curated songs, hymns, worship and reflection with listening links to external music providers.",
  ],
  "/music/browse": [
    "Browse music and audio",
    "Browse published music and audio by title and artist, with listening available through linked providers.",
  ],
  "/music/artists": [
    "Music artists",
    "Explore published artist profiles and their associated music and audio selections.",
  ],
  "/projects": [
    "Projects and portfolio",
    "Explore published LED display, event and technology projects, including their challenges, solutions and outcomes.",
  ],
  "/gallery": [
    "Project and event gallery",
    "View photographs and videos of installations, events, products and service work.",
  ],
  "/testimonials": [
    "Customer testimonials",
    "Read customer feedback shared with permission about our products, projects and services.",
  ],
  "/request-quote": [
    "Request a quotation",
    "Tell us about your LED screen or accessory requirements and request a quotation for your project.",
  ],
} as const;
export type PublicPagePath = keyof typeof publicPages;
export async function staticPageMetadata(
  path: PublicPagePath,
  search: SearchValues = {},
) {
  const business = await getPublicBusinessSettings();
  const [title, description] = publicPages[path];
  const control = listingSeo(search);
  const meta = buildPageMetadata(
    {
      path,
      title: path === "/" ? business.seoDefaultTitle || title : title,
      description:
        path === "/"
          ? business.seoDefaultDescription ||
            business.description ||
            description
          : description,
      ...control,
    },
    business,
  );
  return meta;
}
