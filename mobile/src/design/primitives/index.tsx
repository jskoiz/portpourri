import React, { PropsWithChildren } from 'react';
import { Text, XStack, YStack } from 'tamagui';

const StackPrimitive = YStack as React.ComponentType<any>;
const InlinePrimitive = XStack as React.ComponentType<any>;
const TextPrimitive = Text as React.ComponentType<any>;

export function Screen({
  children,
  padding = 16,
}: PropsWithChildren<{ padding?: number }>) {
  return (
    <StackPrimitive flex={1} style={{ padding }}>
      {children}
    </StackPrimitive>
  );
}

export const AppStack = StackPrimitive;
export const Inline = InlinePrimitive;
export const Surface = StackPrimitive;
export const AppText = TextPrimitive;
