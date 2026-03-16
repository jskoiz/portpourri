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
      handleIndicatorStyle={[styles.handleIndicator, { backgroundColor: theme.borderSoft }]}
      keyboardBehavior={Platform.OS === 'ios' ? 'interactive' : 'fillParent'}
      keyboardBlurBehavior="restore"
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
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
          {subtitle ? <Text style={[styles.subtitle, { color: theme.textMuted }]}>{subtitle}</Text> : null}
        </View>
        <Pressable
          accessibilityLabel={`Close ${title}`}
          onPress={handleRequestClose}
          hitSlop={8}
          style={({ pressed }) => [
            styles.closeButton,
            {
              backgroundColor: theme.surfaceElevated,
              opacity: pressed ? 0.76 : 1,
            },
          ]}
        >
          <AppIcon name="x" size={16} color={theme.textPrimary} />
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
  sheetBackground: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  handleIndicator: {
    width: 46,
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
    borderBottomWidth: 1,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
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
