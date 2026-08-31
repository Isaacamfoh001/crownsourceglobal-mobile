import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { CategoryTile } from "@/components/ui/CategoryTile";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { friendlyErrorMessage } from "@/lib/api/errors";
import {
  MAX_PORTFOLIO_LINKS,
  MAX_WORK_SAMPLES,
  MIN_WORK_SAMPLES,
  STATEMENT_MAX_LENGTH,
  TALENT_AVAILABILITY_LABELS,
  TALENT_EXPERIENCE_LABELS,
  TALENT_OPPORTUNITY_LABELS,
  TALENT_SKILL_LABELS,
  TALENT_WORK_STATUS_LABELS,
  isValidHttpUrl,
  type TalentAvailability,
  type TalentExperienceLevel,
  type TalentOpportunityType,
  type TalentSkill,
  type TalentWorkStatus,
} from "@/features/careers/types";
import { prepareWorkPhoto } from "@/features/careers/prepareWorkPhoto";
import { useSubmitTalentApplication, type TalentWorkSamplePhoto } from "@/features/careers/useSubmitTalentApplication";

const SKILL_OPTIONS = Object.keys(TALENT_SKILL_LABELS) as TalentSkill[];
const WORK_STATUS_OPTIONS = Object.keys(TALENT_WORK_STATUS_LABELS) as TalentWorkStatus[];
const EXPERIENCE_OPTIONS = Object.keys(TALENT_EXPERIENCE_LABELS) as TalentExperienceLevel[];
const AVAILABILITY_OPTIONS = Object.keys(TALENT_AVAILABILITY_LABELS) as TalentAvailability[];
const OPPORTUNITY_OPTIONS = Object.keys(TALENT_OPPORTUNITY_LABELS) as TalentOpportunityType[];

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/**
 * Careers / Talent Network application (M23.2) — the mobile front-end for
 * the same guest-accessible `talentService.submitApplication` the web
 * `/careers/apply` form calls (see app/api/v1/talent-applications/route.ts).
 * One continuous scroll form, not a multi-step wizard — CLAUDE.md M23.2 §11
 * explicitly asks to avoid unnecessary wizard complexity. No sign-in
 * required anywhere on this screen, matching the existing web business rule
 * (modules/talent/service.ts's doc comment: no userId/session in the call).
 */
