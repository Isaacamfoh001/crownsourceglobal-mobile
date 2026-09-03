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

// --- Sourcing / Quotations (M24) --------------------------------------

export type SourcingRequestStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "SOURCING"
  | "AWAITING_CUSTOMER"
  | "QUOTED"
  | "ACCEPTED"
  | "UNABLE_TO_SOURCE"
  | "CANCELLED";

export type QuotationRefDTO = {
  id: string;
  reference: string;
  status: string;
  total: number;
  currency: string;
  issuedAt: string;
};

/** `GET /api/v1/sourcing-requests` row — mirrors lib/api/dto/sourcing.ts's toSourcingRequestSummaryDTO exactly. */
export type SourcingRequestSummaryDTO = {
  id: string;
  requestNumber: string;
  title: string;
  quantity: number;
  quantityUnit: string | null;
  status: SourcingRequestStatus;
  statusLabel: string;
  submittedAt: string;
  hasQuotation: boolean;
  /** Absolute, session-authenticated URL — only present when the first attachment is an image (see attachmentImageSource.ts for how to fetch it). */
  thumbnail: string | null;
};

export type SourcingRequestAttachmentDTO = {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  isImage: boolean;
  /** Session-authenticated — see attachmentImageSource.ts. */
  url: string;
};

/** `GET /api/v1/sourcing-requests/:id` — mirrors toSourcingRequestDetailDTO exactly. */
export type SourcingRequestDetailDTO = {
  id: string;
  requestNumber: string;
  status: SourcingRequestStatus;
  statusLabel: string;
  title: string;
  description: string;
  quantity: number;
  quantityUnit: string | null;
  specifications: Record<string, string> | null;
  requiredByDate: string | null;
  deliveryCountry: string;
  deliveryRegion: string | null;
  deliveryCity: string | null;
  budgetAmount: number | null;
  budgetCurrency: string | null;
  unableToSourceReason: string | null;
  submittedAt: string;
  attachments: SourcingRequestAttachmentDTO[];
  latestQuotation: QuotationRefDTO | null;
};

export type SourcingSolicitationStatus = "SENT" | "RESPONDED" | "CANNOT_FULFIL";

/**
 * `GET /api/v1/vendor/sourcing-requests` row (M25.2 API, M29.1 mobile UI) —
 * mirrors toVendorSolicitationSummaryDTO exactly. Never carries customer
 * identity/contact.
 */
export type VendorSolicitationSummaryDTO = {
  id: string;
  status: SourcingSolicitationStatus;
  sentAt: string;
  requestReference: string;
  requestTitle: string;
  quantity: number;
  quantityUnit: string | null;
};

/** `GET /api/v1/vendor/sourcing-requests/:id` — mirrors toVendorSolicitationDetailDTO exactly. */
export type VendorSolicitationDetailDTO = {
  id: string;
  status: SourcingSolicitationStatus;
  sentAt: string;
  respondedAt: string | null;
  requestReference: string;
  title: string;
  description: string;
  quantity: number;
  quantityUnit: string | null;
  specifications: Record<string, string> | null;
  deliveryCountry: string;
  deliveryRegion: string | null;
  deliveryCity: string | null;
  requiredByDate: string | null;
  attachments: SourcingRequestAttachmentDTO[];
  response: {
    proposedQuantity: number | null;
    unitPrice: Money | null;
    leadTimeDays: number | null;
    notes: string | null;
  } | null;
};

export type QuotationEffectiveStatus = "ISSUED" | "ACCEPTED" | "EXPIRED";

/** `GET /api/v1/quotations` row — mirrors toQuotationSummaryDTO exactly. */
export type QuotationSummaryDTO = {
  id: string;
  reference: string;
  issuedAt: string;
  expiresAt: string;
  status: QuotationEffectiveStatus;
  total: number;
  currency: string;
  itemCount: number;
};

export type QuotationLineItemDTO = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  vendor: { companyName: string; storefrontSlug: string } | null;
};

/** `GET /api/v1/quotations/:id` — mirrors toQuotationDetailDTO exactly. Never carries vendorPayableBasis (admin-only). */
export type QuotationDetailDTO = {
  id: string;
  reference: string;
  issuedAt: string;
  expiresAt: string;
  acceptedAt: string | null;
  status: QuotationEffectiveStatus;
  currency: string;
  subtotal: number;
  total: number;
  items: QuotationLineItemDTO[];
  acceptedOrderId: string | null;
};

