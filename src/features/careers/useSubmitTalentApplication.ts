import { useMutation } from "@tanstack/react-query";
import { File } from "expo-file-system";
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
  statement?: string;
  portfolioLinks: string[];
  ownershipConfirmed: boolean;
  workSamplePhotos: TalentWorkSamplePhoto[];
};

/**
 * Builds the exact multipart body `POST /api/v1/talent-applications`
 * expects. Exported (not inlined in the mutation) so it's a pure function
 * a future test runner can exercise directly without React Query/network
 * plumbing (M23.4 §9 — this repo has no test runner installed yet, so for
 * now it's verified by direct code review plus the dev-only part-shape log
 * below, not an automated assertion).
 *
 * M23.4 — the plain `{ uri, name, type }` object previously appended here
 * is React Native's *legacy* FormData file-part convention. This app's
 * global `fetch` is Expo's own spec-compliant "winter" fetch (installed
 * automatically by the `expo` package — see node_modules/expo/src/winter/
 * runtime.native.ts; EXPO_PUBLIC_USE_RN_FETCH is unset here, so winter
 * fetch, not React Native's classic fetch, is what every `fetch()` call in
 * this app actually resolves to). Winter fetch's FormData-to-multipart
 * conversion (node_modules/expo/src/winter/fetch/convertFormData.ts) only
 * accepts a `string`, a real `Blob` instance, or an object exposing a
 * working `.bytes()` method — never the bare `{ uri, name, type }` shape,
 * which is exactly what threw "Unsupported FormDataPart implementation"
 * (reproduced verbatim by Expo's own test suite at
 * node_modules/expo/src/winter/fetch/__tests__/convertFormData-test.native.ts).
 * `expo-file-system`'s `File` is the shape Expo's own test suite pairs with
 * this fetch (their test literally calls it "expo-file-system FileBlob") —
 * a native-backed handle with a real `.bytes()`, so wrapping each photo's
 * local `uri` in one is the supported fix, not a home-grown workaround.
 */
export function buildTalentApplicationFormData(input: SubmitTalentApplicationInput): FormData {
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
  if (input.statement) form.append("statement", input.statement);
  for (const link of input.portfolioLinks) form.append("portfolioLinks", link);
  form.append("ownershipConfirmed", input.ownershipConfirmed ? "true" : "false");
  for (const photo of input.workSamplePhotos) {
    // `File`'s own `.name`/`.type` are derived natively from the file on
    // disk (already a real .jpg from prepareWorkPhoto.ts's compression
    // step) — not from `photo.fileName`/`photo.mimeType`, which the backend
    // never depends on for anything beyond display (modules/talent/
    // repository.ts stores mimeType/sizeBytes read straight off the
    // uploaded bytes, never off the client-claimed filename).
    form.append("workSamplePhotos", new File(photo.uri));
  }

  if (__DEV__) {
    const parts = Array.from(form as unknown as Iterable<[string, unknown]>, ([key, value]) => ({
      field: key,
      isFile: value instanceof File,
      ctor: value?.constructor?.name,
    }));
    console.log("[careers] talent application FormData parts:", parts);
  }

  return form;
}

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
      const form = buildTalentApplicationFormData(input);
      return apiClient.post<{ applicationNumber: string }>("/api/v1/talent-applications", { form });
    },
  });
}
