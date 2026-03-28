import React, { useState } from 'react';
import { Share } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { normalizeApiError } from '../api/errors';
import type { EventSummary } from '../api/types';
import type { MainTabScreenProps } from '../core/navigation/types';
import { useCreateEvent } from '../features/events/hooks/useCreateEvent';
import { useInviteToEvent } from '../features/events/hooks/useInviteToEvent';
import { createEventSchema, type CreateEventFormValues } from '../features/events/schema';
import { activityToCategory, buildTitle } from '../features/events/create/create.helpers';
import { useKnownLocationSuggestions } from '../features/locations/useKnownLocationSuggestions';
import { triggerErrorHaptic, triggerSuccessHaptic } from '../lib/interaction/feedback';
import { useStepFlow } from '../components/form/useStepFlow';
import { CreateFlowShell } from '../features/events/create/CreateFlowShell';
import { CreateSuccessCard } from '../features/events/create/CreateSuccessCard';
import { ActivityStep } from '../features/events/create/steps/ActivityStep';
import { WhenWhereStep } from '../features/events/create/steps/WhenWhereStep';
import { DetailsStep } from '../features/events/create/steps/DetailsStep';
import { InviteStep } from '../features/events/create/steps/InviteStep';
import { ScreenScaffold, SectionBlock } from '../design/primitives';

const TOTAL_STEPS = 4;

const STEP_CHAPTERS = ['Activity', 'When & Where', 'Details', 'Invite'] as const;

function getDefaultStartsAt() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d;
}

const DEFAULT_FORM_VALUES: CreateEventFormValues = {
  note: '',
  selectedActivity: '',
  startsAt: getDefaultStartsAt(),
  title: '',
  where: '',
  spots: 2,
  inviteMatchIds: [],
};

export default function CreateScreen({ navigation }: MainTabScreenProps<'Create'>) {
  const [createdEvent, setCreatedEvent] = useState<EventSummary | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { createEvent, createError, isCreating, reset } = useCreateEvent();
  const { invite } = useInviteToEvent();
  const knownLocationSuggestions = useKnownLocationSuggestions();
  const stepFlow = useStepFlow({ totalSteps: TOTAL_STEPS });

  const { control, reset: resetForm, setValue, watch } =
    useForm<CreateEventFormValues>({ defaultValues: DEFAULT_FORM_VALUES, resolver: zodResolver(createEventSchema) });

  const selectedActivity = watch('selectedActivity');
  const startsAt = watch('startsAt');
  const where = watch('where');
  const spots = watch('spots');
  const inviteMatchIds = watch('inviteMatchIds');

  const clearAll = () => {
    setCreatedEvent(null);
    setSubmitError(null);
    reset();
    resetForm(DEFAULT_FORM_VALUES);
    stepFlow.goToStep(0);
  };

  const handlePost = async () => {
    setSubmitError(null);
    setCreatedEvent(null);

    const values = watch();

    // Auto-fill title if blank
    let title = values.title.trim();
    if (!title) {
      title = buildTitle(values.selectedActivity, values.where);
      setValue('title', title);
    }

    try {
      const category = activityToCategory(values.selectedActivity);
      if (!category) {
        setSubmitError('Unknown activity. Please go back and pick one.');
        return;
      }
      const event = await createEvent({
        title,
        location: values.where.trim(),
        category,
        startsAt: values.startsAt.toISOString(),
        endsAt: new Date(values.startsAt.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        description: values.note.trim() || undefined,
      });

      // Send invites (fire-and-forget — don't block success)
      if (values.inviteMatchIds.length > 0) {
        await Promise.allSettled(
          values.inviteMatchIds.map((matchId) =>
            invite({ eventId: event.id, matchId }),
          ),
        );
      }

      setCreatedEvent(event);
      void triggerSuccessHaptic();
      reset();
    } catch (err) {
      void triggerErrorHaptic();
      setSubmitError(normalizeApiError(err).message ?? 'Unable to create event.');
    }
  };

  // Success state
  if (createdEvent) {
    return (
      <ScreenScaffold style={{ flex: 1 }}>
        <SectionBlock spacingMode="tight" style={{ flex: 1, justifyContent: 'center', paddingTop: 80 }}>
          <CreateSuccessCard
            event={createdEvent}
            onClear={clearAll}
            onShare={() => {
              void Share.share({
                message: `Join me for ${createdEvent.title} on BRDG${createdEvent.location ? ` at ${createdEvent.location}` : ''}.`,
              });
            }}
            onViewEvent={() => {
              navigation.navigate('EventDetail', { eventId: createdEvent.id });
            }}
          />
        </SectionBlock>
      </ScreenScaffold>
    );
  }

  const toggleInviteMatch = (matchId: string) => {
    const current = watch('inviteMatchIds');
    if (current.includes(matchId)) {
      setValue('inviteMatchIds', current.filter((id) => id !== matchId));
    } else {
      setValue('inviteMatchIds', [...current, matchId]);
    }
  };

  return (
    <CreateFlowShell
      chapter={STEP_CHAPTERS[stepFlow.step]}
      onBack={stepFlow.goBack}
      progress={(stepFlow.step + 1) / TOTAL_STEPS}
      showBackButton={!stepFlow.isFirstStep}
    >
      {stepFlow.step === 0 ? (
        <ActivityStep
          selectedActivity={selectedActivity}
          onSelectActivity={(value) => {
            setValue('selectedActivity', value, { shouldDirty: true, shouldValidate: true });
            // Auto-fill title when activity changes
            if (where.trim()) {
              setValue('title', buildTitle(value, where));
            }
          }}
          onNext={stepFlow.goNext}
        />
      ) : null}

      {stepFlow.step === 1 ? (
        <WhenWhereStep
          startsAt={startsAt}
          where={where}
          knownLocationSuggestions={knownLocationSuggestions}
          onChangeStartsAt={(date) => setValue('startsAt', date, { shouldDirty: true, shouldValidate: true })}
          onChangeLocation={(value) => {
            setValue('where', value, { shouldDirty: true, shouldValidate: true });
            // Update title when location changes
            if (selectedActivity) {
              setValue('title', buildTitle(selectedActivity, value));
            }
          }}
          onNext={stepFlow.goNext}
        />
      ) : null}

      {stepFlow.step === 2 ? (
        <DetailsStep
          control={control}
          spots={spots}
          onChangeSpots={(value) => setValue('spots', value, { shouldDirty: true, shouldValidate: true })}
          isSubmitting={isCreating}
          submitError={submitError ?? createError}
          onPost={() => {
            // Move to invite step instead of posting directly
            stepFlow.goNext();
          }}
        />
      ) : null}

      {stepFlow.step === 3 ? (
        <InviteStep
          inviteMatchIds={inviteMatchIds}
          onToggleMatch={toggleInviteMatch}
          onDone={() => void handlePost()}
          onSkip={() => void handlePost()}
          isSending={isCreating}
        />
      ) : null}
    </CreateFlowShell>
  );
}
