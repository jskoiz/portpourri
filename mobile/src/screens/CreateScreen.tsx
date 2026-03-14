import React, { useMemo, useRef, useState } from 'react';
import { Keyboard, ScrollView, Share } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { EventSummary } from '../api/types';
import type { MainTabScreenProps } from '../core/navigation/types';
import { useCreateEvent } from '../features/events/hooks/useCreateEvent';
import { createEventSchema, type CreateEventFormValues } from '../features/events/schema';
import { CreateScreenContent } from '../features/events/create/CreateScreenContent';
import { ACTIVITY_TYPES, buildDescription, buildStartDate, buildTitle } from '../features/events/create/create.helpers';

const DEFAULT_FORM_VALUES: CreateEventFormValues = {
  note: '',
  selectedActivity: '',
  selectedTime: '',
  selectedWhen: '',
  skillLevel: '',
  spots: 2,
  where: '',
};

export default function CreateScreen({ navigation }: MainTabScreenProps<'Create'>) {
  const scrollRef = useRef<ScrollView | null>(null);
  const [createdEvent, setCreatedEvent] = useState<EventSummary | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { createEvent, createError, isCreating, reset } = useCreateEvent();
  const { control, handleSubmit, reset: resetForm, setValue, watch, formState: { errors } } =
    useForm<CreateEventFormValues>({ defaultValues: DEFAULT_FORM_VALUES, resolver: zodResolver(createEventSchema) });

  const selectedActivity = watch('selectedActivity');
  const selectedWhen = watch('selectedWhen');
  const selectedTime = watch('selectedTime');
  const where = watch('where');
  const skillLevel = watch('skillLevel');
  const spots = watch('spots');
  const activityObj = useMemo(() => ACTIVITY_TYPES.find((activity) => activity.label === selectedActivity), [selectedActivity]);
  const selectedColor = activityObj?.color ?? '#7C6AF7';
  const canPost = !!selectedActivity && !!selectedWhen && !!selectedTime && !!where.trim() && !isCreating;
  const timingError = errors.selectedWhen?.message || errors.selectedTime?.message;

  const clearSuccessState = () => {
    setCreatedEvent(null);
    setSubmitError(null);
    reset();
  };

  const handlePost = handleSubmit(async (values) => {
    setSubmitError(null);
    setCreatedEvent(null);

    try {
      const startsAt = buildStartDate(values.selectedWhen, values.selectedTime);
      const event = await createEvent({
        title: buildTitle(values.selectedActivity, values.where),
        location: values.where.trim(),
        category: values.selectedActivity,
        startsAt: startsAt.toISOString(),
        endsAt: new Date(startsAt.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        description: buildDescription({
          note: values.note,
          selectedTime: values.selectedTime,
          selectedWhen: values.selectedWhen,
          skillLevel: values.skillLevel || null,
          spots: values.spots,
        }),
      });

      setCreatedEvent(event);
      resetForm(DEFAULT_FORM_VALUES);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      });
    } catch {
      setSubmitError(createError ?? 'Unable to create event.');
    }
  });

  return (
    <CreateScreenContent
      canPost={canPost}
      control={control}
      createdEvent={createdEvent}
      errors={errors}
      isSubmitting={isCreating}
      keyboardScrollRef={scrollRef}
      noteInputFocus={() => {
        requestAnimationFrame(() => {
          scrollRef.current?.scrollToEnd({ animated: true });
        });
      }}
      onChangeSpots={(value) => setValue('spots', value, { shouldDirty: true, shouldValidate: true })}
      onClearSubmitError={() => setSubmitError(null)}
      onPost={() => {
        void handlePost();
      }}
      onSelectActivity={(value) => {
        setSubmitError(null);
        setValue('selectedActivity', value, { shouldDirty: true, shouldValidate: true });
      }}
      onSelectSkill={(value) => {
        setSubmitError(null);
        setValue('skillLevel', value, { shouldDirty: true, shouldValidate: true });
      }}
      onSelectTime={(value) => {
        setSubmitError(null);
        setValue('selectedTime', value, { shouldDirty: true, shouldValidate: true });
      }}
      onSelectWhen={(value) => {
        setSubmitError(null);
        setValue('selectedWhen', value, { shouldDirty: true, shouldValidate: true });
      }}
      onShareCreatedEvent={() => {
        if (!createdEvent) return;
        void Share.share({
          message: `Join me for ${createdEvent.title} on BRDG${createdEvent.location ? ` at ${createdEvent.location}` : ''}.`,
        });
      }}
      onViewCreatedEvent={() => {
        if (!createdEvent) return;
        navigation.navigate('EventDetail', { eventId: createdEvent.id });
      }}
      resetSuccessState={clearSuccessState}
      selectedActivity={selectedActivity}
      selectedColor={selectedColor}
      selectedTime={selectedTime}
      selectedWhen={selectedWhen}
      skillLevel={skillLevel}
      spots={spots}
      submitError={submitError ?? createError}
      timingError={timingError}
      where={where}
    />
  );
}

export { buildStartDate } from '../features/events/create/create.helpers';
