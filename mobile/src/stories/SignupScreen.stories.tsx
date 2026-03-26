import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  SignupScreenView,
} from '../screens/SignupScreen';
import {
  signupSchema,
  type SignupFormValues,
} from '../features/auth/schema';
import { useStoryForm, withStoryScreenFrame } from './support';

function SignupScreenStory({
  birthdate,
  birthdateError,
  canProceed,
  email,
  emailError,
  firstName,
  firstNameError,
  gender,
  genderError,
  isSubmitting,
  password,
  passwordError,
  step,
}: {
  birthdate: string;
  birthdateError?: string;
  canProceed: boolean;
  email: string;
  emailError?: string;
  firstName: string;
  firstNameError?: string;
  gender: string;
  genderError?: string;
  isSubmitting: boolean;
  password: string;
  passwordError?: string;
  step: number;
}) {
  const values = React.useMemo(
    () => ({
      birthdate,
      email,
      firstName,
      gender,
      password,
    }),
    [birthdate, email, firstName, gender, password],
  );
  const errors = React.useMemo(
    () => ({
      birthdate: birthdateError,
      email: emailError,
      firstName: firstNameError,
      gender: genderError,
      password: passwordError,
    }),
    [birthdateError, emailError, firstNameError, genderError, passwordError],
  );
  const form = useStoryForm<SignupFormValues>({
    defaultValues: values,
    errors,
    resolver: zodResolver(signupSchema),
    values,
  });

  return (
    <SignupScreenView
      canProceed={canProceed}
      control={form.control}
      errors={form.formState.errors}
      isSubmitting={isSubmitting}
      onBack={() => undefined}
      onNavigateLogin={() => undefined}
      onSubmitStep={() => undefined}
      step={step}
    />
  );
}

const meta = {
  title: 'Screens/Signup',
  component: SignupScreenStory,
  decorators: [withStoryScreenFrame({ height: 960 })],
  args: {
    birthdate: '',
    canProceed: false,
    email: '',
    firstName: '',
    gender: '',
    isSubmitting: false,
    password: '',
    step: 0,
  },
} satisfies Meta<typeof SignupScreenStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const StepOne: Story = {};

export const AccountStepErrors: Story = {
  args: {
    canProceed: false,
    email: 'lana',
    emailError: 'Enter a valid email.',
    password: 'short',
    passwordError: 'Use at least 8 characters.',
    step: 1,
  },
};

export const FinalStepReady: Story = {
  args: {
    birthdate: '1995-05-17',
    canProceed: true,
    email: 'lana@brdg.local',
    firstName: 'Lana',
    gender: 'Woman',
    password: 'PreviewPass123!',
    step: 2,
  },
};

export const LoadingFinalStep: Story = {
  args: {
    birthdate: '1995-05-17',
    canProceed: true,
    email: 'lana@brdg.local',
    firstName: 'Lana',
    gender: 'Woman',
    isSubmitting: true,
    password: 'PreviewPass123!',
    step: 2,
  },
};
