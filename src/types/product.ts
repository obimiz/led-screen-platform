import type { AccessoryValues, ProductValues } from "@/lib/validations/product";
import type { ProductType } from "@/lib/constants/products";

export type ProductCategoryDto = {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  active: boolean;
  sortOrder: number;
  productType: ProductType;
};
export type AccessoryProduct = Omit<AccessoryValues, "category"> & {
  id: string;
  slug: string;
  category: { id: string; name: string; slug: string };
  createdAt: string;
  updatedAt: string;
};
export type LedProduct = Omit<ProductValues, "category"> & {
  id: string;
  slug: string;
  productType: "led-screen";
  category: { id: string; name: string; slug: string };
  createdAt: string;
  updatedAt: string;
};
export type AccessoryListResult = {
  products: AccessoryProduct[];
  page: number;
  pages: number;
  total: number;
};
export type ProductListResult = {
  products: LedProduct[];
  page: number;
  pages: number;
  total: number;
};
