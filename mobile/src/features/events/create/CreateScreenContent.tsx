import React from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import type { Control, FieldErrors } from 'react-hook-form';
import type { EventSummary } from '../../../api/types';
import type { LocationSuggestion } from '../../locations/locationSuggestions';
import { Button, ScreenScaffold, SectionBlock, screenLayout } from '../../../design/primitives';
import { getFloatingTabBarReservedHeight } from '../../../design/layout/tabBarLayout';
import {
  AppBottomSheet,
  APP_BOTTOM_SHEET_SNAP_POINTS,
} from '../../../design/sheets/AppBottomSheet';
import { useSheetController } from '../../../design/sheets/useSheetController';
import type { CreateEventFormValues } from '../schema';
import { CreateActivityPicker } from './CreateActivityPicker';
import { CreateDetailsSection } from './CreateDetailsSection';
import { CreateHeader } from './CreateHeader';
import { CreatePlanSummaryCard } from './CreatePlanSummaryCard';
import { CreateSuccessCard } from './CreateSuccessCard';
import { CreateTimingSection } from './CreateTimingSection';
import { createStyles as styles } from './create.styles';
import {
  formatPlanDetailsSummary,
  getPlanDetailsActionLabel,
  getPlanDetailsHint,
} from './create.helpers';
import {
  triggerSelectionHaptic,
  triggerSheetCommitHaptic,
} from '../../../lib/interaction/feedback';

export function CreateScreenContent({
  canPost,
  control,
  createdEvent,
  errors,
  isSubmitting,
  keyboardScrollRef,
  knownLocationSuggestions,
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
  selectedColor: _selectedColor,
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
  knownLocationSuggestions: LocationSuggestion[];
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
  const activitySheet = useSheetController();
  const timingSheet = useSheetController();
  const planDetailsHint = getPlanDetailsHint(selectedWhen, selectedTime);
  const planDetailsActionLabel = getPlanDetailsActionLabel(selectedWhen, selectedTime);
  const tabBarClearance = getFloatingTabBarReservedHeight(0);

  return (
    <ScreenScaffold style={styles.container}>
      <View style={[styles.ambientGlow, { backgroundColor: '#C4A882' }]} pointerEvents="none" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
        style={styles.keyboardAvoider}
      >
        <ScrollView
          ref={keyboardScrollRef}
          testID="create-screen-scroll-view"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: screenLayout.screenBottomPadding + tabBarClearance },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          automaticallyAdjustKeyboardInsets
          onScrollBeginDrag={Keyboard.dismiss}
        >
          <CreateHeader />
          <SectionBlock spacingMode="tight">
            <CreatePlanSummaryCard
              selectedActivity={selectedActivity}
              selectedColor={_selectedColor}
              selectedTime={selectedTime}
              selectedWhen={selectedWhen}
              where={where}
            />
          </SectionBlock>
          <SectionBlock
            eyebrow="Activity"
            title={selectedActivity || 'Choose an activity'}
            description="Pick the movement first, then shape the rest of the plan around it."
            spacingMode="tight"
          >
            <Button
              label={selectedActivity ? 'Change activity' : 'Choose activity'}
              onPress={activitySheet.open}
              variant="secondary"
            />
          </SectionBlock>
          {errors.selectedActivity?.message ? <Text style={styles.selectionError}>{errors.selectedActivity.message}</Text> : null}

          <SectionBlock
            eyebrow="Plan details"
            title={formatPlanDetailsSummary(selectedWhen, selectedTime, skillLevel || '')}
            spacingMode="tight"
          >
            <Button
              label={planDetailsActionLabel}
              onPress={timingSheet.open}
              variant="secondary"
            />
            {planDetailsHint ? <Text style={styles.selectionHint}>{planDetailsHint}</Text> : null}
          </SectionBlock>
          {timingError ? <Text style={styles.selectionError}>{timingError}</Text> : null}

          <CreateDetailsSection
            control={control}
            errors={errors}
            hideSpots
            isSubmitting={isSubmitting}
            knownLocationSuggestions={knownLocationSuggestions}
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
            <SectionBlock spacingMode="tight">
              <CreateSuccessCard
                event={createdEvent}
                onClear={resetSuccessState}
                onShare={onShareCreatedEvent}
                onViewEvent={onViewCreatedEvent}
              />
            </SectionBlock>
          ) : null}

          <Button
            label={isSubmitting ? 'Posting...' : canPost ? `Post ${selectedActivity}` : 'Finish the plan to post'}
            onPress={onPost}
            loading={isSubmitting}
            disabled={!canPost || isSubmitting}
            variant="primary"
            style={styles.postBtnWrap}
          />
        </ScrollView>
      </KeyboardAvoidingView>
      <AppBottomSheet
        {...activitySheet.sheetProps}
        title="Choose activity"
        subtitle="What will you be doing?"
        snapPoints={APP_BOTTOM_SHEET_SNAP_POINTS.standard}
      >
        <CreateActivityPicker
          selectedActivity={selectedActivity}
          onSelectActivity={(value) => {
            void triggerSelectionHaptic();
            onSelectActivity(value);
            activitySheet.close();
          }}
        />
      </AppBottomSheet>
      <AppBottomSheet
        {...timingSheet.sheetProps}
        title="Plan details"
        subtitle="When, how hard, and how many people?"
        snapPoints={APP_BOTTOM_SHEET_SNAP_POINTS.form}
      >
        <CreateTimingSection
          selectedWhen={selectedWhen}
          selectedTime={selectedTime}
          skillLevel={skillLevel}
          spots={spots}
          timingError={timingError}
          onChangeSpots={(value) => {
            void triggerSelectionHaptic();
            onChangeSpots(value);
          }}
          onSelectSkill={(value) => {
            void triggerSelectionHaptic();
            onSelectSkill(value);
          }}
          onSelectTime={(value) => {
            void triggerSelectionHaptic();
            onSelectTime(value);
          }}
          onSelectWhen={(value) => {
            void triggerSelectionHaptic();
            onSelectWhen(value);
          }}
        />
        <Button
          label="Done"
          onPress={() => {
            void triggerSheetCommitHaptic();
            timingSheet.close();
          }}
          variant="primary"
        />
      </AppBottomSheet>
    </ScreenScaffold>
  );
}
