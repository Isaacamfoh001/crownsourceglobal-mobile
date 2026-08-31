import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { TalentAvailability, TalentExperienceLevel, TalentOpportunityType, TalentSkill, TalentWorkStatus } from "./types";

export type TalentWorkSamplePhoto = { uri: string; mimeType: string; fileName: string };

export type SubmitTalentApplicationInput = {
  fullName: string;
  phone: string;
  email?: string;
  city: string;
  region?: string;
  currentWorkStatus: TalentWorkStatus;
  experienceLevel: TalentExperienceLevel;
  availability: TalentAvailability;
  skills: TalentSkill[];
  otherSkillDescription?: string;
  opportunityTypes: TalentOpportunityType[];
  willingToRelocate: boolean;
  preferredWorkLocation?: string;
  statement: string;
  portfolioLinks: string[];
  ownershipConfirmed: boolean;
  workSamplePhotos: TalentWorkSamplePhoto[];
};

/**
 * Careers / Talent Network application (M23.2) — `POST
 * /api/v1/talent-applications`, `multipart/form-data`. Guest-accessible:
 * no session/auth header is attached beyond whatever apiClient.post always
 * sends (the cookie is empty when signed out, same as every other call —
 * this endpoint never requires it), matching the existing web `/careers/
 * apply` guest flow (modules/talent/service.ts's doc comment).
 */
export function useSubmitTalentApplication() {
  return useMutation({
    mutationFn: (input: SubmitTalentApplicationInput) => {
      const form = new FormData();
      form.append("fullName", input.fullName);
      form.append("phone", input.phone);
      if (input.email) form.append("email", input.email);
      form.append("city", input.city);
      if (input.region) form.append("region", input.region);
      form.append("currentWorkStatus", input.currentWorkStatus);
      form.append("experienceLevel", input.experienceLevel);
      form.append("availability", input.availability);
      for (const skill of input.skills) form.append("skills", skill);
      if (input.otherSkillDescription) form.append("otherSkillDescription", input.otherSkillDescription);
      for (const type of input.opportunityTypes) form.append("opportunityTypes", type);
      form.append("willingToRelocate", input.willingToRelocate ? "true" : "false");
      if (input.preferredWorkLocation) form.append("preferredWorkLocation", input.preferredWorkLocation);
      form.append("statement", input.statement);
      for (const link of input.portfolioLinks) form.append("portfolioLinks", link);
      form.append("ownershipConfirmed", input.ownershipConfirmed ? "true" : "false");
      for (const photo of input.workSamplePhotos) {
        // React Native's FormData accepts { uri, name, type } for a file part, not a real Blob/File.
        form.append("workSamplePhotos", { uri: photo.uri, name: photo.fileName, type: photo.mimeType } as unknown as Blob);
      }
      return apiClient.post<{ applicationNumber: string }>("/api/v1/talent-applications", { form });
    },
  });
}
