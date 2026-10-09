import "server-only";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { ClientOrganisation } from "@/models/client-organisation";
import {
  organisationSchema,
  type Organisation,
} from "@/lib/validations/organisation";
import { createSlug } from "@/lib/utils/slug";
import { SalesError } from "@/lib/sales/calculations";
export async function getOrganisations(
  publicOnly = false,
): Promise<Organisation[]> {
  await connectToDatabase();
  const rows = await ClientOrganisation.find(
    publicOnly ? { active: true, featured: true } : {},
  )
    .sort({ displayOrder: 1, name: 1 })
    .lean();
  return rows.map((r) => ({
    id: String(r._id),
    name: r.name,
    slug: r.slug,
    logoUrl: r.logoUrl ?? "",
    location: r.location ?? "",
    website: r.website ?? "",
    displayOrder: r.displayOrder,
    featured: r.featured,
    active: r.active,
  }));
}
export async function saveOrganisation(raw: unknown, id?: string) {
  const input = organisationSchema.parse(raw);
  await connectToDatabase();
  if (id) {
    if (!Types.ObjectId.isValid(id))
      throw new SalesError("Organisation not found", 404);
    const record = await ClientOrganisation.findByIdAndUpdate(
      id,
      { $set: input },
      { returnDocument: "after", runValidators: true },
    );
    if (!record) throw new SalesError("Organisation not found", 404);
    return { id: String(record._id) };
  }
  const slug = `${createSlug(input.name) || "organisation"}-${new Types.ObjectId()}`;
  const record = await ClientOrganisation.create({ ...input, slug });
  return { id: String(record._id) };
}
export async function deleteOrganisation(id: string) {
  if (!Types.ObjectId.isValid(id))
    throw new SalesError("Organisation not found", 404);
  await connectToDatabase();
  if (!(await ClientOrganisation.findByIdAndDelete(id)))
    throw new SalesError("Organisation not found", 404);
}
