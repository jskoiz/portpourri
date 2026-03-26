import React from 'react';
import { type QueryKey, useQueryClient } from '@tanstack/react-query';
import { View } from 'react-native';
import { Button } from '../../design/primitives';
import { useSheetController } from '../../design/sheets/useSheetController';

type SheetStoryRenderProps = {
  close: () => void;
  controller: ReturnType<typeof useSheetController>['sheetProps'];
  open: () => void;
};

export function QuerySeededSheetStory<T>({
  buttonLabel,
  children,
  queryData,
  queryKey,
}: {
  buttonLabel: string;
  children: (props: SheetStoryRenderProps) => React.ReactNode;
  queryData: T;
  queryKey: QueryKey;
}) {
  const queryClient = useQueryClient();
  const sheet = useSheetController();

  React.useEffect(() => {
    const previousData = queryClient.getQueryData(queryKey);
    queryClient.setQueryData(queryKey, queryData);

    return () => {
      if (previousData === undefined) {
        queryClient.removeQueries({ queryKey, exact: true });
        return;
      }

      queryClient.setQueryData(queryKey, previousData);
    };
  }, [queryClient, queryData, queryKey]);

  React.useEffect(() => {
    sheet.open();
  }, [sheet.open]);

  return (
    <View style={{ flex: 1, justifyContent: 'flex-end', padding: 20 }}>
      <Button label={buttonLabel} onPress={sheet.open} variant="secondary" />
      {children({ controller: sheet.sheetProps, close: sheet.close, open: sheet.open })}
    </View>
  );
}
