import type {
  QuoteRequestInput,
  QuotationInput,
} from "@/lib/validations/sales";
import type { enquiryStatuses, enquirySources } from "@/lib/sales/constants";
import type { QuotationStatus } from "@/lib/sales/calculations";
export type AdminOption = { id: string; name: string };
export type Enquiry = Omit<QuoteRequestInput, "eventDate"> & {
  id: string;
  referenceNumber: string;
  productId: string;
  productNameSnapshot: string;
  eventDate: string;
  source: (typeof enquirySources)[number];
  status: (typeof enquiryStatuses)[number];
  assignedTo: string;
  assignedName: string;
  adminNotes: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  version: number;
};
export type Quotation = Omit<QuotationInput, "items"> & {
  id: string;
  quotationNumber: string;
  items: Array<
    QuotationInput["items"][number] & {
      lineTotal: number;
      skuSnapshot: string;
      cataloguePriceSnapshot: number | null;
    }
  >;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  status: QuotationStatus;
  effectiveStatus: QuotationStatus;
  createdBy: string;
  updatedBy: string;
  createdByName: string;
  updatedByName: string;
  acceptedAt: string;
  rejectedAt: string;
  convertedToSaleAt: string;
  createdAt: string;
  updatedAt: string;
  version: number;
};
export type SalesList<T> = {
  records: T[];
  total: number;
  page: number;
  pages: number;
};
export type CatalogueOption = {
  id: string;
  name: string;
  description: string;
  sku: string;
  productType: import("@/lib/constants/products").ProductType;
  price: number | null;
  currency: string;
};
