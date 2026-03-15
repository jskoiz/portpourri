import React from 'react';
import { Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { EventSummary } from '../../../api/types';
import AppIcon from '../../../components/ui/AppIcon';
import { Button, Card, Chip } from '../../../design/primitives';
import { ACTIVITY_SPOTS, COMMUNITY_POSTS } from './explore.data';
import { getEventMeta, formatEventDate } from './explore.helpers';
import { exploreStyles as styles } from './explore.styles';

export function EventCard({
  currentUserId,
  event,
  onInvite,
  onOpen,
}: {
  currentUserId?: string;
  event: EventSummary;
  onInvite: () => void;
  onOpen: () => void;
}) {
  const meta = getEventMeta(event);
  const isHostedByYou = event.host?.id === currentUserId;
  const statusLabel = isHostedByYou ? 'Hosted by you' : event.joined ? 'Going' : null;

  return (
    <Card style={styles.eventCard}>
      <Pressable onPress={onOpen}>
      <LinearGradient
        colors={[...meta.gradientColors, 'rgba(13,17,23,0.95)']}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.eventBanner}
      >
        <View style={styles.eventBannerContent}>
          <View style={styles.eventIconWrap}>
            <AppIcon name={meta.icon} size={22} color="#FFFFFF" />
          </View>
          {(event.category || statusLabel) && (
            <View style={styles.bannerBadgeRow}>
              {!!event.category && (
                <Chip label={event.category.toUpperCase()} active interactive={false} style={styles.categoryBadge as any} textStyle={styles.categoryBadgeText as any} />
              )}
              {statusLabel ? (
                <Chip label={statusLabel.toUpperCase()} active interactive={false} style={[styles.categoryBadge, styles.stateBadge] as any} textStyle={styles.categoryBadgeText as any} />
              ) : null}
            </View>
          )}
        </View>
      </LinearGradient>

      <View style={styles.eventBody}>
        <Text style={styles.eventTitle}>{event.title}</Text>
        <View style={styles.eventMetaRow}>
          <View style={styles.eventMetaInline}>
            <AppIcon name="calendar" size={13} color="rgba(240,246,252,0.65)" />
            <Text style={styles.eventMeta}>{formatEventDate(event.startsAt)}</Text>
          </View>
          <View style={styles.attendeesBadge}>
            <View style={styles.attendeesBadgeInner}>
              <AppIcon name="users" size={12} color="rgba(240,246,252,0.38)" />
              <Text style={styles.attendeesBadgeText}>{event.attendeesCount}</Text>
            </View>
          </View>
        </View>

        <View style={styles.eventActions}>
          <Button
            label={event.joined ? 'View again' : 'View event'}
            onPress={onOpen}
            variant={event.joined ? 'secondary' : 'accent'}
            style={styles.joinBtn}
          />
          <Button label="Share" onPress={onInvite} variant="ghost" style={styles.inviteBtn} />
        </View>
      </View>
      </Pressable>
    </Card>
  );
}

export function SpotCard({ spot }: { spot: (typeof ACTIVITY_SPOTS)[number] }) {
  return (
    <Card style={[styles.spotCard, { borderColor: spot.color + '30' }] as any}>
      <View style={[styles.spotIconWrap, { backgroundColor: spot.color + '18' }]}>
        <AppIcon name={spot.icon} size={18} color={spot.color} />
      </View>
      <Text style={styles.spotName} numberOfLines={1}>{spot.name}</Text>
      <Text style={styles.spotType}>{spot.type}</Text>
      <Text style={[styles.spotDistance, { color: spot.color }]}>{spot.distance}</Text>
    </Card>
  );
}

export function CommunityCard({
  onInvite,
  post,
}: {
  onInvite: () => void;
  post: (typeof COMMUNITY_POSTS)[number];
}) {
  return (
    <Card style={styles.communityCard} accent={post.color}>
      <View style={styles.communityInner}>
        <View style={styles.communityHeader}>
          <View style={[styles.avatar, { backgroundColor: post.color + '25', borderColor: post.color + '50' }]}>
            <Text style={[styles.avatarText, { color: post.color }]}>{post.initial}</Text>
          </View>
          <View style={styles.communityMeta}>
            <Text style={styles.communityUser}>{post.user}</Text>
            <Chip label={post.activity} active interactive={false} accentColor={post.color} style={[styles.activityPill, { backgroundColor: post.color + '18', borderColor: post.color + '40' }] as any} textStyle={[styles.activityPillText, { color: post.color }] as any} />
          </View>
          <View style={styles.spotsBadge}>
            <Text style={styles.spotsBadgeText}>{post.spots} open</Text>
          </View>
        </View>

        <Text style={styles.communityText}>{post.text}</Text>

        <View style={styles.communityActions}>
          <TouchableOpacity style={[styles.inviteSmallBtn, { borderColor: post.color + '35' }]} onPress={onInvite} activeOpacity={0.8}>
            <Text style={[styles.inviteSmallText, { color: post.color }]}>Share idea</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
}

export function SpotsRow({
  spots,
}: {
  spots: Array<(typeof ACTIVITY_SPOTS)[number]>;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.spotsRow} style={{ marginTop: 16 }}>
      {spots.map((spot) => (
        <SpotCard key={spot.id} spot={spot} />
      ))}
    </ScrollView>
  );
}
