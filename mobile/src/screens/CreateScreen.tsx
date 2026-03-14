import React, { useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Share,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { normalizeApiError } from '../api/errors';
import type { EventSummary } from '../api/types';
import { eventsApi } from '../services/api';
import { radii, spacing, typography } from '../theme/tokens';
import AppIcon from '../components/ui/AppIcon';
import AppButton from '../components/ui/AppButton';
import {
  createEventSchema,
  type CreateEventFormValues,
} from '../features/events/schema';
import type { MainTabScreenProps } from '../core/navigation/types';

const BASE = '#0D1117';
const SURFACE = '#161B22';
const SURFACE_ELEVATED = '#1C2128';
const BORDER = 'rgba(255,255,255,0.07)';
const PRIMARY = '#7C6AF7';
const ACCENT = '#34D399';
const TEXT_PRIMARY = '#F0F6FC';
const TEXT_SECONDARY = 'rgba(240,246,252,0.6)';
const TEXT_MUTED = 'rgba(240,246,252,0.38)';
const ENERGY = '#F59E0B';
const ERROR = '#F87171';

const ACTIVITY_TYPES = [
  { icon: 'activity', label: 'Run', color: ACCENT },
  { icon: 'circle', label: 'Yoga', color: PRIMARY },
  { icon: 'activity', label: 'Lift', color: '#F87171' },
  { icon: 'map', label: 'Hike', color: ENERGY },
  { icon: 'sun', label: 'Beach', color: '#60A5FA' },
  { icon: 'navigation', label: 'Cycle', color: '#34D399' },
  { icon: 'wind', label: 'Surf', color: '#38BDF8' },
  { icon: 'triangle', label: 'Climb', color: '#FB923C' },
  { icon: 'target', label: 'Box', color: '#F87171' },
  { icon: 'droplet', label: 'Swim', color: '#60A5FA' },
] as const;

const WHEN_OPTIONS = ['Today', 'Tomorrow', 'This Weekend', 'Next Week'] as const;
const TIME_OPTIONS = ['Morning', 'Afternoon', 'Evening'] as const;
const SKILL_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'] as const;
const DEFAULT_FORM_VALUES: CreateEventFormValues = {
  note: '',
  selectedActivity: '',
  selectedTime: '',
  selectedWhen: '',
  skillLevel: '',
  spots: 2,
  where: '',
};

function ActivityTile({
  activity,
  selected,
  onPress,
}: {
  activity: (typeof ACTIVITY_TYPES)[number];
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.activityTileWrap}>
      <View
        style={[
          styles.activityTile,
          selected
            ? { borderColor: activity.color, backgroundColor: activity.color + '20' }
            : { borderColor: BORDER, backgroundColor: SURFACE },
        ]}
        >
        <AppIcon name={activity.icon} size={20} color={selected ? activity.color : TEXT_MUTED} />
      </View>
      <Text style={[styles.activityLabel, { color: selected ? activity.color : TEXT_MUTED }]}>
        {activity.label}
      </Text>
    </Pressable>
  );
}

function Pill({
  label,
  active,
  onPress,
  accentColor = PRIMARY,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  accentColor?: string;
}) {
  if (active) {
    return (
      <Pressable onPress={onPress} style={styles.pillWrap}>
        <LinearGradient
          colors={[accentColor + 'CC', accentColor + '88']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.pillActive}
        >
          <Text style={styles.pillTextActive}>{label}</Text>
        </LinearGradient>
      </Pressable>
    );
  }
  return (
    <Pressable onPress={onPress} style={[styles.pillInactive]}>
      <Text style={styles.pillTextInactive}>{label}</Text>
    </Pressable>
  );
}

function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

