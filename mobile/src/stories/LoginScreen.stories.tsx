import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  LoginScreenView,
} from '../screens/LoginScreen';
import {
  loginSchema,
  type LoginFormValues,
} from '../features/auth/schema';
import { useStoryForm, withStoryScreenFrame } from './support';

function LoginScreenStory({
  email,
  emailError,
  isSubmitting,
  password,
  passwordError,
  submitError,
}: {
  email: string;
  emailError?: string;
  isSubmitting: boolean;
  password: string;
  passwordError?: string;
  submitError: string;
}) {
  const values = React.useMemo(
    () => ({
      email,
      password,
    }),
    [email, password],
  );
  const errors = React.useMemo(
    () => ({
      email: emailError,
      password: passwordError,
    }),
    [emailError, passwordError],
  );
  const form = useStoryForm<LoginFormValues>({
    defaultValues: values,
    errors,
    resolver: zodResolver(loginSchema),
    values,
  });

  return (
    <LoginScreenView
      control={form.control}
      isSubmitting={isSubmitting}
      onClearSubmitError={() => undefined}
      onNavigateSignup={() => undefined}
      onSubmit={() => undefined}
      submitError={submitError}
      onGoogleLogin={() => undefined}
      onAppleLogin={() => undefined}
      googleLoading={false}
      appleLoading={false}
      googleReady={false}
    />
  );
}

const meta = {
  title: 'Screens/Login',
  component: LoginScreenStory,
  decorators: [withStoryScreenFrame({ height: 900 })],
  args: {
    email: '',
    isSubmitting: false,
    password: '',
    submitError: '',
  },
} satisfies Meta<typeof LoginScreenStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ValidationErrors: Story = {
  args: {
    email: 'lana',
    emailError: 'Enter a valid email.',
    password: '',
    passwordError: 'Password is required.',
  },
};

export const SubmitError: Story = {
  args: {
    email: 'lana@brdg.local',
    password: 'PreviewPass123!',
    submitError: 'Incorrect email or password.',
  },
};

export const Loading: Story = {
  args: {
    email: 'lana@brdg.local',
    isSubmitting: true,
    password: 'PreviewPass123!',
  },
};
