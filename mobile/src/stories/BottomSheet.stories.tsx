import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { Text, View } from 'react-native';
import {
  AppBottomSheet,
  APP_BOTTOM_SHEET_SNAP_POINTS,
} from '../design/sheets/AppBottomSheet';
import { useSheetController } from '../design/sheets/useSheetController';
import { Button, Card } from '../design/primitives';

function BottomSheetStory() {
  const sheet = useSheetController();

  React.useEffect(() => {
    sheet.open();
  }, [sheet.open]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
      <Button label="Open sheet" onPress={sheet.open} />
      <AppBottomSheet
        {...sheet.sheetProps}
        title="Interaction sheet"
        subtitle="Shared shell for layered BRDG flows."
        snapPoints={APP_BOTTOM_SHEET_SNAP_POINTS.standard}
      >
        <Card>
          <Text style={{ color: '#F0F6FC', fontSize: 18, fontWeight: '800' }}>Reusable content</Text>
          <Text style={{ color: 'rgba(240,246,252,0.68)', marginTop: 8 }}>
            Discovery, create, explore, and chat can all compose this shell.
          </Text>
        </Card>
      </AppBottomSheet>
    </View>
  );
}

const meta = {
  title: 'Design/BottomSheet',
  component: BottomSheetStory,
} satisfies Meta<typeof BottomSheetStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
