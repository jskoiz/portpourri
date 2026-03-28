import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Match } from '../../../../api/types';
import AppIcon from '../../../../components/ui/AppIcon';
import { Button, screenLayout } from '../../../../design/primitives';
import { useTheme } from '../../../../theme/useTheme';
import { spacing, typography, radii } from '../../../../theme/tokens';
import { useMatches } from '../../../matches/hooks/useMatches';

type InviteStepProps = {
  inviteMatchIds: string[];
  onDone: () => void;
  onSkip: () => void;
  onToggleMatch: (matchId: string) => void;
  isSending: boolean;
};

function MatchRow({
  match,
  selected,
  onToggle,
}: {
  match: Match;
  onToggle: () => void;
  selected: boolean;
}) {
  const theme = useTheme();
  const name = match.user?.firstName ?? 'Someone';
  const photoUrl = match.user?.photoUrl;

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`Invite ${name}`}
      onPress={onToggle}
      style={[
        styles.matchRow,
        {
          backgroundColor: selected ? theme.selectedFill : theme.surface,
          borderColor: selected ? theme.primary : theme.stroke,
        },
      ]}
    >
      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, { backgroundColor: theme.chipSurface, alignItems: 'center', justifyContent: 'center' }]}>
          <AppIcon name="user" size={18} color={theme.textMuted} />
        </View>
      )}
      <Text style={[styles.matchName, { color: theme.textPrimary }]} numberOfLines={1}>
        {name}
      </Text>
      <View
        style={[
          styles.checkbox,
          {
            backgroundColor: selected ? theme.primary : 'transparent',
            borderColor: selected ? theme.primary : theme.stroke,
          },
        ]}
      >
        {selected ? <AppIcon name="check" size={12} color="#fff" /> : null}
      </View>
    </Pressable>
  );
}

export function InviteStep({
  inviteMatchIds,
  onDone,
  onSkip,
  onToggleMatch,
  isSending,
}: InviteStepProps) {
  const theme = useTheme();
  const { matches, isLoading } = useMatches();

  // Show recent matches (with activity in the last 30 days, or just show all if we can't determine)
  const recentMatches = matches.filter((m: Match) => {
    if (!m.createdAt) return true;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return new Date(m.createdAt) > thirtyDaysAgo || m.lastMessage;
  });

  const displayMatches = recentMatches.length > 0 ? recentMatches : matches;
  const hasInvites = inviteMatchIds.length > 0;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            Invite people
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Let your matches know about this event. This is optional.
          </Text>
        </View>

        {isLoading ? (
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>Loading matches...</Text>
        ) : displayMatches.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>
            No matches yet. You can share the event after posting.
          </Text>
        ) : (
          <View style={styles.matchList}>
            {displayMatches.map((match: Match) => (
              <MatchRow
                key={match.id}
                match={match}
                selected={inviteMatchIds.includes(match.id)}
                onToggle={() => onToggleMatch(match.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>
      <View style={styles.footer}>
        {hasInvites ? (
          <Button
            label={isSending ? 'Sending invites...' : `Send ${inviteMatchIds.length} invite${inviteMatchIds.length > 1 ? 's' : ''} & post`}
            onPress={onDone}
            loading={isSending}
            disabled={isSending}
            variant="primary"
          />
        ) : (
          <Button
            label={isSending ? 'Posting...' : 'Post without invites'}
            onPress={onSkip}
            loading={isSending}
            disabled={isSending}
            variant="primary"
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    paddingHorizontal: screenLayout.gutter,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  header: {
    marginBottom: spacing.xl,
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.h3,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: typography.bodySmall,
    lineHeight: 20,
  },
  emptyText: {
    fontSize: typography.bodySmall,
    lineHeight: 20,
    textAlign: 'center',
    paddingVertical: spacing.xxxl,
  },
  matchList: {
    gap: spacing.sm,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 1.5,
    padding: spacing.md,
    gap: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  matchName: {
    flex: 1,
    fontSize: typography.body,
    fontWeight: '700',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: screenLayout.gutter,
    paddingBottom: spacing.xl,
  },
});
