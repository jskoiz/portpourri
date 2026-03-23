import React, { PropsWithChildren, useEffect, useMemo } from 'react';
import {
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import type { BottomSheetModal as BottomSheetModalType } from '@gorhom/bottom-sheet';
import type { RefObject } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppIcon from '../../components/ui/AppIcon';
import { GlassView } from '../primitives/GlassView';
import { useTheme } from '../../theme/useTheme';
import { radii, spacing, typography } from '../../theme/tokens';

export function AppBottomSheet({
  children,
  contentContainerStyle,
  onChangeIndex,
  onDismiss,
  onRequestClose,
  refObject,
  scrollable = true,
  snapPoints = APP_BOTTOM_SHEET_SNAP_POINTS.standard,
  subtitle,
  title,
  visible,
}: AppBottomSheetProps) {
  let insets = { top: 0, right: 0, bottom: 0, left: 0 };
  try {
    insets = useSafeAreaInsets();
  } catch {
    // Tests may render sheets without a SafeAreaProvider.
  }
  const theme = useTheme();
  const resolvedSnapPoints = useMemo(() => [...snapPoints], [snapPoints]);
  const resolvedContentContainerStyle = useMemo(
    () =>
      StyleSheet.flatten([
        styles.contentContainer,
        { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.xl },
        contentContainerStyle,
      ]),
    [contentContainerStyle, insets.bottom],
  );
  const handleRequestClose = onRequestClose ?? onDismiss;

  useEffect(() => {
    const modal = refObject.current;
    if (!modal) return;

    if (visible) {
      modal.present();
    } else {
      modal.dismiss();
    }
  }, [refObject, visible]);

  return (
    <BottomSheetModal
      ref={refObject}
      index={0}
      onChange={onChangeIndex}
      onDismiss={onDismiss}
      snapPoints={resolvedSnapPoints}
      enableDismissOnClose
      enablePanDownToClose
      android_keyboardInputMode="adjustResize"
      backgroundStyle={[styles.sheetBackground, { backgroundColor: theme.surface }]}
      handleIndicatorStyle={[styles.handleIndicator, { backgroundColor: theme.primary + '30' }]}
      keyboardBehavior={Platform.OS === 'ios' ? 'interactive' : 'fillParent'}
      keyboardBlurBehavior="restore"
      style={styles.sheetOuter}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.55}
          pressBehavior="close"
          onPress={handleRequestClose}
        />
      )}
    >
      <View style={[styles.header, { borderBottomColor: theme.borderSoft }]}>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
          {subtitle ? <Text style={[styles.subtitle, { color: theme.textMuted }]}>{subtitle}</Text> : null}
        </View>
        <Pressable
          accessibilityLabel={`Close ${title}`}
          accessibilityRole="button"
          onPress={handleRequestClose}
          hitSlop={8}
          style={({ pressed }) => [{ opacity: pressed ? 0.76 : 1 }]}
        >
          <GlassView tier="thin" borderRadius={18} style={styles.closeButton}>
            <AppIcon name="x" size={16} color={theme.textPrimary} />
          </GlassView>
        </Pressable>
      </View>
      {scrollable ? (
        <BottomSheetScrollView
          style={styles.content}
          contentContainerStyle={resolvedContentContainerStyle}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </BottomSheetScrollView>
      ) : (
        <BottomSheetView style={resolvedContentContainerStyle}>
          {children}
        </BottomSheetView>
      )}
    </BottomSheetModal>
  );
}

export const APP_BOTTOM_SHEET_SNAP_POINTS = {
  compact: ['50%'],
  standard: ['62%'],
  form: ['72%'],
  tall: ['82%'],
} as const;

export type AppBottomSheetProps = PropsWithChildren<{
  contentContainerStyle?: StyleProp<ViewStyle>;
  onChangeIndex?: (index: number) => void;
  onDismiss: () => void;
  onRequestClose?: () => void;
  refObject: RefObject<BottomSheetModalType | null>;
  scrollable?: boolean;
  snapPoints?: ReadonlyArray<string | number>;
  subtitle?: string;
  title: string;
  visible: boolean;
}>;

const styles = StyleSheet.create({
  sheetOuter: {
    marginHorizontal: 8,
  },
  sheetBackground: {
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -6 },
    elevation: 10,
  },
  handleIndicator: {
    width: 48,
    height: 5,
    borderRadius: radii.pill,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    fontSize: typography.h3,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: typography.bodySmall,
    lineHeight: 20,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
});
