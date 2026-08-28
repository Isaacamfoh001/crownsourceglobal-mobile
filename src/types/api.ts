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

export type VendorMembershipDTO = {
  vendorId: string;
  role: string;
  companyName: string;
  verificationStatus: string;
};

export type VendorApplicationStatus = "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "CHANGES_REQUESTED";

/** Mirrors ../crownsourceglobal/app/api/v1/me/route.ts exactly — see src/types/api.ts's file header. */
export type MeResponseDTO = {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
  };
  customer: { id: string } | null;
  vendor: {
    available: boolean;
    memberships: VendorMembershipDTO[];
  };
  vendorApplication: { id: string; status: VendorApplicationStatus } | null;
};

// --- Explore (M21) — mirrors lib/api/dto/explore-posts.ts exactly --------

export type ExploreCategoryDTO = { id: string; name: string; slug: string };

export type ExplorePostDTO = {
  id: string;
  caption: string;
  images: string[];
  category: ExploreCategoryDTO;
  location: string | null;
  createdAt: string;
  publisher: {
    id: string;
    name: string;
    avatarUrl: string | null;
    storefrontSlug: string;
  };
  engagement: {
    likedByMe: boolean;
    savedByMe: boolean;
    likeCount: number;
  };
};

/** The public feed/saved-list envelope — `GET /api/v1/explore-posts` and `GET /api/v1/explore-posts/saved` — cursor-paginated, not the page-number `Page<T>` shape above (see app/api/v1/explore-posts/route.ts's doc comment for why). */
export type ExplorePostFeedDTO = {
  rows: ExplorePostDTO[];
  nextCursor: string | null;
};

export type MyExplorePostDTO = {
  id: string;
  caption: string;
  images: string[];
  approvalStatus: "PENDING" | "APPROVED" | "CHANGES_REQUESTED" | "REJECTED";
  visibility: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  hasPendingChanges: boolean;
  changesRequestedReason: string | null;
  createdAt: string;
  updatedAt: string;
};

// --- Beauty Services (M22) — mirrors lib/api/dto/beauty-professionals.ts and lib/api/dto/service-requests.ts exactly --------

export type ServiceLocationMode = "PROVIDER_LOCATION" | "CUSTOMER_LOCATION" | "BOTH";

export type BeautyProfessionalSummaryDTO = {
  id: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  heroImageUrl: string | null;
  location: string | null;
  specialties: ExploreCategoryDTO[];
  fromPrice: Money | null;
  createdAt: string;
};

export type BeautyServiceDTO = {
  id: string;
  name: string;
  description: string | null;
  startingPrice: Money | null;
  category: ExploreCategoryDTO;
};

export type PortfolioItemDTO = { id: string; caption: string; images: string[] };

export type BeautyProfessionalDetailDTO = BeautyProfessionalSummaryDTO & {
  locationMode: ServiceLocationMode;
  services: BeautyServiceDTO[];
  portfolio: PortfolioItemDTO[];
};

/** The public discovery feed envelope — `GET /api/v1/beauty-professionals` — same cursor shape as ExplorePostFeedDTO. */
export type BeautyProfessionalFeedDTO = {
  rows: BeautyProfessionalSummaryDTO[];
  nextCursor: string | null;
};

export type ServiceRequestStatus = "SUBMITTED" | "PROVIDER_ACCEPTED" | "PROVIDER_DECLINED" | "CANCELLED";

export type ServiceRequestDTO = {
  id: string;
  status: ServiceRequestStatus;
  preferredDate: string;
  preferredTimeNote: string | null;
  locationMode: "PROVIDER_LOCATION" | "CUSTOMER_LOCATION";
  locationDetails: string | null;
  notes: string | null;
  quantity: number;
  referenceImage: string | null;
  declineReason: string | null;
  createdAt: string;
  updatedAt: string;
  professional: { id: string; name: string };
  service: { id: string; name: string };
};
