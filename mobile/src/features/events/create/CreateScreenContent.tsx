import React from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Control, FieldErrors } from 'react-hook-form';
import type { EventSummary } from '../../../api/types';
import { Button } from '../../../design/primitives';
import type { CreateEventFormValues } from '../schema';
import { CreateActivityPicker } from './CreateActivityPicker';
import { CreateDetailsSection } from './CreateDetailsSection';
import { CreateHeader } from './CreateHeader';
import { CreatePlanSummaryCard } from './CreatePlanSummaryCard';
import { CreateSuccessCard } from './CreateSuccessCard';
import { CreateTimingSection } from './CreateTimingSection';
import { createStyles as styles } from './create.styles';

export function CreateScreenContent({
  canPost,
  control,
  createdEvent,
  errors,
  isSubmitting,
  keyboardScrollRef,
  noteInputFocus,
  onChangeSpots,
  onClearSubmitError,
  onPost,
  onSelectActivity,
  onSelectSkill,
  onSelectTime,
  onSelectWhen,
  onShareCreatedEvent,
  onViewCreatedEvent,
  resetSuccessState,
  selectedActivity,
  selectedColor,
  selectedTime,
  selectedWhen,
  skillLevel,
  spots,
  submitError,
  timingError,
  where,
}: {
  canPost: boolean;
  control: Control<CreateEventFormValues>;
  createdEvent: EventSummary | null;
  errors: FieldErrors<CreateEventFormValues>;
  isSubmitting: boolean;
  keyboardScrollRef: React.RefObject<ScrollView | null>;
  noteInputFocus: () => void;
  onChangeSpots: (value: number) => void;
  onClearSubmitError: () => void;
  onPost: () => void;
  onSelectActivity: (value: string) => void;
  onSelectSkill: (value: string) => void;
  onSelectTime: (value: string) => void;
  onSelectWhen: (value: string) => void;
  onShareCreatedEvent: () => void;
  onViewCreatedEvent: () => void;
  resetSuccessState: () => void;
  selectedActivity: string;
  selectedColor: string;
  selectedTime: string;
  selectedWhen: string;
  skillLevel: string;
  spots: number;
  submitError: string | null;
  timingError?: string;
  where: string;
}) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.ambientGlow, { backgroundColor: selectedColor }]} pointerEvents="none" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
        style={styles.keyboardAvoider}
      >
        <ScrollView
          ref={keyboardScrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          automaticallyAdjustKeyboardInsets
          onScrollBeginDrag={Keyboard.dismiss}
        >
          <CreateHeader />
          <CreatePlanSummaryCard
            selectedActivity={selectedActivity}
            selectedColor={selectedColor}
            selectedTime={selectedTime}
            selectedWhen={selectedWhen}
            where={where}
          />
          <CreateActivityPicker selectedActivity={selectedActivity} onSelectActivity={onSelectActivity} />
          {errors.selectedActivity?.message ? <Text style={styles.inlineError}>{errors.selectedActivity.message}</Text> : null}

          <CreateTimingSection
            selectedWhen={selectedWhen}
            selectedTime={selectedTime}
            skillLevel={skillLevel}
            timingError={timingError}
            onSelectSkill={onSelectSkill}
            onSelectTime={onSelectTime}
            onSelectWhen={onSelectWhen}
          />

          <CreateDetailsSection
            control={control}
            errors={errors as any}
            isSubmitting={isSubmitting}
            noteInputFocus={noteInputFocus}
            onChangeSpots={onChangeSpots}
            onClearError={onClearSubmitError}
            spots={spots}
          />

          {submitError ? (
            <View style={styles.feedbackWrap}>
              <Text style={styles.feedbackError}>{submitError}</Text>
            </View>
          ) : null}

          {createdEvent ? (
            <CreateSuccessCard
              event={createdEvent}
              onClear={resetSuccessState}
              onShare={onShareCreatedEvent}
              onViewEvent={onViewCreatedEvent}
            />
          ) : null}

          <Button
            label={isSubmitting ? 'Posting...' : canPost ? `Post ${selectedActivity}` : 'Finish the plan to post'}
            onPress={onPost}
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