/** `POST /api/v1/quotations/:id/accept` body — mirrors lib/delivery-schema.ts's deliverySchema exactly. `region` must be one of constants/ghanaRegions.ts's GHANA_REGIONS. */
export type DeliveryInfoInput = {
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  region: string;
  notes?: string;
  saveAddress?: boolean;
};

/**
 * `GET /api/v1/orders/:id` (M24) — deliberately minimal subset, still
 * returned (as a subset of OrderDetailDTO below) by the same route the M26
 * full detail now serves — the checkout confirmation/payment screens only
 * ever read these fields, so they keep working unchanged.
 */
export type OrderSummaryDTO = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  currency: string;
  createdAt: string;
};

export type OrderDisplayStatus =
  | "ORDER_CONFIRMED"
  | "PREPARING"
  | "COLLECTED"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "ISSUE_UNDER_REVIEW"
  | "RETURN_IN_PROGRESS"
  | "REFUND_PROCESSING"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED"
  | "REPLACEMENT_IN_PROGRESS"
  | "CANCELLED";

/** `GET /api/v1/orders` row (M26) — mirrors toOrderListItemDTO exactly. */
export type OrderListItemDTO = {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  displayStatus: OrderDisplayStatus;
  displayStatusLabel: string;
  total: number;
  currency: string;
  itemCount: number;
  vendorCount: number;
  thumbnailUrl: string | null;
};

export type OrderLineItemDTO = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  vendor: { companyName: string; storefrontSlug: string } | null;
  imageUrl: string | null;
};

export type OrderVendorGroupDTO = {
  vendorName: string;
  subtotal: number;
  items: OrderLineItemDTO[];
};

export type OrderPackageDTO = {
  fulfilmentId: string;
  vendorName: string;
  status: OrderDisplayStatus;
  statusLabel: string;
};

export type OrderTrackingStepDTO = {
  key: string;
  label: string;
  done: boolean;
  current: boolean;
  at: string | null;
};

export type OrderPackageTrackingDTO = {
  fulfilmentId: string;
  vendorName: string;
  items: { id: string; description: string; quantity: number }[];
  steps: OrderTrackingStepDTO[];
  hasIssue: boolean;
  customerConfirmedReceiptAt: string | null;
  carrier: string | null;
  trackingReference: string | null;
};

export type OrderCaseSummaryDTO = {
  id: string;
  caseNumber: string;
  status: string;
  statusLabel: string;
  issueType: string;
  createdAt: string;
};

export type DeliveryInfoDTO = {
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  region: string;
  notes?: string;
};

/**
 * `GET /api/v1/orders/:id` full detail (M26) — mirrors toOrderDetailDTO
 * exactly, plus the `tracking`/`cases` fields the route composes alongside
 * it. Superset of OrderSummaryDTO above.
 */
export type OrderDetailDTO = {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  total: number;
  currency: string;
  deliveryInfo: DeliveryInfoDTO;
  displayStatus: OrderDisplayStatus;
  displayStatusLabel: string;
  vendorGroups: OrderVendorGroupDTO[];
  packages: OrderPackageDTO[];
  latestPaymentStatus: string | null;
  latestPayment: {
    reference: string;
    provider: string;
    method: string;
    network: string | null;
    phoneMasked: string | null;
    cardDisplay: { brand: string; last4: string } | null;
    amount: number;
    currency: string;
    initiatedAt: string;
  } | null;
  tracking: OrderPackageTrackingDTO[];
  cases: OrderCaseSummaryDTO[];
};

/** `GET /api/v1/resolutions/:id` (M26) — read-only case detail: what was reported, and the real refund/return/replacement outcome. Case CREATION from mobile is deliberately out of scope this milestone. */
export type ResolutionCaseDetailDTO = {
  id: string;
  caseNumber: string;
  status: string;
  statusLabel: string;
  issueType: string;
  orderId: string;
  orderNumber: string;
  createdAt: string;
  customerDescription: string;
  customerSafeDecisionReason: string | null;
  items: {
    id: string;
    description: string;
    quantityAffected: number;
    purchasedQuantity: number;
    unitPrice: Money;
    issueType: string;
    requestedResolution: string | null;
    approvedResolution: string | null;
    approvedRefundAmount: Money | null;
    replacementQuantity: number | null;
  }[];
  attachments: { id: string; filename: string; mimeType: string; isImage: boolean; url: string }[];
  refunds: { id: string; amount: Money; status: string; approvedAt: string | null; processedAt: string | null }[];
  returns: { id: string; status: string; method: string | null; trackingReference: string | null }[];
  replacements: { id: string; quantity: number; replacementFulfilmentId: string | null }[];
  resolvedAt: string | null;
};

