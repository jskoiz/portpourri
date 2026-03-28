import React from 'react';
import {
  Pressable,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import type { EventSummary } from '../../../api/types';
import AppBackButton from '../../../components/ui/AppBackButton';
import AppIcon from '../../../components/ui/AppIcon';
import { ScreenScaffold, SectionBlock, StatePanel } from '../../../design/primitives';
import type { Theme } from '../../../theme/tokens';
import type { MainTabParamList } from '../../../core/navigation/types';
import {
  formatEventDate,
  MY_EVENTS_TABS,
  type MyEventsTabKey,
} from './myEvents.helpers';
import { myEventsStyles as styles } from './myEvents.styles';

export function MyEventsScreenContent({
  activeTab,
  canGoBack,
  displayedEvents,
  emptyState,
  errorMessage,
  isLoading,
  isRefetching,
  onEventPress,
  onGoBack,
  onRefresh,
  onSelectTab,
  onTabEmptyCtaPress,
  tabCounts,
  theme,
}: {
  activeTab: MyEventsTabKey;
  canGoBack: boolean;
  displayedEvents: EventSummary[];
  emptyState: {
    body: string;
    cta: string;
    icon: 'calendar' | 'plus-circle';
    route: keyof MainTabParamList;
    title: string;
  };
  errorMessage: string | null;
  isLoading: boolean;
  isRefetching: boolean;
  onEventPress: (eventId: string) => void;
  onGoBack: () => void;
  onRefresh: () => void;
  onSelectTab: (tab: MyEventsTabKey) => void;
  onTabEmptyCtaPress: (route: keyof MainTabParamList) => void;
  tabCounts: Readonly<Record<MyEventsTabKey, number>>;
  theme: Theme;
}) {
  return (
    <ScreenScaffold style={[styles.container, { backgroundColor: theme.background }]}>
      <SectionBlock spacingMode="tight">
        <View style={styles.header}>
          {canGoBack ? <AppBackButton onPress={onGoBack} /> : null}
          <View style={styles.headerCopy}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>My Events</Text>
          </View>
        </View>
      </SectionBlock>

      <SectionBlock spacingMode="tight">
        <View style={[styles.tabBar, { backgroundColor: theme.chipSurface }]}>
          {MY_EVENTS_TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab &&
                  [styles.tabActive, { backgroundColor: theme.selectedFill }],
                { minHeight: 44, justifyContent: 'center' },
              ]}
              onPress={() => onSelectTab(tab)}
              activeOpacity={0.8}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === tab }}
              accessibilityLabel={`${tab} events, ${tabCounts[tab]} items`}
            >
              <View style={styles.tabContent}>
                <Text
                  style={[
                    styles.tabText,
                    {
                      color:
                        activeTab === tab ? theme.selectedText : theme.textSecondary,
                    },
                  ]}
                >
                  {tab}
                </Text>
                <View
                  testID={`my-events-tab-${tab.toLowerCase()}-count`}
                  style={[
                    styles.tabCount,
                    {
                      backgroundColor:
                        activeTab === tab ? theme.surface : theme.subduedSurface,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabCountText,
                      {
                        color:
                          activeTab === tab ? theme.textPrimary : theme.textSecondary,
                      },
                    ]}
                  >
                    {tabCounts[tab]}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </SectionBlock>

      {isLoading ? (
        <StatePanel title="Loading your events" loading />
      ) : errorMessage ? (
        <StatePanel
          title="Couldn't load events"
          description={errorMessage}
          actionLabel="Try again"
          onAction={onRefresh}
          isError
        />
      ) : displayedEvents.length === 0 ? (
        <SectionBlock style={styles.emptyStateSection}>
          <View style={styles.emptyState}>
            <View
              style={[
                styles.emptyIconWrap,
                {
                  backgroundColor: theme.accentSoft,
                },
              ]}
            >
              <AppIcon name={emptyState.icon} size={24} color={theme.accentPrimary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              {emptyState.title}
            </Text>
            <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>
              {emptyState.body}
            </Text>
            <TouchableOpacity
              style={[
                styles.emptyCta,
                { backgroundColor: theme.selectedFill, minHeight: 48 },
              ]}
              onPress={() => onTabEmptyCtaPress(emptyState.route)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={emptyState.cta}
            >
              <Text style={[styles.emptyCtaText, { color: theme.selectedText }]}>
                {emptyState.cta}
              </Text>
            </TouchableOpacity>
          </View>
        </SectionBlock>
      ) : (
        <FlashList
          contentContainerStyle={styles.list}
          data={displayedEvents}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching && !isLoading}
              onRefresh={onRefresh}
              tintColor={theme.primary}
            />
          }
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: theme.surface,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
              onPress={() => {
                if (!item.id) return;
                onEventPress(item.id);
              }}
            >
              {!!item.category ? (
                <View
                  style={[
                    styles.cardCategoryBar,
                    { backgroundColor: theme.accentSoft },
                  ]}
                >
                  <Text style={[styles.cardCategory, { color: theme.accentPrimary }]}>
                    {item.category}
                  </Text>
                </View>
              ) : null}
              <View style={styles.cardBody}>
                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                  {item.title}
                </Text>
                <View style={styles.cardMetaRow}>
                  <AppIcon name="calendar" size={13} color={theme.textSecondary} />
                  <Text style={[styles.cardMeta, { color: theme.textSecondary }]}>
                    {formatEventDate(item.startsAt)}
                  </Text>
                </View>
                {!!item.location ? (
                  <View style={styles.cardMetaRow}>
                    <AppIcon name="map-pin" size={13} color={theme.textMuted} />
                    <Text style={[styles.cardMeta, { color: theme.textMuted }]}>
                      {item.location}
                    </Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          )}
        />
      )}
    </ScreenScaffold>
  );
}
