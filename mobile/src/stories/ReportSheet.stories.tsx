import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { View } from 'react-native';
import { Button } from '../design/primitives';
import { useSheetController } from '../design/sheets/useSheetController';
import { ReportSheet } from '../features/moderation/components/ReportSheet';
import { withStoryScreenFrame } from './support';

function ReportSheetStory() {
  const sheet = useSheetController();

  React.useEffect(() => {
    sheet.open();
  }, [sheet.open]);

  return (
    <View style={{ flex: 1, justifyContent: 'flex-end', padding: 20 }}>
      <Button label="Open report sheet" onPress={sheet.open} variant="secondary" />
      <ReportSheet
        controller={sheet.sheetProps}
        onClose={sheet.close}
        reportedUserId="user-1"
        matchId="match-1"
      />
    </View>
  );
}

const meta = {
  title: 'Moderation/ReportSheet',
  component: ReportSheetStory,
  decorators: [withStoryScreenFrame({ height: 860 })],
} satisfies Meta<typeof ReportSheetStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
