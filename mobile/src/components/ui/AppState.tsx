import React from 'react';
import { StatePanel } from '../../design/primitives';

interface AppStateProps {
  title: string;
  description?: string;
  loading?: boolean;
  isError?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

export default function AppState({ title, description, loading, isError, actionLabel, onAction }: AppStateProps) {
  return <StatePanel title={title} description={description} loading={loading} isError={isError} actionLabel={actionLabel} onAction={onAction} />;
}
