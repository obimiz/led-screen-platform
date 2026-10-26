import type { LedProduct } from "@/types/product";

export function getLedHeadlineSpecs(
  product: Pick<LedProduct, "indoorOutdoor" | "pixelPitch">,
): [label: string, value: string][] {
  const environment = product.indoorOutdoor?.trim();
  const pixelPitch = product.pixelPitch?.trim();
  const specs: [label: string, value: string][] = [];

  if (environment && environment !== "not-specified")
    specs.push([
      "Environment",
      environment[0].toUpperCase() + environment.slice(1),
    ]);
  if (pixelPitch) specs.push(["Pixel Pitch", pixelPitch]);

  return specs;
}
