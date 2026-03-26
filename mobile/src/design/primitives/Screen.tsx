import React, { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import AppBackdrop from '../../components/ui/AppBackdrop';

export function Screen({
  children,
  backgroundColor,
  padding = 16,
  edges = ['top', 'bottom'],
}: PropsWithChildren<{
  backgroundColor?: string;
  edges?: Edge[];
  padding?: number;
}>) {
  return (
    <SafeAreaView edges={edges} style={[styles.container, backgroundColor ? { backgroundColor } : null]}>
      <AppBackdrop />
      <View style={[styles.content, { padding }]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
