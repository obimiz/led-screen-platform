import { revalidatePath } from "next/cache";
import { portfolioMutation } from "@/lib/portfolio/access";
import { salesBody } from "@/lib/sales/api";
import { homepageImagesSchema } from "@/lib/validations/homepage-images";
import { validateImageReferences } from "@/lib/media/validate-references";
import { connectToDatabase } from "@/lib/db/mongoose";
import { BusinessSettingsModel } from "@/models/business-settings";
export async function PUT(request: Request) {
  return portfolioMutation(request, async (admin) => {
    const input = homepageImagesSchema.parse(await salesBody(request));
    await connectToDatabase();
    try {
      await validateImageReferences([input.bellImageUrl, input.cameraImageUrl]);
    } catch {
      return Response.json(
        { message: "Choose existing images or upload them again." },
        { status: 400 },
      );
    }
    await BusinessSettingsModel.findOneAndUpdate(
      { singletonKey: "primary" },
      {
        $set: { homepageImages: input, updatedBy: admin.id },
        $setOnInsert: { businessName: "Image Grant Technology" },
      },
      { upsert: true, runValidators: true },
    );
    revalidatePath("/");
    revalidatePath("/admin/settings/homepage");
    return Response.json({ message: "Homepage images saved." });
  });
}
