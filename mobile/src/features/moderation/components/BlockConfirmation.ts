import { Alert } from 'react-native';

/**
 * Shows a confirmation dialog before blocking a user.
 * Calls `onConfirm` when the user taps "Block".
 */
export function showBlockConfirmation(onConfirm: () => void) {
  Alert.alert(
    'Block this person?',
    "They'll be removed from your matches and won't be able to see your profile or message you.",
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Block', style: 'destructive', onPress: onConfirm },
    ],
  );
}