export function buildStartDate(selectedWhen: string, selectedTime: string) {
  const now = new Date();
  const start = new Date(now);

  if (selectedWhen === 'Tomorrow') {
    start.setDate(start.getDate() + 1);
  } else if (selectedWhen === 'This Weekend') {
    const currentDay = start.getDay();
    const isWeekend = currentDay === 0 || currentDay === 6;
    if (!isWeekend) {
      const daysUntilSaturday = (6 - currentDay + 7) % 7;
      start.setDate(start.getDate() + daysUntilSaturday);
    }
  } else if (selectedWhen === 'Next Week') {
    const currentDay = start.getDay();
    const daysUntilNextMonday = currentDay === 0 ? 1 : 8 - currentDay;
    start.setDate(start.getDate() + daysUntilNextMonday);
  }

  if (selectedTime === 'Morning') {
    start.setHours(9, 0, 0, 0);
  } else if (selectedTime === 'Afternoon') {
    start.setHours(14, 0, 0, 0);
  } else {
    start.setHours(18, 0, 0, 0);
  }

  if (start <= now) {
    start.setDate(start.getDate() + 1);
  }

  return start;
}

function buildTitle(activity: string, where: string) {
  return where.trim() ? `${activity} at ${where.trim()}` : `${activity} meetup`;
}

function buildDescription({
  note,
  skillLevel,
  spots,
  selectedWhen,
  selectedTime,
}: {
  note: string;
  skillLevel: string | null;
  spots: number;
  selectedWhen: string;
  selectedTime: string;
}) {
  const parts = [
    note.trim(),
    skillLevel ? `Skill level: ${skillLevel}.` : null,
    `Open spots: ${spots}.`,
    `${selectedWhen} ${selectedTime.toLowerCase()}.`,
  ].filter(Boolean);

  return parts.join(' ');
}

