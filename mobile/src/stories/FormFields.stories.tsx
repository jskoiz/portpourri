import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { View } from 'react-native';
import { DateField } from '../components/form/DateField';
import { LocationField } from '../components/form/LocationField';
import { SheetSelectField } from '../components/form/SheetSelectField';
import { StepperField } from '../components/form/StepperField';
import { withStoryScreenFrame } from './support';

function FormFieldsStory() {
  const [birthday, setBirthday] = React.useState('1995-02-03');
  const [location, setLocation] = React.useState('Kailua');
  const [activity, setActivity] = React.useState('run');
  const [groupSize, setGroupSize] = React.useState(4);

  return (
    <View style={{ gap: 18, padding: 20 }}>
      <DateField
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
        label="Activity"
        onSelect={setActivity}
        options={[
          { label: 'Run', value: 'run', description: 'Outdoor pace-based activity' },
          { label: 'Yoga', value: 'yoga', description: 'Studio or recovery-friendly' },
          { label: 'Swim', value: 'swim', description: 'Pool or open water' },
        ]}
        placeholder="Pick an activity"
        sheetTitle="Choose an activity"
        value={activity}
      />
      <StepperField
        helperText="Show the compact stepper interaction."
        label="Group size"
        max={12}
        min={2}
        onChange={setGroupSize}
        value={groupSize}
      />
    </View>
  );
}

function FormFieldsEmptyStateStory() {
  const [birthday, setBirthday] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [activity, setActivity] = React.useState('');
  const [groupSize, setGroupSize] = React.useState(2);

  return (
    <View style={{ gap: 18, padding: 20 }}>
      <DateField
        helperText="Shows the placeholder state used by the accessibility label."
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
        helperText="Shows the placeholder state used by the accessibility label."
        label="Activity"
        onSelect={setActivity}
        options={[
          { label: 'Run', value: 'run', description: 'Outdoor pace-based activity' },
          { label: 'Yoga', value: 'yoga', description: 'Studio or recovery-friendly' },
          { label: 'Swim', value: 'swim', description: 'Pool or open water' },
        ]}
        placeholder="Pick an activity"
        sheetTitle="Choose an activity"
        value={activity}
      />
      <StepperField
        helperText="Stepper remains unchanged for this accessibility pass."
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
} satisfies Meta<typeof FormFieldsStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const EmptyState: Story = {
  render: () => <FormFieldsEmptyStateStory />,
};
