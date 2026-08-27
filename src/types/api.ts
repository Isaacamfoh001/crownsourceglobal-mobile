/**
 * Client-side DTOs mirroring the REAL `/api/v1` contracts exactly, hand-
 * written from ../crownsourceglobal/lib/api/dto/catalogue.ts and the route
 * handlers under ../crownsourceglobal/app/api/v1/**. Not generated, not
 * copied Prisma types, not reachable across the filesystem — this is the
 * one place the mobile app declares what it expects the backend to return.
 * If the backend changes a field, update it here.
 */

export type Money = {
  amount: string;
  currency: string;
};

export type CategoryDTO = {
  id: string;
  name: string;
  slug: string;
  parentCategoryId: string | null;
};

export type CategoryWithChildrenDTO = CategoryDTO & {
  children: CategoryDTO[];
};

export type AvailabilityStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "MADE_TO_ORDER";

export type ListingSummaryDTO = {
  id: string;
  title: string;
  price: Money;
  moq: number;
  availabilityStatus: AvailabilityStatus;
  hasBulkPricing: boolean;
  primaryImage: string | null;
  category: { id: string; name: string; slug: string };
  vendor: { id: string; companyName: string; storefrontSlug: string };
};

export type BulkPriceTierDTO = {
  id: string;
  minQuantity: number;
  maxQuantity: number | null;
  unitPrice: Money;
};

export type ListingDetailDTO = {
  id: string;
  title: string;
  description: string;
  images: string[];
  specs: Record<string, string> | null;
  price: Money;
  moq: number;
  maxOq: number | null;
  leadTimeDays: number | null;
  availableQuantity: number;
  availabilityStatus: AvailabilityStatus;
  category: {
    id: string;
    name: string;
    slug: string;
    parent: { id: string; name: string; slug: string } | null;
  };
  vendor: {
    id: string;
    companyName: string;
    storefrontSlug: string;
    description: string | null;
  };
  bulkPriceTiers: BulkPriceTierDTO[];
};

export type SellerType =
  | "INDIVIDUAL"
  | "SOLE_TRADER"
  | "REGISTERED_BUSINESS"
  | "DISTRIBUTOR_WHOLESALER"
  | "MANUFACTURER"
  | "ORGANIZATION";

export type VendorStorefrontDTO = {
  id: string;
  companyName: string;
  description: string | null;
  storefrontSlug: string;
  sellerType: SellerType | null;
  logoUrl: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  categorySlugs: string[];
  verificationStatus: "APPROVED";
};

export type Page<T> = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  rows: T[];
};

export type HomeResponseDTO = {
  categories: CategoryWithChildrenDTO[];
  featuredListings: ListingSummaryDTO[];
};

export type VendorStorefrontResponseDTO = {
  vendor: VendorStorefrontDTO;
  listings: Page<ListingSummaryDTO>;
};

export type CategoriesResponseDTO = {
  categories: CategoryWithChildrenDTO[];
};
