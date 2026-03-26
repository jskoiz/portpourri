import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { View } from 'react-native';
import { DateField } from '../components/form/DateField';
import { LocationField } from '../components/form/LocationField';
import { SheetSelectField } from '../components/form/SheetSelectField';
import { StepperField } from '../components/form/StepperField';
import { withStoryScreenFrame } from './support';

const activityOptions = [
  { label: 'Run', value: 'run', description: 'Outdoor pace-based activity' },
  { label: 'Yoga', value: 'yoga', description: 'Studio or recovery-friendly' },
  { label: 'Swim', value: 'swim', description: 'Pool or open water' },
];

function FormFieldsStory({
  activityHelperText,
  initialActivity,
  initialBirthday,
  initialGroupSize,
  initialLocation,
  birthdayHelperText,
  groupSizeHelperText,
}: {
  activityHelperText?: string;
  birthdayHelperText?: string;
  groupSizeHelperText?: string;
  initialActivity: string;
  initialBirthday: string;
  initialGroupSize: number;
  initialLocation: string;
}) {
  const [birthday, setBirthday] = React.useState(initialBirthday);
  const [location, setLocation] = React.useState(initialLocation);
  const [activity, setActivity] = React.useState(initialActivity);
  const [groupSize, setGroupSize] = React.useState(initialGroupSize);

  React.useEffect(() => setBirthday(initialBirthday), [initialBirthday]);
  React.useEffect(() => setLocation(initialLocation), [initialLocation]);
  React.useEffect(() => setActivity(initialActivity), [initialActivity]);
  React.useEffect(() => setGroupSize(initialGroupSize), [initialGroupSize]);

  return (
    <View style={{ gap: 18, padding: 20 }}>
      <DateField
        helperText={birthdayHelperText}
        label="Birthday"
        onChange={setBirthday}
        placeholder="Choose your birthdate"
        sheetTitle="Choose your birthdate"
        value={birthday}
      />
      <LocationField
        kind="city"
        label="City"
        onChangeText={setLocation}
        placeholder="Honolulu"
        sheetTitle="Choose a city"
        value={location}
      />
      <SheetSelectField
        helperText={activityHelperText}
        label="Activity"
        onSelect={setActivity}
        options={activityOptions}
        placeholder="Pick an activity"
        sheetTitle="Choose an activity"
        value={activity}
      />
      <StepperField
        helperText={groupSizeHelperText}
        label="Group size"
        max={12}
        min={2}
        onChange={setGroupSize}
        value={groupSize}
      />
    </View>
  );
}

const meta = {
  title: 'Components/FormFields',
  component: FormFieldsStory,
  decorators: [withStoryScreenFrame({ centered: false, height: 920 })],
  args: {
    initialActivity: 'run',
    initialBirthday: '1995-02-03',
    initialGroupSize: 4,
    initialLocation: 'Kailua',
    groupSizeHelperText: 'Show the compact stepper interaction.',
  },
} satisfies Meta<typeof FormFieldsStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const EmptyState: Story = {
  args: {
    activityHelperText: 'Shows the placeholder state used by the accessibility label.',
    birthdayHelperText: 'Shows the placeholder state used by the accessibility label.',
    groupSizeHelperText: 'Stepper remains unchanged for this accessibility pass.',
    initialActivity: '',
    initialBirthday: '',
    initialGroupSize: 2,
    initialLocation: '',
  },
};
