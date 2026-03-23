import React from 'react';
import { Text, View } from 'react-native';
import { Button, Card } from '../../../design/primitives';
import {
  AppBottomSheet,
  APP_BOTTOM_SHEET_SNAP_POINTS,
  type AppBottomSheetProps,
} from '../../../design/sheets/AppBottomSheet';
import { chatStyles as styles } from './chat.styles';

const QUICK_ACTIONS = [
  {
    key: 'suggest-activity',
    label: 'Suggest activity',
    message: 'Want to plan something active together this week?',
  },
  {
    key: 'plan-workout',
    label: 'Plan workout',
    message: "I'm down to plan a workout. What day works for you?",
  },
  {
    key: 'share-event',
    label: 'Share event idea',
    message: 'I found a BRDG event idea we could do together. Want to compare options?',
  },
] as const;

export function ChatQuickActionsSheet({
  controller,
  onClose,
  onSelectMessage,
}: {
  controller: Pick<
    AppBottomSheetProps,
    'onChangeIndex' | 'onDismiss' | 'onRequestClose' | 'refObject' | 'visible'
  >;
  onClose: () => void;
  onSelectMessage: (message: string) => void;
}) {
  return (
    <AppBottomSheet
      {...controller}
      title="Quick actions"
      subtitle="Keep momentum without typing every opener from scratch."
      snapPoints={APP_BOTTOM_SHEET_SNAP_POINTS.compact}
    >
      <Text style={styles.quickActionSectionLabel}>Suggested openers</Text>
      {QUICK_ACTIONS.map((action) => (
        <Card key={action.key} style={styles.quickActionCard}>
          <View style={styles.quickActionBody} accessibilityLabel={`${action.label}: ${action.message}`}>
            <Text style={styles.quickActionTitle}>{action.label}</Text>
            <Text style={styles.quickActionCopy}>{action.message}</Text>
            <Button
              label={`Use "${action.label}" message`}
              onPress={() => {
                onClose();
                onSelectMessage(action.message);
              }}
              variant="secondary"
            />
          </View>
        </Card>
      ))}
    </AppBottomSheet>
  );
}
