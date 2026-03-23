import React, { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import AppBackButton from '../../../components/ui/AppBackButton';
import AppIcon from '../../../components/ui/AppIcon';
import { Button } from '../../../design/primitives';
import { useTheme } from '../../../theme/useTheme';
import { spacing } from '../../../theme/tokens';
import { profileDetailStyles as styles } from './profileDetail.styles';

export type ProfileDetailRow = {
  label: string;
  value: string;
};

export function ProfileDetailHero({
  activityTags,
  age,
  city,
  firstName,
  intentDisplay,
  onBack,
  onBlock,
  onReport,
  photoUri,
}: {
  activityTags: string[];
  age?: number | null;
  city?: string | null;
  firstName?: string | null;
  intentDisplay: string | null;
  onBack: () => void;
  onBlock: () => void;
  onReport: () => void;
  photoUri?: string | null;
}) {
  const theme = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);

  const dismissMenu = () => setMenuVisible(false);

  return (
    <View style={styles.heroContainer}>
      {photoUri ? (
        <Image
          source={{ uri: photoUri }}
          style={styles.heroImage}
          contentFit="cover"
          accessibilityLabel={`Photo of ${firstName || 'profile'}`}
        />
      ) : (
        <LinearGradient
          colors={['#F7F4F0', '#E8E2DA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroFallback}
          accessibilityLabel={`Avatar for ${firstName || 'profile'}`}
        >
          <Text
            style={[styles.heroFallbackText, { color: theme.textMuted }]}
            importantForAccessibility="no"
          >
            {firstName?.[0] || '?'}
          </Text>
        </LinearGradient>
      )}

      <LinearGradient
        colors={['transparent', 'rgba(253,251,248,0.7)', 'rgba(253,251,248,0.98)']}
        locations={[0, 0.55, 1]}
        style={styles.heroGradient}
      />

      <View style={styles.backButtonOverlay}>
        <AppBackButton onPress={onBack} style={{ marginBottom: 0 }} />
      </View>

      <View style={styles.overflowButtonOverlay}>
        <Pressable
          onPress={() => setMenuVisible((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel="More options"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.overflowButton}
        >
          <AppIcon name="more-vertical" size={18} color={theme.textPrimary} />
        </Pressable>
        {menuVisible && (
          <Modal transparent animationType="none" visible onRequestClose={dismissMenu}>
            <Pressable style={styles.overflowBackdrop} onPress={dismissMenu}>
              <View style={styles.overflowMenu}>
                <Pressable
                  onPress={() => {
                    dismissMenu();
                    onReport();
                  }}
                  style={styles.overflowMenuItem}
                  accessibilityRole="menuitem"
                >
                  <AppIcon name="flag" size={16} color={theme.textPrimary} />
                  <Text style={[styles.overflowMenuText, { color: theme.textPrimary }]}>Report</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    dismissMenu();
                    onBlock();
                  }}
                  style={styles.overflowMenuItem}
                  accessibilityRole="menuitem"
                >
                  <AppIcon name="slash" size={16} color={theme.danger} />
                  <Text style={[styles.overflowMenuText, { color: theme.danger }]}>Block</Text>
                </Pressable>
              </View>
            </Pressable>
          </Modal>
        )}
      </View>

      <View style={styles.heroNameOverlay}>
        {intentDisplay && (
          <View
            style={[
              styles.intentPill,
              { backgroundColor: theme.primarySubtle, borderColor: theme.primary },
            ]}
            accessibilityLabel={`Intent: ${intentDisplay}`}
          >
            <Text style={[styles.intentPillText, { color: theme.primary }]}>{intentDisplay}</Text>
          </View>
        )}
        <Text style={[styles.heroName, { color: theme.textPrimary }]}>
          {firstName || 'Someone'}{age ? `, ${age}` : ''}
        </Text>
        <View style={styles.locationRow}>
          <AppIcon name="map-pin" size={14} color={theme.textMuted} />
          <Text style={[styles.heroLocation, { color: theme.textMuted }]}>
            {city || 'Nearby'}
          </Text>
        </View>

        {activityTags.length > 0 && (
          <View
            style={styles.tagRow}
            accessibilityLabel={`Activities: ${activityTags.slice(0, 4).join(', ')}`}
          >
            {activityTags.slice(0, 4).map((tag, index) => (
              <View
                key={`${tag}-${index}`}
                style={[
                  styles.tag,
                  {
                    backgroundColor: index % 2 === 0 ? 'rgba(139,170,122,0.10)' : 'rgba(196,168,130,0.10)',
                    borderColor: index % 2 === 0 ? 'rgba(139,170,122,0.24)' : 'rgba(196,168,130,0.24)',
                  },
                ]}
                importantForAccessibility="no"
              >
                <Text
                  style={[
                    styles.tagText,
                    { color: index % 2 === 0 ? theme.success : theme.primary },
                  ]}
                >
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

export function ProfileDetailInfo({
  activityTags,
  bio,
  disabled = false,
  onSuggestActivity,
  structuredRows,
  weeklyFrequencyBand,
}: {
  activityTags: string[];
  bio?: string | null;
  disabled?: boolean;
  onSuggestActivity: () => void;
  structuredRows: ProfileDetailRow[];
  weeklyFrequencyBand?: string | null;
}) {
  const theme = useTheme();

  return (
    <View style={styles.contentArea}>
      {!!bio && (
        <View style={styles.section}>
          <Text
            style={[styles.sectionLabel, { color: theme.primary }]}
            accessibilityRole="header"
          >
            About
          </Text>
          <Text style={[styles.bio, { color: theme.textPrimary }]}>{bio}</Text>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.metaPanel}>
          {weeklyFrequencyBand ? (
            <View
              style={[
                styles.metaIntroCard,
                { backgroundColor: theme.backgroundSoft, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.metaIntroText, { color: theme.textPrimary }]}>
                Moves {weeklyFrequencyBand}x per week.
              </Text>
            </View>
          ) : null}

          {structuredRows.map((row) => (
            <StructuredRow key={row.label} label={row.label} value={row.value} />
          ))}
        </View>
      </View>

      {activityTags.length > 0 && (
        <View style={styles.section}>
          <Text
            style={[styles.sectionLabel, { color: theme.primary }]}
            accessibilityRole="header"
          >
            Movement Identity
          </Text>
          <View
            style={styles.activityPills}
            accessibilityLabel={`Movement identity: ${activityTags.slice(0, 3).join(', ')}`}
          >
            {activityTags.slice(0, 3).map((tag, index) => {
              const isAccent = index % 2 === 0;
              return (
                <View
                  key={tag}
                  style={[
                    styles.activityPill,
                    {
                      backgroundColor: isAccent ? 'rgba(139,170,122,0.10)' : 'rgba(196,168,130,0.10)',
                      borderColor: isAccent ? 'rgba(139,170,122,0.24)' : 'rgba(196,168,130,0.24)',
                    },
                  ]}
                  importantForAccessibility="no"
                >
                  <Text
                    style={[
                      styles.activityPillText,
                      { color: isAccent ? theme.success : theme.primary },
                    ]}
                  >
                    {tag}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      <Pressable
        onPress={onSuggestActivity}
        style={[styles.suggestBtn, { minHeight: 48 }]}
        accessibilityRole="button"
        accessibilityLabel="Suggest an activity"
        accessibilityHint="Opens a chat with a suggested plan"
        disabled={disabled}
      >
        <LinearGradient
          colors={['#D4C9B0', theme.primary]}
          style={styles.suggestBtnInner}
        >
          <Text style={styles.suggestBtnText}>Suggest activity</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

export function ProfileDetailActions({
  bottomInset,
  onLike,
  onPass,
  submitting,
}: {
  bottomInset: number;
  onLike: () => void;
  onPass: () => void;
  submitting: boolean;
}) {
  return (
    <LinearGradient
      colors={['rgba(253,251,248,0)', 'rgba(253,251,248,0.95)', '#FDFBF8']}
      style={[styles.actionBar, { paddingBottom: Math.max(bottomInset, spacing.xxl) }]}
    >
      <View style={styles.actionRow}>
        <Button
          label="Pass"
          variant="secondary"
          onPress={onPass}
          disabled={submitting}
          style={styles.actionBtn}
        />
        <Button
          label="Like"
          variant="primary"
          onPress={onLike}
          disabled={submitting}
          loading={submitting}
          style={styles.actionBtnPrimary}
        />
      </View>
    </LinearGradient>
  );
}

function StructuredRow({ label, value }: ProfileDetailRow) {
  const theme = useTheme();

  return (
    <View style={styles.structuredRow} accessibilityLabel={`${label}: ${value}`}>
      <Text
        style={[styles.structuredLabel, { color: theme.textMuted }]}
        importantForAccessibility="no"
      >
        {label}
      </Text>
      <Text
        style={[styles.structuredValue, { color: theme.textPrimary }]}
        importantForAccessibility="no"
      >
        {value}
      </Text>
    </View>
  );
}