/**
 * `GET /api/v1/vendor/resolutions` row (M29.1) — mirrors
 * toVendorCaseSummaryDTO exactly. Deliberately restricted (M9 §46): no
 * customer identity/contact/description/decision/refund data.
 */
export type VendorResolutionCaseSummaryDTO = {
  id: string;
  caseNumber: string;
  status: string;
  statusLabel: string;
  issueType: string;
  fulfilmentId: string | null;
  orderNumber: string;
  createdAt: string;
};

/** `GET /api/v1/vendor/resolutions/:id` (M29.1) — mirrors toVendorCaseDetailDTO exactly. */
export type VendorResolutionCaseDetailDTO = VendorResolutionCaseSummaryDTO & {
  items: { description: string; quantityAffected: number }[];
};

export type CancellationEligibility = "SAFE" | "NEEDS_REVIEW" | "BLOCKED";

/**
 * `GET /api/v1/orders/:id/resolution-context` (M29.1) — mirrors
 * toResolutionContextDTO exactly. Backs mobile's "Report a problem" entry
 * point; the same context the web ReportProblemForm uses. Eligibility is
 * server-computed — never re-derived client-side.
 */
export type OrderResolutionContextDTO = {
  orderId: string;
  orderNumber: string;
  fulfilments: {
    fulfilmentId: string;
    vendorName: string;
    status: string;
    eligibility: CancellationEligibility;
    items: { orderItemId: string; description: string; quantity: number; unitPrice: Money }[];
  }[];
};

/** `GET /api/v1/me/addresses` row — mirrors modules/addresses/types.ts's AddressView exactly. */
export type AddressDTO = {
  id: string;
  label: string | null;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  region: string;
  isDefault: boolean;
};

// --- Cart / Checkout / Payments (M25) — mirrors lib/api/dto/cart.ts and lib/api/dto/payments.ts exactly --------

export type CartLineDTO = {
  id: string;
  listingId: string;
  title: string;
  categorySlug: string;
  primaryImage: string | null;
  quantity: number;
  moq: number;
  maxOq: number | null;
  availableQuantity: number;
  availabilityStatus: AvailabilityStatus;
  unitPrice: Money;
  lineTotal: Money;
  hasBulkPricing: boolean;
};

export type CartVendorGroupDTO = {
  vendor: { id: string; companyName: string; storefrontSlug: string };
  subtotal: Money;
  lines: CartLineDTO[];
};

/** `GET /api/v1/cart` — also the body of every cart-mutation response (add/update/remove all return the refreshed cart). */
export type CartViewDTO = {
  cartId: string | null;
  itemCount: number;
  currency: string;
  subtotal: Money;
  vendorGroups: CartVendorGroupDTO[];
};

export type MobileMoneyNetworkCode = "MTN" | "TELECEL" | "AT";

export type PaymentMethodCode = "MOCK" | "MOBILE_MONEY" | "CARD";

export type PaymentStatusDTO = {
  paymentId: string;
  status: "INITIATED" | "PENDING" | "SUCCEEDED" | "FAILED" | "CANCELLED";
  method: PaymentMethodCode;
  requiresOtp: boolean;
  network: MobileMoneyNetworkCode | null;
  phoneMasked: string | null;
  cardDisplay: { brand: string; last4: string } | null;
  amount: Money;
  reference: string;
  failureReasonSafe: string | null;
  /** Raw provider status code — used only to pick safe UI copy client-side, never rendered verbatim. */
  providerStatus: string | null;
};

/** `POST /api/v1/orders/:id/payments/card` response. */
export type CardPaymentInitiateDTO = {
  payment: PaymentStatusDTO;
  authorizationUrl: string | null;
};

// --- Vendor Mode (M27) — mirrors ../crownsourceglobal/lib/api/dto/vendor.ts exactly --------

export type VendorApplicationStatusM27 = "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "CHANGES_REQUESTED" | "APPROVED" | "REJECTED";

