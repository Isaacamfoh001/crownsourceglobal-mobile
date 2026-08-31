/**
 * Careers / Talent Network (M23.2) — mirrors the backend's M15 Beauty
 * Talent taxonomy (crownsourceglobal/modules/talent/types.ts and
 * service.ts's *_LABELS constants) so the mobile client speaks the exact
 * same product language as the web guest form. Kept as a small local copy
 * rather than a shared package — this repo doesn't import backend TS
 * modules across the API boundary (see docs/mobile/MOBILE_V1_PLAN.md).
 */

export type TalentSkill =
  | "HAIRDRESSING"
  | "WIG_MAKING"
  | "WIG_INSTALLATION"
  | "BRAIDING"
  | "HAIR_COLOURING_TREATMENT"
  | "MAKEUP_ARTISTRY"
  | "LASH_EXTENSIONS"
  | "BROWS"
  | "MANICURE_PEDICURE"
  | "NAIL_TECHNOLOGY"
  | "BARBERING"
  | "SKINCARE_BEAUTY_THERAPY"
  | "SALON_ASSISTANT"
  | "BEAUTY_RETAIL_SALES"
  | "OTHER";

export type TalentExperienceLevel = "JUST_STARTING" | "UNDER_1_YEAR" | "ONE_TO_TWO_YEARS" | "THREE_TO_FIVE_YEARS" | "FIVE_PLUS_YEARS";
export type TalentAvailability = "IMMEDIATELY" | "WITHIN_2_WEEKS" | "WITHIN_1_MONTH" | "JUST_EXPLORING";
export type TalentOpportunityType = "FULL_TIME" | "PART_TIME" | "APPRENTICESHIP" | "CONTRACT_FREELANCE" | "OPEN_TO_ANY";
export type TalentWorkStatus = "NOT_WORKING" | "FULL_TIME_EMPLOYED" | "PART_TIME_EMPLOYED" | "FREELANCE_SELF_EMPLOYED" | "APPRENTICE_TRAINEE" | "OTHER";

export const TALENT_SKILL_LABELS: Record<TalentSkill, string> = {
  HAIRDRESSING: "Hairdressing",
  WIG_MAKING: "Wig Making",
  WIG_INSTALLATION: "Wig Installation",
  BRAIDING: "Braiding",
  HAIR_COLOURING_TREATMENT: "Hair Colouring / Treatment",
  MAKEUP_ARTISTRY: "Makeup Artistry",
  LASH_EXTENSIONS: "Lash Extensions",
  BROWS: "Brows",
  MANICURE_PEDICURE: "Manicure / Pedicure",
  NAIL_TECHNOLOGY: "Nail Technology",
  BARBERING: "Barbering",
  SKINCARE_BEAUTY_THERAPY: "Skincare / Beauty Therapy",
  SALON_ASSISTANT: "Salon Assistant",
  BEAUTY_RETAIL_SALES: "Beauty Retail / Sales",
  OTHER: "Other",
};

export const TALENT_EXPERIENCE_LABELS: Record<TalentExperienceLevel, string> = {
  JUST_STARTING: "Just starting",
  UNDER_1_YEAR: "Less than 1 year",
  ONE_TO_TWO_YEARS: "1–2 years",
  THREE_TO_FIVE_YEARS: "3–5 years",
  FIVE_PLUS_YEARS: "5+ years",
};

export const TALENT_AVAILABILITY_LABELS: Record<TalentAvailability, string> = {
  IMMEDIATELY: "Immediately",
  WITHIN_2_WEEKS: "Within 2 weeks",
  WITHIN_1_MONTH: "Within 1 month",
  JUST_EXPLORING: "Just exploring opportunities",
};

export const TALENT_OPPORTUNITY_LABELS: Record<TalentOpportunityType, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  APPRENTICESHIP: "Internship / Apprenticeship",
  CONTRACT_FREELANCE: "Contract / Freelance",
  OPEN_TO_ANY: "Open to any",
};

export const TALENT_WORK_STATUS_LABELS: Record<TalentWorkStatus, string> = {
  NOT_WORKING: "Not currently working",
  FULL_TIME_EMPLOYED: "Currently working full-time",
  PART_TIME_EMPLOYED: "Currently working part-time",
  FREELANCE_SELF_EMPLOYED: "Freelancing / self-employed",
  APPRENTICE_TRAINEE: "Apprentice / trainee",
  OTHER: "Other",
};

// Mirrors modules/talent/image-validation.ts's MIN/MAX_WORK_SAMPLES — the
// backend is the source of truth and re-validates regardless, this only
// drives the mobile UI's copy/enablement.
export const MIN_WORK_SAMPLES = 3;
export const MAX_WORK_SAMPLES = 8;
export const MAX_PORTFOLIO_LINKS = 3;
export const STATEMENT_MAX_LENGTH = 750;

export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
