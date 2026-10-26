import "server-only";
import { connectToDatabase } from "@/lib/db/mongoose";
import { BusinessSettingsModel } from "@/models/business-settings";
import { defaultHomepageAccessorySettings } from "@/lib/constants/homepage-accessories";
import {
  defaultHomepageServicesSettings,
  defaultHomepageHeroSettings,
} from "@/lib/constants/homepage";
import {
  homepageServicesSettingsSchema,
  homepageAccessorySettingsSchema,
  homepageHeroSettingsSchema,
} from "@/lib/validations/homepage-accessories";

export async function getHomepageTextSettings() {
  await connectToDatabase();
  const settings = await BusinessSettingsModel.findOne({
    singletonKey: "primary",
  })
    .select("homepageAccessories homepageHero homepageServices")
    .lean();
  const accessories = homepageAccessorySettingsSchema.safeParse(
    settings?.homepageAccessories || {},
  );
  const hero = homepageHeroSettingsSchema.safeParse({
    heading: settings?.homepageHero?.heading,
    headingTwo: settings?.homepageHero?.headingTwo,
    description: settings?.homepageHero?.description,
  });
  const services = homepageServicesSettingsSchema.safeParse(
    settings?.homepageServices
      ? {
          heading: settings.homepageServices.heading,
          description: settings.homepageServices.description,
          buttonLabel: settings.homepageServices.buttonLabel,
          buttonHref: settings.homepageServices.buttonHref,
          items: settings.homepageServices.items,
        }
      : {},
  );
  return {
    services: services.success
      ? services.data
      : defaultHomepageServicesSettings,
    accessories: accessories.success
      ? accessories.data
      : defaultHomepageAccessorySettings,
    hero: hero.success ? hero.data : defaultHomepageHeroSettings,
  };
}