/** `GET/PATCH /api/v1/vendor-application*` — the onboarding wizard's persisted draft. */
export type VendorApplicationDTO = {
  id: string;
  status: VendorApplicationStatusM27;
  sellerType: SellerType | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  displayName: string | null;
  legalName: string | null;
  storeDescription: string | null;
  registrationNumber: string | null;
  taxIdentifier: string | null;
  yearEstablished: number | null;
  websiteUrl: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  addressLine1: string | null;
  categorySlugs: string[];
  sellingMode: string | null;
  bulkCapable: boolean;
  leadTimeDaysDefault: number | null;
  serviceAreas: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  decisionReason: string | null;
  vendorId: string | null;
};

/** `GET /api/v1/vendor/dashboard`. */
export type VendorDashboardDTO = {
  vendor: { companyName: string; verificationStatus: string };
  stats: { active: number; pendingReview: number; drafts: number; outOfStock: number; lowStock: number };
  newOrders: { id: string; orderNumber: string; itemCount: number; totalQuantity: number; createdAt: string }[];
  newOrdersTotal: number;
  orderIssues: { id: string; orderNumber: string }[];
  listingsNeedingAttention: { id: string; title: string; changesRequestedReason: string | null }[];
  finance: { availableForSettlement: Money };
};

export type VendorListingApprovalStatus = "PENDING" | "APPROVED" | "CHANGES_REQUESTED" | "REJECTED";
export type VendorListingStatus = "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";

/** `GET /api/v1/vendor/listings` row. */
export type VendorListingSummaryDTO = {
  id: string;
  title: string;
  price: Money;
  approvalStatus: VendorListingApprovalStatus;
  listingStatus: VendorListingStatus;
  availabilityStatus: AvailabilityStatus;
  availableQuantity: number;
  hasPendingChanges: boolean;
  changesRequestedReason: string | null;
  updatedAt: string;
};

export type VendorBulkTierDTO = { id: string; minQuantity: number; maxQuantity: number | null; unitPrice: Money };

export type VendorListingFormValues = {
  title: string;
  description: string;
  categoryId: string;
  basePrice: number;
  moq: number;
  maxOq: number | null;
  leadTimeDays: number | null;
  images: string[];
  specs: Record<string, string> | null;
};

/** An existing listing image — `key` is the raw storage key/legacy external URL to send back as `existingImages` on save; `url` is resolved for display only. */
export type VendorListingImageDTO = { key: string; url: string };

/** `GET /api/v1/vendor/listings/:id`. */
export type VendorListingDetailDTO = {
  id: string;
  title: string;
  description: string;
  images: VendorListingImageDTO[];
  specs: Record<string, string> | null;
  price: Money;
  moq: number;
  maxOq: number | null;
  leadTimeDays: number | null;
  availableQuantity: number;
  availabilityStatus: AvailabilityStatus;
  approvalStatus: VendorListingApprovalStatus;
  listingStatus: VendorListingStatus;
  submittedAt: string | null;
  changesRequestedReason: string | null;
  categoryId: string;
  bulkPriceTiers: VendorBulkTierDTO[];
  pendingChanges: { listing: VendorListingFormValues; bulkPriceTiers: { minQuantity: number; maxQuantity: number | null; unitPrice: number }[] } | null;
};

export type VendorFulfilmentStatus = "PENDING" | "ACCEPTED" | "PREPARING" | "READY" | "DISPATCHED" | "DELIVERED" | "COMPLETED" | "EXCEPTION" | "CANCELLED";
export type VendorFulfilmentOrigin = "DOMESTIC_COLLECTION" | "INTERNATIONAL_INBOUND";

/** `GET /api/v1/vendor/orders` row. */
export type VendorFulfilmentSummaryDTO = {
  id: string;
  status: VendorFulfilmentStatus;
  origin: VendorFulfilmentOrigin;
  orderNumber: string;
  createdAt: string;
  itemCount: number;
  totalQuantity: number;
  hasOpenIssue: boolean;
};

/** `GET /api/v1/vendor/orders/:id`. */
export type VendorFulfilmentDetailDTO = VendorFulfilmentSummaryDTO & {
  items: { id: string; description: string; quantity: number }[];
  leadTimeDaysDefault: number | null;
  shipment: {
    id: string;
    status: string;
    carrier: string | null;
    trackingReference: string | null;
    shippedAt: string | null;
    expectedArrivalAt: string | null;
    deliveredAt: string | null;
    receivingLocation: { name: string; addressLine1: string; city: string | null; region: string | null; country: string } | null;
  } | null;
  openIssue: { id: string; status: string; category: string; description: string; createdAt: string; resolvedAt: string | null; resolutionNotes: string | null } | null;
};