export default function CareersApplyScreen() {
  const { colors } = useAppTheme();
  const submitMutation = useSubmitTalentApplication();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");

  const [skills, setSkills] = useState<TalentSkill[]>([]);
  const [otherSkillDescription, setOtherSkillDescription] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<TalentExperienceLevel | undefined>(undefined);
  const [currentWorkStatus, setCurrentWorkStatus] = useState<TalentWorkStatus | undefined>(undefined);
  const [availability, setAvailability] = useState<TalentAvailability | undefined>(undefined);

  const [opportunityTypes, setOpportunityTypes] = useState<TalentOpportunityType[]>([]);
  const [willingToRelocate, setWillingToRelocate] = useState(false);
  const [preferredWorkLocation, setPreferredWorkLocation] = useState("");

  const [statement, setStatement] = useState("");
  const [photos, setPhotos] = useState<TalentWorkSamplePhoto[]>([]);
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false);
  const [portfolioLinks, setPortfolioLinks] = useState<string[]>([""]);
  const [ownershipConfirmed, setOwnershipConfirmed] = useState(false);

  const trimmedStatement = statement.trim();
  const cleanedLinks = portfolioLinks.map((l) => l.trim()).filter(Boolean);
  const linksAllValid = cleanedLinks.every(isValidHttpUrl);

  const canSubmit =
    fullName.trim().length > 0 &&
    phone.trim().length > 0 &&
    city.trim().length > 0 &&
    Boolean(currentWorkStatus) &&
    Boolean(experienceLevel) &&
    Boolean(availability) &&
    skills.length > 0 &&
    (!skills.includes("OTHER") || otherSkillDescription.trim().length > 0) &&
    opportunityTypes.length > 0 &&
    trimmedStatement.length <= STATEMENT_MAX_LENGTH &&
    photos.length >= MIN_WORK_SAMPLES &&
    photos.length <= MAX_WORK_SAMPLES &&
    linksAllValid &&
    ownershipConfirmed &&
    !isProcessingPhotos &&
    !submitMutation.isPending;

  const pickPhotos = async () => {
    const remaining = MAX_WORK_SAMPLES - photos.length;
    if (remaining <= 0) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Photo access needed", "Allow photo library access in Settings to add work photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });
    if (result.canceled) return;

    setIsProcessingPhotos(true);
    try {
      // Downscale/recompress before upload — see prepareWorkPhoto.ts's doc
      // comment for why (a real, un-resized iPhone photo is what caused the
      // M23.3 real-device "can't reach server" submission failure).
      const picked = await Promise.all(result.assets.map(prepareWorkPhoto));
      setPhotos((current) => [...current, ...picked].slice(0, MAX_WORK_SAMPLES));
    } finally {
      setIsProcessingPhotos(false);
    }
  };

  const removePhoto = (index: number) => setPhotos((current) => current.filter((_, i) => i !== index));

  const setLinkAt = (index: number, value: string) => {
    setPortfolioLinks((current) => current.map((v, i) => (i === index ? value : v)));
  };

  const addLinkField = () => setPortfolioLinks((current) => (current.length < MAX_PORTFOLIO_LINKS ? [...current, ""] : current));
  const removeLinkField = (index: number) => setPortfolioLinks((current) => current.filter((_, i) => i !== index));

  const onSubmit = () => {
    if (!canSubmit || !currentWorkStatus || !experienceLevel || !availability) return;
    submitMutation.mutate(
      {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        city: city.trim(),
        region: region.trim() || undefined,
        currentWorkStatus,
        experienceLevel,
        availability,
        skills,
        otherSkillDescription: otherSkillDescription.trim() || undefined,
        opportunityTypes,
        willingToRelocate,
        preferredWorkLocation: preferredWorkLocation.trim() || undefined,
        statement: trimmedStatement || undefined,
        portfolioLinks: cleanedLinks,
        ownershipConfirmed,
        workSamplePhotos: photos,
      },
      {
        onSuccess: (data) => {
          Alert.alert(
            "Application submitted",
            `Thanks — your application ${data.applicationNumber} has been received. CrownSourceGlobal will review it and reach out if there's a fit.`,
            [{ text: "OK", onPress: () => router.replace("/(tabs)") }],
          );
        },
      },
    );
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <SafeAreaView edges={["top"]} style={[styles.flex, { backgroundColor: colors.bg }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text variant="sectionHeading" tone="primary">
            Apply — Careers
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* About you */}
          <Text variant="smallMedium" tone="gold" style={styles.eyebrow}>
            ABOUT YOU
          </Text>

          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Full name"
            placeholderTextColor={colors.textMuted}
            style={[styles.textInput, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surface }]}
          />
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone / WhatsApp number"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            style={[styles.textInput, styles.fieldGap, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surface }]}
          />
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email (optional)"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            style={[styles.textInput, styles.fieldGap, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surface }]}
          />
          <View style={[styles.row, styles.fieldGap]}>
            <TextInput
              value={city}
              onChangeText={setCity}
              placeholder="City / town"
              placeholderTextColor={colors.textMuted}
              style={[styles.textInput, styles.rowInput, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surface }]}
            />
            <TextInput
              value={region}
              onChangeText={setRegion}
              placeholder="Region (optional)"
              placeholderTextColor={colors.textMuted}
              style={[styles.textInput, styles.rowInput, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surface }]}
            />
          </View>

          {/* Skills & experience */}
          <Text variant="smallMedium" tone="gold" style={[styles.eyebrow, styles.sectionGap]}>
            SKILLS &amp; EXPERIENCE
          </Text>

          <Text variant="small" tone="secondary" style={styles.fieldLabel}>
            Your skills
          </Text>
          <View style={styles.chipRow}>
            {SKILL_OPTIONS.map((skill) => (
              <CategoryTile key={skill} label={TALENT_SKILL_LABELS[skill]} selected={skills.includes(skill)} onPress={() => setSkills((c) => toggle(c, skill))} />
            ))}
          </View>
          {skills.includes("OTHER") ? (
            <TextInput
              value={otherSkillDescription}
              onChangeText={setOtherSkillDescription}
              placeholder="Tell us what your other skill is"
              placeholderTextColor={colors.textMuted}
              style={[styles.textInput, styles.fieldGap, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surface }]}
            />
          ) : null}

          <Text variant="small" tone="secondary" style={[styles.fieldLabel, styles.sectionGapSmall]}>
            Experience level
          </Text>
          <View style={styles.chipRow}>
            {EXPERIENCE_OPTIONS.map((level) => (
              <CategoryTile key={level} label={TALENT_EXPERIENCE_LABELS[level]} selected={experienceLevel === level} onPress={() => setExperienceLevel(level)} />
            ))}
          </View>

          <Text variant="small" tone="secondary" style={[styles.fieldLabel, styles.sectionGapSmall]}>
            Current work status
          </Text>
          <View style={styles.chipRow}>
            {WORK_STATUS_OPTIONS.map((status) => (
              <CategoryTile key={status} label={TALENT_WORK_STATUS_LABELS[status]} selected={currentWorkStatus === status} onPress={() => setCurrentWorkStatus(status)} />
            ))}
          </View>

          <Text variant="small" tone="secondary" style={[styles.fieldLabel, styles.sectionGapSmall]}>
            Availability
          </Text>
          <View style={styles.chipRow}>
            {AVAILABILITY_OPTIONS.map((option) => (
              <CategoryTile key={option} label={TALENT_AVAILABILITY_LABELS[option]} selected={availability === option} onPress={() => setAvailability(option)} />
            ))}
          </View>

          {/* Work preference */}
          <Text variant="smallMedium" tone="gold" style={[styles.eyebrow, styles.sectionGap]}>
            WORK PREFERENCE
          </Text>

          <Text variant="small" tone="secondary" style={styles.fieldLabel}>
            What are you looking for?
          </Text>
          <View style={styles.chipRow}>
            {OPPORTUNITY_OPTIONS.map((type) => (
              <CategoryTile
                key={type}
                label={TALENT_OPPORTUNITY_LABELS[type]}
                selected={opportunityTypes.includes(type)}
                onPress={() => setOpportunityTypes((c) => toggle(c, type))}
              />
            ))}
          </View>

          <Text variant="small" tone="secondary" style={[styles.fieldLabel, styles.sectionGapSmall]}>
            Willing to relocate?
          </Text>
          <View style={styles.chipRow}>
            <CategoryTile label="Yes" selected={willingToRelocate} onPress={() => setWillingToRelocate(true)} />
            <CategoryTile label="No" selected={!willingToRelocate} onPress={() => setWillingToRelocate(false)} />
          </View>

          <TextInput
            value={preferredWorkLocation}
            onChangeText={setPreferredWorkLocation}
            placeholder="Preferred work location (optional)"
            placeholderTextColor={colors.textMuted}
            style={[styles.textInput, styles.fieldGap, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surface }]}
          />

          {/* About your work */}
          <Text variant="smallMedium" tone="gold" style={[styles.eyebrow, styles.sectionGap]}>
            ABOUT YOUR WORK (OPTIONAL)
          </Text>
          <TextInput
            value={statement}
            onChangeText={setStatement}
            placeholder="Tell us a little about yourself and what you're looking for (optional)"
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={STATEMENT_MAX_LENGTH}
            style={[styles.statementInput, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surface }]}
          />
          <Text variant="small" tone="muted">
            {trimmedStatement.length}/{STATEMENT_MAX_LENGTH}
          </Text>

          {/* Portfolio */}
          <Text variant="smallMedium" tone="gold" style={[styles.eyebrow, styles.sectionGap]}>
            PORTFOLIO
          </Text>
          <Text variant="small" tone="secondary" style={styles.fieldLabel}>
            Real photos of work you personally completed
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
            {photos.map((photo, index) => (
              <View key={photo.uri} style={styles.imageThumbWrap}>
                <Image source={{ uri: photo.uri }} style={styles.imageThumb} contentFit="cover" />
                <Pressable onPress={() => removePhoto(index)} accessibilityRole="button" accessibilityLabel="Remove photo" style={styles.removeButton}>
                  <Ionicons name="close" size={14} color="#FFFFFF" />
                </Pressable>
              </View>
            ))}
            {photos.length < MAX_WORK_SAMPLES ? (
              <Pressable
                onPress={pickPhotos}
                disabled={isProcessingPhotos}
                accessibilityRole="button"
                accessibilityLabel="Add work photos"
                style={[styles.addImageButton, { borderColor: colors.border, backgroundColor: colors.surfaceSubtle }, isProcessingPhotos && styles.addImageButtonDisabled]}
              >
                <Ionicons name={isProcessingPhotos ? "hourglass-outline" : "add"} size={26} color={colors.textSecondary} />
              </Pressable>
            ) : null}
          </ScrollView>
          <Text variant="small" tone="muted">
            {isProcessingPhotos ? "Preparing photos…" : `${photos.length}/${MAX_WORK_SAMPLES} photos · at least ${MIN_WORK_SAMPLES} required`}
          </Text>

          {/* Work links */}
          <Text variant="smallMedium" tone="gold" style={[styles.eyebrow, styles.sectionGap]}>
            WORK LINKS
          </Text>
          <Text variant="small" tone="secondary" style={styles.fieldLabel}>
            Optional — Instagram, TikTok, LinkedIn, or a portfolio site
          </Text>
          {portfolioLinks.map((link, index) => {
            const invalid = link.trim().length > 0 && !isValidHttpUrl(link.trim());
            return (
              <View key={index} style={[styles.row, styles.fieldGap]}>
                <TextInput
                  value={link}
                  onChangeText={(value) => setLinkAt(index, value)}
                  placeholder="https://instagram.com/you"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  keyboardType="url"
                  style={[
                    styles.textInput,
                    styles.rowInputGrow,
                    { borderColor: invalid ? colors.error : colors.border, color: colors.textPrimary, backgroundColor: colors.surface },
                  ]}
                />
                {portfolioLinks.length > 1 ? (
                  <Pressable onPress={() => removeLinkField(index)} accessibilityRole="button" accessibilityLabel="Remove link" style={styles.linkRemoveButton}>
                    <Ionicons name="close-circle-outline" size={22} color={colors.textMuted} />
                  </Pressable>
                ) : null}
              </View>
            );
          })}
          {portfolioLinks.length < MAX_PORTFOLIO_LINKS ? (
            <Pressable onPress={addLinkField} accessibilityRole="button" accessibilityLabel="Add another link" style={styles.addLinkButton}>
              <Ionicons name="add-circle-outline" size={18} color={colors.pink} />
              <Text variant="smallMedium" tone="pink">
                Add another link
              </Text>
            </Pressable>
          ) : null}

          {/* Ownership confirmation */}
          <Pressable
            onPress={() => setOwnershipConfirmed((v) => !v)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: ownershipConfirmed }}
            style={[styles.row, styles.sectionGap, styles.confirmRow]}
          >
            <Ionicons
              name={ownershipConfirmed ? "checkbox" : "square-outline"}
              size={22}
              color={ownershipConfirmed ? colors.pink : colors.textMuted}
            />
            <Text variant="small" tone="secondary" style={styles.confirmText}>
              I confirm the work samples I&apos;ve uploaded are my own.
            </Text>
          </Pressable>

          {submitMutation.isError ? (
            <Text variant="small" tone="error" style={styles.errorText}>
              {friendlyErrorMessage(submitMutation.error)}
            </Text>
          ) : null}

          <Button
            label={submitMutation.isPending ? "Submitting…" : "Submit application"}
            onPress={onSubmit}
            disabled={!canSubmit}
            loading={submitMutation.isPending}
            fullWidth
            style={styles.submitButton}
          />
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const THUMB_SIZE = 84;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  headerSpacer: { width: 24 },
  content: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxl },

  eyebrow: { letterSpacing: 1 },
  sectionGap: { marginTop: Spacing.xl },
  sectionGapSmall: { marginTop: Spacing.md },
  fieldLabel: { marginTop: Spacing.sm, marginBottom: Spacing.xxs },
  fieldGap: { marginTop: Spacing.sm },

  row: { flexDirection: "row", alignItems: "center", gap: Spacing.xs },
  rowInput: { flex: 1 },
  rowInputGrow: { flex: 1 },

  textInput: { minHeight: 48, borderRadius: Radius.md, borderWidth: 1, paddingHorizontal: Spacing.sm, fontSize: 14 },
  statementInput: {
    minHeight: 100,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.sm,
    fontSize: 14,
    textAlignVertical: "top",
    marginTop: Spacing.sm,
  },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs },

  imageRow: { gap: Spacing.xs, paddingVertical: Spacing.xs },
  imageThumbWrap: { position: "relative" },
  imageThumb: { width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: Radius.md },
  removeButton: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(20,16,24,0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  addImageButton: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  addImageButtonDisabled: {
    opacity: 0.5,
  },

  linkRemoveButton: { padding: Spacing.xxs },
  addLinkButton: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: Spacing.xs },

  confirmRow: { alignItems: "flex-start" },
  confirmText: { flex: 1, marginTop: 1 },

  errorText: { marginTop: Spacing.md },
  submitButton: { marginTop: Spacing.lg },
});
