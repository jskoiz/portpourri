import React from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/useTheme';
import { radii, spacing, typography } from '../theme/tokens';
import { useIntentStore, type SessionIntent } from '../store/intentStore';
import AppIcon from './ui/AppIcon';

interface IntentOption {
  key: SessionIntent;
  icon: React.ComponentProps<typeof AppIcon>['name'];
  title: string;
  subtitle: string;
}

const INTENT_OPTIONS: IntentOption[] = [
  {
    key: 'dating',
    icon: 'heart',
    title: 'Dating',
    subtitle: 'Meet someone special through shared movement',
  },
  {
    key: 'workout',
    icon: 'activity',
    title: 'Training Partner',
    subtitle: 'Find your perfect training companion',
  },
  {
    key: 'both',
    icon: 'shuffle',
    title: 'Open to both',
    subtitle: 'Keep it open to chemistry and momentum.',
  },
];

interface IntentSelectorProps {
  visible: boolean;
  onClose: () => void;
}

export default function IntentSelector({ visible, onClose }: IntentSelectorProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { sessionIntent, setIntent } = useIntentStore();

  const handleSelect = async (intent: SessionIntent) => {
    await setIntent(intent);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
      />
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: theme.surface,
            paddingBottom: Math.max(insets.bottom + spacing.lg, spacing.xxl),
          },
        ]}
      >
        {/* Handle */}
        <View style={[styles.handle, { backgroundColor: theme.borderSoft }]} />

        <Text style={[styles.title, { color: theme.textPrimary }]}>
          What's your vibe today?
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Choose your intent for this session
        </Text>

        <View style={styles.options}>
          {INTENT_OPTIONS.map((option) => {
            const selected = sessionIntent === option.key;
            return (
              <Pressable
                key={option.key}
                onPress={() => handleSelect(option.key)}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: selected ? theme.primarySubtle : theme.background,
                    borderColor: selected ? theme.primary : theme.border,
                    borderWidth: selected ? 2 : 1.5,
                  },
                ]}
              >
                <View style={[styles.optionIconWrap, { backgroundColor: selected ? theme.primarySubtle : theme.surfaceElevated }]}>
                  <AppIcon
                    name={option.icon}
                    size={18}
                    color={selected ? theme.primary : theme.textSecondary}
                  />
                </View>
                <View style={styles.optionText}>
                  <Text
                    style={[
                      styles.optionTitle,
                      { color: selected ? theme.primary : theme.textPrimary },
                    ]}
                  >
                    {option.title}
                  </Text>
                  <Text style={[styles.optionSubtitle, { color: theme.textSecondary }]}>
                    {option.subtitle}
                  </Text>
                </View>
                {selected && (
                  <View style={[styles.checkmark, { backgroundColor: theme.primary }]}>
                    <AppIcon name="check" size={12} color={theme.textInverse} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

export function intentLabel(intent: SessionIntent): string {
  if (intent === 'dating') return 'Dating';
  if (intent === 'workout') return 'Training';
  return 'Open to both';
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.xxl,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -6 },
    elevation: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.h2,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.body,
    marginBottom: spacing.xxl,
  },
  options: {
    gap: spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  optionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: typography.h3,
    fontWeight: '800',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: typography.bodySmall,
    lineHeight: 20,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