/** `GET /api/v1/vendor/finance`. */
export type VendorFinanceOverviewDTO = {
  currency: string;
  availableForSettlement: Money;
  pending: Money;
  waitingPeriod: Money;
  onHold: Money;
  paidToDate: Money;
  unappliedAdjustmentTotal: Money;
};

export type VendorEarningStatus = "PENDING" | "WAITING_PERIOD" | "ON_HOLD" | "ELIGIBLE" | "INCLUDED_IN_SETTLEMENT" | "PAID" | "CANCELLED";

export type VendorEarningSummaryDTO = {
  id: string;
  status: VendorEarningStatus;
  amount: Money;
  orderId: string;
  orderNumber: string;
  createdAt: string;
  eligibleAt: string | null;
  holdReasonSafe: string | null;
};

export type VendorEarningDetailDTO = VendorEarningSummaryDTO & {
  fulfilmentId: string;
  fulfilmentStatus: string;
  orderItemDescription: string;
  quantity: number;
  adjustments: { id: string; amount: Money; category: string; reason: string; createdAt: string }[];
};

export type VendorSettlementStatus = "DRAFT" | "APPROVED" | "PROCESSING" | "PAID" | "FAILED" | "CANCELLED";

export type VendorSettlementSummaryDTO = {
  id: string;
  settlementNumber: string;
  status: VendorSettlementStatus;
  amount: Money;
  createdAt: string;
  payoutPaidAt: string | null;
};

export type VendorSettlementDetailDTO = VendorSettlementSummaryDTO & {
  grossPayable: Money;
  adjustmentTotal: Money;
  approvedAt: string | null;
  payoutMethod: string | null;
  payoutExternalReference: string | null;
  payoutNote: string | null;
  payoutProvider: string | null;
  reversedAt: string | null;
  reversalReason: string | null;
  destination: {
    type: "MOBILE_MONEY" | "BANK_TRANSFER";
    momoAccountName?: string | null;
    momoPhone?: string | null;
    momoNetwork?: string | null;
    bankAccountName?: string | null;
    bankName?: string | null;
    bankAccountNumber?: string | null;
  } | null;
  items: { id: string; amount: Money; orderId: string; orderNumber: string }[];
  adjustments: { id: string; amount: Money; category: string; reason: string; createdAt: string }[];
};

/** `GET/PATCH /api/v1/vendor/finance/payout-destination` — always masked (never a full account number/phone). */
export type VendorPayoutDestinationDTO = {
  type: "MOBILE_MONEY" | "BANK_TRANSFER";
  momoAccountName: string | null;
  momoPhoneMasked: string | null;
  momoNetwork: string | null;
  bankAccountName: string | null;
  bankName: string | null;
  bankAccountNumberMasked: string | null;
  updatedAt: string;
} | null;

/** `GET/PATCH /api/v1/vendor/beauty-professional`. */
export type VendorBeautyProfileDTO = {
  id: string;
  status: "DRAFT" | "PENDING" | "APPROVED" | "CHANGES_REQUESTED" | "REJECTED" | "ARCHIVED";
  displayName: string;
  bio: string | null;
  heroImage: string | null;
  specialtyCategorySlugs: string[];
  locationMode: ServiceLocationMode;
  changesRequestedReason: string | null;
  createdAt: string;
  updatedAt: string;
} | null;

export type VendorServiceDTO = {
  id: string;
  name: string;
  description: string | null;
  startingPrice: Money | null;
  active: boolean;
  category: ExploreCategoryDTO;
  createdAt: string;
  updatedAt: string;
};

/** `GET /api/v1/vendor/beauty-professional/requests` row — never a private customer contact field (CrownSource stays the intermediary). */
export type VendorServiceRequestDTO = {
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
  service: { id: string; name: string };
  customer: { id: string; name: string };
};

// --- Notifications (M28) — mirrors ../crownsourceglobal/lib/api/dto/notifications.ts exactly --------

