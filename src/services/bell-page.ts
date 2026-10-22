import "server-only";
import { connectToDatabase } from "@/lib/db/mongoose";
import { BusinessSettingsModel } from "@/models/business-settings";
import { bellPageSchema, defaultBellPage } from "@/lib/validations/bell-page";
export async function getBellPage(draft = false) {
  await connectToDatabase();
  const settings = await BusinessSettingsModel.findOne({
    singletonKey: "primary",
  })
    .select("bellPageDraft bellPagePublished")
    .lean();
  const published = bellPageSchema.safeParse(settings?.bellPagePublished);
  const live = published.success ? published.data : defaultBellPage;
  if (!draft) return live;
  const pending = bellPageSchema.safeParse(settings?.bellPageDraft);
  return pending.success ? pending.data : live;
}
