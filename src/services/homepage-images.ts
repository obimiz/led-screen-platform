import "server-only";
import { connectToDatabase } from "@/lib/db/mongoose";
import { BusinessSettingsModel } from "@/models/business-settings";
import {
  homepageImagesSchema,
  defaultHomepageImages,
} from "@/lib/validations/homepage-images";
export async function getHomepageImages() {
  await connectToDatabase();
  const settings = await BusinessSettingsModel.findOne({
    singletonKey: "primary",
  })
    .select("homepageImages")
    .lean();
  const parsed = homepageImagesSchema.safeParse(settings?.homepageImages || {});
  return parsed.success ? parsed.data : defaultHomepageImages;
}