export type NotificationType =
  | "VENDOR_APPLICATION_SUBMITTED"
  | "VENDOR_APPLICATION_APPROVED"
  | "VENDOR_APPLICATION_CHANGES_REQUESTED"
  | "VENDOR_APPLICATION_REJECTED"
  | "LISTING_APPROVED"
  | "LISTING_CHANGES_REQUESTED"
  | "LISTING_REJECTED"
  | "ORDER_CONFIRMED"
  | "VENDOR_NEW_ORDER"
  | "COLLECTION_SCHEDULED"
  | "PACKAGE_COLLECTED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "DELIVERY_ISSUE"
  | "FULFILMENT_ISSUE_RESOLVED"
  | "QUOTE_ISSUED"
  | "SOURCING_REQUEST_SUBMITTED"
  | "SOURCING_CLARIFICATION_NEEDED"
  | "SOURCING_QUOTE_READY"
  | "SOURCING_UNABLE_TO_SOURCE"
  | "STAFF_REPLY"
  | "VENDOR_STAFF_REPLY"
  | "ADMIN_NEW_VENDOR_APPLICATION"
  | "ADMIN_NEW_SOURCING_REQUEST"
  | "ADMIN_NEW_MESSAGE"
  | "RESOLUTION_CASE_RECEIVED"
  | "RESOLUTION_CLARIFICATION_NEEDED"
  | "RESOLUTION_APPROVED"
  | "RETURN_APPROVED"
  | "REFUND_APPROVED"
  | "REFUND_COMPLETED"
  | "REPLACEMENT_CREATED"
  | "RESOLUTION_CASE_RESOLVED"
  | "RESOLUTION_VENDOR_RESPONSE_NEEDED"
  | "RESOLUTION_VENDOR_CASE_UPDATE"
  | "ADMIN_NEW_RESOLUTION_CASE"
  | "ADMIN_REFUND_FAILED"
  | "PAYMENT_FAILED"
  | "ADMIN_PAYMENT_REQUIRES_ATTENTION"
  | "VENDOR_EARNING_ON_HOLD"
  | "VENDOR_SETTLEMENT_APPROVED"
  | "VENDOR_SETTLEMENT_PAID"
  | "ADMIN_NEW_TALENT_APPLICATION"
  | "EXPLORE_POST_APPROVED"
  | "EXPLORE_POST_CHANGES_REQUESTED"
  | "EXPLORE_POST_REJECTED"
  | "BEAUTY_PROFESSIONAL_APPROVED"
  | "BEAUTY_PROFESSIONAL_CHANGES_REQUESTED"
  | "BEAUTY_PROFESSIONAL_REJECTED"
  | "SERVICE_REQUEST_SUBMITTED"
  | "SERVICE_REQUEST_ACCEPTED"
  | "SERVICE_REQUEST_DECLINED"
  | "VENDOR_SOURCING_SOLICITATION_RECEIVED"
  | "ADMIN_SOURCING_SOLICITATION_RESPONDED";

/** `GET /api/v1/notifications` row — mirrors toNotificationDTO exactly. `targetUrl` is the backend's web path; never pushed directly as an Expo Router route — see features/notifications/destination.ts. */
export type NotificationDTO = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  targetUrl: string;
  readAt: string | null;
  createdAt: string;
};

/** `GET /api/v1/notifications/unread-count`. */
export type UnreadCountDTO = { unreadCount: number };

/** `GET/PATCH /api/v1/vendor/store`. */
export type VendorStoreProfileDTO = {
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
  contactEmail: string | null;
  contactPhone: string | null;
  leadTimeDaysDefault: number | null;
  pickupAddressLine1: string | null;
  pickupContactName: string | null;
  pickupContactPhone: string | null;
  pickupHours: string | null;
  pickupNotes: string | null;
};

/**
 * M30 — mirrors `modules/messaging/types.ts`'s `ConversationSummary`/
 * `ConversationDetail`/`MessageView` exactly, via `lib/api/dto/messaging.ts`.
 * Same shape for the customer (`/api/v1/messages*`) and vendor
 * (`/api/v1/vendor/messages*`) surfaces — only which endpoint a request
 * hits determines which participant's conversations come back. No unread
 * flag: the existing Conversation/Message schema has no per-participant
 * read tracking to expose (unlike Notification's `readAt`).
 */
export type MessagingContextType = "LISTING" | "VENDOR" | "ORDER" | "SOURCING_REQUEST" | "RESOLUTION_CASE" | "GENERAL";

export type ConversationSummaryDTO = {
  id: string;
  participantType: "CUSTOMER" | "VENDOR";
  contextType: MessagingContextType;
  status: "OPEN" | "CLOSED";
  contextLabel: string;
  lastMessage: string | null;
  updatedAt: string;
  createdAt: string;
};

export type MessageDTO = {
  id: string;
  body: string;
  senderIsStaff: boolean;
  senderName: string;
  createdAt: string;
};

export type ConversationDetailDTO = ConversationSummaryDTO & {
  messages: MessageDTO[];
};
