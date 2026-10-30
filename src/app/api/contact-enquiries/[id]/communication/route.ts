import { apiSuccess, apiNotFound } from "@/lib/api/responses";
import { salesApi, salesBody } from "@/lib/sales/api";
import { addCommunicationLog } from "@/services/contact-enquiries";
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return salesApi(async (admin) => {
    const d = await addCommunicationLog(
      (await params).id,
      await salesBody(req),
      admin.id,
    );
    return d ? apiSuccess("Communication logged", d) : apiNotFound();
  });
}
