import { validateImageReferences } from "@/lib/media/validate-references";
import { revalidatePath } from "next/cache";
import { portfolioMutation } from "@/lib/portfolio/access";
import { salesBody } from "@/lib/sales/api";
import { z } from "zod";
import { bellPageSchema } from "@/lib/validations/bell-page";
import { BusinessSettingsModel } from "@/models/business-settings";
import { connectToDatabase } from "@/lib/db/mongoose";
export async function PUT(request: Request) {
  return portfolioMutation(request, async (admin) => {
    const input = z
      .object({ action: z.enum(["draft", "publish"]), content: bellPageSchema })
      .strict()
      .parse(await salesBody(request));
    await connectToDatabase();
    try {
      await validateImageReferences([
        input.content.heroImage,
        input.content.coverImageUrl,
        ...input.content.imageUrls,
      ]);
    } catch {
      return Response.json(
        { message: "Choose existing images or upload them again." },
        { status: 400 },
      );
    }
    await BusinessSettingsModel.findOneAndUpdate(
      { singletonKey: "primary" },
      {
        $set: {
          bellPageDraft: input.content,
          ...(input.action === "publish"
            ? { bellPagePublished: input.content }
            : {}),
          updatedBy: admin.id,
        },
        $setOnInsert: { businessName: "Image Grant Technology" },
      },
      { upsert: true, runValidators: true },
    );
    if (input.action === "publish") {
      revalidatePath("/electronic-bell-alarm");
      revalidatePath("/");
    }
    return Response.json({
      message:
        input.action === "publish"
          ? "Changes published."
          : "Draft saved. Published content is unchanged.",
    });
  });
}
