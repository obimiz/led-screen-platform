import { portfolioMutation } from "@/lib/portfolio/access";

// Keep stale admin forms from writing duplicate product content or modifying media.
export async function PUT(request: Request) {
  return portfolioMutation(request, async () =>
    Response.json(
      {
        message:
          "Homepage Bell and Camera content is managed through Product Management. Edit the published featured product instead.",
      },
      { status: 410 },
    ),
  );
}
