import { revalidatePath } from "next/cache";
import { portfolioMutation } from "@/lib/portfolio/access";
import { salesBody } from "@/lib/sales/api";
import { connectToDatabase } from "@/lib/db/mongoose";
import { BusinessSettingsModel } from "@/models/business-settings";
import {
  homepageServicesSettingsSchema,
  homepageAccessorySettingsSchema,
  homepageHeroSettingsSchema,
} from "@/lib/validations/homepage-accessories";

async function saveCopy(
  request: Request,
  section: "homepageAccessories" | "homepageHero" | "homepageServices",
) {
  return portfolioMutation(request, async (admin) => {
    const schema =
      section === "homepageServices"
        ? homepageServicesSettingsSchema
        : section === "homepageHero"
          ? homepageHeroSettingsSchema
          : homepageAccessorySettingsSchema;
    const input = schema.parse(await salesBody(request));
    await connectToDatabase();
    const saved = await BusinessSettingsModel.findOneAndUpdate(
      { singletonKey: "primary" },
      {
        $set: {
          ...Object.fromEntries(
            Object.entries(input).map(([key, value]) => [
              `${section}.${key}`,
              value,
            ]),
          ),
          updatedBy: admin.id,
        },
        $setOnInsert: { businessName: "Image Grant Technology" },
      },
      { upsert: true, runValidators: true, returnDocument: "after" },
    ).lean();
    const persisted = schema.safeParse(
      Object.fromEntries(
        Object.keys(input).map((key) => [
          key,
          Reflect.get(saved?.[section] ?? {}, key),
        ]),
      ),
    );
    if (
      !persisted.success ||
      !Object.entries(input).every(
        ([key, value]) =>
          JSON.stringify(Reflect.get(saved?.[section] ?? {}, key)) ===
          JSON.stringify(value),
      )
    )
      return Response.json(
        {
          message:
            "The homepage changes were not saved. Reload this page and try again.",
        },
        { status: 500 },
      );
    revalidatePath("/");
    revalidatePath("/admin/settings/homepage");
    return Response.json({
      data: persisted.data,
      message:
        section === "homepageServices"
          ? "Services homepage section saved."
          : section === "homepageHero"
            ? "Homepage hero saved."
            : "Accessories homepage section saved.",
    });
  });
}

export async function PUT(request: Request) {
  return saveCopy(request, "homepageAccessories");
}
export async function PATCH(request: Request) {
  return saveCopy(request, "homepageHero");
}

export async function POST(request: Request) {
  return saveCopy(request, "homepageServices");
}