function formatCreatedEventMeta(event: EventSummary) {
  return new Date(event.startsAt).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function CreateScreen({
  navigation,
}: MainTabScreenProps<'Create'>) {
  const scrollRef = useRef<ScrollView | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastCreatedTitle, setLastCreatedTitle] = useState<string | null>(null);
  const [lastCreatedEvent, setLastCreatedEvent] = useState<EventSummary | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateEventFormValues>({
    defaultValues: DEFAULT_FORM_VALUES,
    resolver: zodResolver(createEventSchema),
  });
  const selectedActivity = watch('selectedActivity');
  const selectedWhen = watch('selectedWhen');
  const selectedTime = watch('selectedTime');
  const where = watch('where');
  const skillLevel = watch('skillLevel');
  const spots = watch('spots');
  const note = watch('note');

  const activityObj = useMemo(
    () => ACTIVITY_TYPES.find((a) => a.label === selectedActivity),
    [selectedActivity],
  );
  const selectedColor = activityObj?.color ?? PRIMARY;
  const canPost =
    !!selectedActivity &&
    !!selectedWhen &&
    !!selectedTime &&
    !!where.trim() &&
    !isSubmitting;
  const timingError = errors.selectedWhen?.message || errors.selectedTime?.message;

  const handleNoteFocus = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  };

  const resetForm = () => {
    reset(DEFAULT_FORM_VALUES);
  };

  const clearSuccessState = () => {
    setLastCreatedTitle(null);
    setLastCreatedEvent(null);
  };

  const shareCreatedEvent = async () => {
    if (!lastCreatedEvent) return;

    try {
      await Share.share({
        message: `Join me for ${lastCreatedEvent.title} on BRDG${lastCreatedEvent.location ? ` at ${lastCreatedEvent.location}` : ''}.`,
      });
    } catch {
      // Ignore share sheet dismissals.
    }
  };

  const handlePost = handleSubmit(async (values) => {
    setSubmitError(null);
    setLastCreatedTitle(null);
    setLastCreatedEvent(null);

    const startsAt = buildStartDate(values.selectedWhen, values.selectedTime);
    const endsAt = new Date(startsAt.getTime() + 2 * 60 * 60 * 1000);
    const title = buildTitle(values.selectedActivity, values.where);

    try {
      const response = await eventsApi.create({
        title,
        location: values.where.trim(),
        category: values.selectedActivity,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        description: buildDescription({
          note: values.note,
          skillLevel: values.skillLevel || null,
          spots: values.spots,
          selectedWhen: values.selectedWhen,
          selectedTime: values.selectedTime,
        }),
      });

      const createdEvent = response.data;
      setLastCreatedTitle(createdEvent.title);
      setLastCreatedEvent(createdEvent);
      resetForm();
      requestAnimationFrame(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      });
    } catch (error) {
      setSubmitError(normalizeApiError(error).message);
    }
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.ambientGlow, { backgroundColor: selectedColor }]} pointerEvents="none" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
        style={styles.keyboardAvoider}
      >
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          automaticallyAdjustKeyboardInsets
          onScrollBeginDrag={Keyboard.dismiss}
        >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>HOST FLOW / INVITATION-FIRST</Text>
          <Text style={styles.title}>{`Invite people\nto move.`}</Text>
          <Text style={styles.subtitle}>Pick the activity, set timing, then publish one clean invite.</Text>
        </View>

        <View style={styles.planCard}>
          <View style={styles.planHeader}>
            <Text style={styles.planTitle}>Build the plan</Text>
            <Text style={[styles.planStepCount, { color: selectedColor }]}>
              {[selectedActivity, selectedWhen && selectedTime, where.trim()].filter(Boolean).length}/3
            </Text>
          </View>
          <View style={styles.planRow}>
            <View style={[styles.planPill, selectedActivity && styles.planPillActive]}>
              <Text style={[styles.planPillLabel, selectedActivity && styles.planPillLabelActive]}>
                {selectedActivity ?? 'Pick activity'}
              </Text>
            </View>
            <View style={[styles.planPill, selectedWhen && selectedTime && styles.planPillActive]}>
              <Text style={[styles.planPillLabel, selectedWhen && selectedTime && styles.planPillLabelActive]}>
                {selectedWhen && selectedTime ? `${selectedWhen} / ${selectedTime}` : 'Choose timing'}
              </Text>
            </View>
            <View style={[styles.planPill, where.trim() && styles.planPillActive]}>
              <Text style={[styles.planPillLabel, where.trim() && styles.planPillLabelActive]}>
                {where.trim() || 'Add location'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.activitySection}>
          {activityObj ? (
            <View style={styles.selectedPreview}>
              <LinearGradient
                colors={[selectedColor + '40', selectedColor + '10', 'transparent']}
                style={styles.selectedPreviewGradient}
              >
                <View style={[styles.selectedPreviewIconWrap, { backgroundColor: selectedColor + '16' }]}>
                  <AppIcon name={activityObj.icon} size={24} color={selectedColor} />
                </View>
                <View style={styles.selectedPreviewText}>
                  <Text style={[styles.selectedPreviewEyebrow, { color: selectedColor }]}>ACTIVITY</Text>
                  <Text style={styles.selectedPreviewLabel}>{activityObj.label}</Text>
                </View>
              </LinearGradient>
            </View>
          ) : (
            <Text style={styles.activityPrompt}>Start with the anchor activity.</Text>
          )}

          <View style={styles.activityGrid}>
            {ACTIVITY_TYPES.map((a) => (
              <ActivityTile
                key={a.label}
                activity={a}
                selected={selectedActivity === a.label}
                onPress={() => {
                  setSubmitError(null);
                  setValue('selectedActivity', a.label, { shouldDirty: true, shouldValidate: true });
                }}
              />
            ))}
          </View>
          {errors.selectedActivity?.message ? (
            <Text style={styles.inlineError}>{errors.selectedActivity.message}</Text>
          ) : null}
        </View>

        <View style={styles.formSection}>
          <SectionLabel label="When?" />
          <View style={styles.pillRow}>
            {WHEN_OPTIONS.map((w) => (
              <Pill
                key={w}
                label={w}
                active={selectedWhen === w}
                onPress={() => {
                  setSubmitError(null);
                  setValue('selectedWhen', w, { shouldDirty: true, shouldValidate: true });
                }}
                accentColor={PRIMARY}
              />
            ))}
          </View>
          <View style={[styles.pillRow, { marginTop: spacing.sm }]}>
            {TIME_OPTIONS.map((t) => (
              <Pill
                key={t}
                label={t}
                active={selectedTime === t}
                onPress={() => {
                  setSubmitError(null);
                  setValue('selectedTime', t, { shouldDirty: true, shouldValidate: true });
                }}
                accentColor={ENERGY}
              />
            ))}
          </View>
          {timingError ? (
            <Text style={styles.inlineError}>{timingError}</Text>
          ) : null}
        </View>

        <View style={styles.formSection}>
          <SectionLabel label="Where?" />
          <Controller
            control={control}
            name="where"
            render={({ field: { onBlur, onChange, value } }) => (
              <TextInput
                style={styles.textInput}
                placeholder="Runyon Canyon, Venice Beach..."
                placeholderTextColor={TEXT_MUTED}
                value={value}
                onBlur={onBlur}
                onChangeText={(nextValue) => {
                  setSubmitError(null);
                  onChange(nextValue);
                }}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            )}
          />
          {errors.where?.message ? (
            <Text style={styles.inlineError}>{errors.where.message}</Text>
          ) : null}
        </View>

        <View style={styles.formSection}>
          <SectionLabel label="Skill level" />
          <View style={styles.pillRow}>
            {SKILL_OPTIONS.map((s) => (
              <Pill
                key={s}
                label={s}
                active={skillLevel === s}
                onPress={() => {
                  setSubmitError(null);
                  setValue('skillLevel', s, { shouldDirty: true, shouldValidate: true });
                }}
                accentColor={ACCENT}
              />
            ))}
          </View>
        </View>

        <View style={styles.formSection}>
          <SectionLabel label="Spots available" />
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() =>
                setValue('spots', Math.max(1, spots - 1), {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              activeOpacity={0.7}
              disabled={isSubmitting}
            >
              <Text style={styles.stepperBtnText}>−</Text>
            </TouchableOpacity>
            <View style={styles.stepperValueWrap}>
              <Text style={styles.stepperValue}>{spots}</Text>
              <Text style={styles.stepperSub}>open spots</Text>
            </View>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() =>
                setValue('spots', Math.min(10, spots + 1), {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              activeOpacity={0.7}
              disabled={isSubmitting}
            >
              <Text style={styles.stepperBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formSection}>
          <SectionLabel label="Add a note" />
          <Controller
            control={control}
            name="note"
            render={({ field: { onBlur, onChange, value } }) => (
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Easy pace, bring water, no experience needed..."
                placeholderTextColor={TEXT_MUTED}
                value={value}
                onBlur={onBlur}
                onChangeText={(nextValue) => {
                  setSubmitError(null);
                  onChange(nextValue);
                }}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                onFocus={handleNoteFocus}
                blurOnSubmit
              />
            )}
          />
          {errors.note?.message ? (
            <Text style={styles.inlineError}>{errors.note.message}</Text>
          ) : null}
        </View>

        {submitError ? (
          <View style={styles.feedbackWrap}>
            <Text style={styles.feedbackError}>{submitError}</Text>
          </View>
        ) : null}

        {lastCreatedTitle ? (
          <View style={styles.successCard}>
            <View style={styles.successHeader}>
              <View style={styles.successIconWrap}>
                <AppIcon name="check" size={18} color={ACCENT} />
              </View>
              <View style={styles.successCopy}>
                <Text style={styles.successEyebrow}>INVITE POSTED</Text>
                <Text style={styles.successTitle}>{lastCreatedTitle}</Text>
                {lastCreatedEvent ? (
                  <Text style={styles.successMeta}>
                    {formatCreatedEventMeta(lastCreatedEvent)}
                    {lastCreatedEvent.location ? ` · ${lastCreatedEvent.location}` : ''}
                  </Text>
                ) : null}
              </View>
            </View>

            <View style={styles.successActions}>
              <AppButton
                label="View event"
                onPress={() => {
                  if (!lastCreatedEvent) return;
                  navigation?.navigate('EventDetail', { eventId: lastCreatedEvent.id });
                }}
                variant="accent"
                style={styles.successActionButton}
              />
              <AppButton
                label="Share"
                onPress={shareCreatedEvent}
                variant="ghost"
                style={styles.successActionButton}
              />
            </View>

            <Pressable
              onPress={clearSuccessState}
              style={({ pressed }) => [styles.successSecondaryAction, { opacity: pressed ? 0.82 : 1 }]}
            >
              <Text style={styles.successSecondaryActionText}>Create another</Text>
            </Pressable>
          </View>
        ) : null}

        <AppButton
          label={isSubmitting ? 'Posting...' : canPost ? `Post ${selectedActivity}` : 'Finish the plan to post'}
          onPress={handlePost}
          loading={isSubmitting}
          disabled={!canPost || isSubmitting}
          variant="accent"
          style={styles.postBtnWrap}
        />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BASE,
  },
  keyboardAvoider: {
    flex: 1,
  },
  ambientGlow: {
    position: 'absolute',
    top: 80,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.05,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 64,
  },
  header: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.8,
    color: PRIMARY,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
    color: TEXT_PRIMARY,
    lineHeight: 36,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.bodySmall,
    fontWeight: '500',
    color: TEXT_MUTED,
    lineHeight: 20,
    maxWidth: 300,
  },
  planCard: {
    marginHorizontal: spacing.xxl,
    marginBottom: spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: 'rgba(28,35,48,0.68)',
    padding: spacing.md,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  planTitle: {
    color: TEXT_PRIMARY,
    fontSize: typography.body,
    fontWeight: '800',
  },
  planStepCount: {
    fontSize: typography.bodySmall,
    fontWeight: '800',
  },
  planRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  planPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  planPillActive: {
    borderColor: 'rgba(124,106,247,0.32)',
    backgroundColor: 'rgba(124,106,247,0.14)',
  },
  planPillLabel: {
    color: TEXT_MUTED,
    fontSize: 12,
    fontWeight: '700',
  },
  planPillLabelActive: {
    color: TEXT_PRIMARY,
  },
  activitySection: {
    marginBottom: spacing.md,
  },
  selectedPreview: {
    marginHorizontal: spacing.xxl,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: BORDER,
  },
  selectedPreviewGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  selectedPreviewIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedPreviewText: {
    flex: 1,
  },
  selectedPreviewEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
    marginBottom: 4,
  },
  selectedPreviewLabel: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: TEXT_PRIMARY,
  },
  activityPrompt: {
    marginHorizontal: spacing.xxl,
    marginBottom: spacing.md,
    color: TEXT_MUTED,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xxl,
    gap: 10,
  },
  activityTileWrap: {
    alignItems: 'center',
    gap: 4,
  },
  activityTile: {
    width: 58,
    height: 58,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  formSection: {
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: TEXT_MUTED,
    marginBottom: spacing.md,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pillWrap: {
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  pillActive: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radii.pill,
  },
  pillTextActive: {
    fontSize: typography.bodySmall,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  pillInactive: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  pillTextInactive: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: TEXT_MUTED,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.body,
    backgroundColor: SURFACE_ELEVATED,
    borderColor: BORDER,
    color: TEXT_PRIMARY,
  },
  textArea: {
    minHeight: 80,
    paddingTop: spacing.md,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  stepperBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: BORDER,
    backgroundColor: SURFACE_ELEVATED,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnText: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    lineHeight: 26,
  },
  stepperValueWrap: {
    alignItems: 'center',
  },
  stepperValue: {
    fontSize: 40,
    fontWeight: '900',
    color: TEXT_PRIMARY,
    letterSpacing: -1,
    lineHeight: 44,
  },
  stepperSub: {
    fontSize: 11,
    fontWeight: '700',
    color: TEXT_MUTED,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  feedbackWrap: {
    marginHorizontal: spacing.xxl,
    marginBottom: spacing.md,
  },
  inlineError: {
    color: ERROR,
    fontSize: typography.caption,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  feedbackError: {
    color: ERROR,
    fontSize: typography.bodySmall,
    fontWeight: '700',
    lineHeight: 20,
  },
  feedbackSuccess: {
    color: ACCENT,
    fontSize: typography.bodySmall,
    fontWeight: '700',
    lineHeight: 20,
  },
  successCard: {
    marginHorizontal: spacing.xxl,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.32)',
    backgroundColor: SURFACE_ELEVATED,
    gap: spacing.md,
  },
  successHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  successIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(52,211,153,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCopy: {
    flex: 1,
    gap: 2,
  },
  successEyebrow: {
    color: ACCENT,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  successTitle: {
    color: TEXT_PRIMARY,
    fontSize: typography.h3,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  successMeta: {
    color: TEXT_SECONDARY,
    fontSize: typography.bodySmall,
    lineHeight: 20,
  },
  successActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  successActionButton: {
    flex: 1,
  },
  successSecondaryAction: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  successSecondaryActionText: {
    color: TEXT_MUTED,
    fontSize: typography.bodySmall,
    fontWeight: '700',
  },
  postBtnWrap: {
    marginHorizontal: spacing.xxl,
    marginTop: spacing.md,
  },
});
