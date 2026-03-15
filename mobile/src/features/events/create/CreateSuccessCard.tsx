import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { EventSummary } from '../../../api/types';
import AppIcon from '../../../components/ui/AppIcon';
import { Button, Card } from '../../../design/primitives';
import { createStyles as styles } from './create.styles';
import { formatCreatedEventMeta } from './create.helpers';

export function CreateSuccessCard({
  event,
  onClear,
  onShare,
  onViewEvent,
}: {
  event: EventSummary;
  onClear: () => void;
  onShare: () => void;
  onViewEvent: () => void;
}) {
  return (
    <Card style={styles.successCard}>
      <View style={styles.successHeader}>
        <View style={styles.successIconWrap}>
          <AppIcon name="check" size={18} color="#34D399" />
        </View>
        <View style={styles.successCopy}>
          <Text style={styles.successEyebrow}>INVITE POSTED</Text>
          <Text style={styles.successTitle}>{event.title}</Text>
          <Text style={styles.successMeta}>
            {formatCreatedEventMeta(event)}
            {event.location ? ` · ${event.location}` : ''}
          </Text>
        </View>
      </View>

      <View style={styles.successActions}>
        <Button label="View event" onPress={onViewEvent} variant="accent" style={styles.successActionButton} />
        <Button label="Share" onPress={onShare} variant="ghost" style={styles.successActionButton} />
      </View>

      <Pressable onPress={onClear} style={({ pressed }) => [styles.successSecondaryAction, { opacity: pressed ? 0.82 : 1 }]}>
        <Text style={styles.successSecondaryActionText}>Create another</Text>
      </Pressable>
    </Card>
  );
}
