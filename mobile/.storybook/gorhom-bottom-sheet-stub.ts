// Stub for @gorhom/bottom-sheet on web
// The library requires react-native-reanimated which isn't available in Vite

import React from 'react';

export const BottomSheetModal = React.forwardRef((_props: any, _ref: any) => null);
export const BottomSheetModalProvider = ({ children }: any) => children;
export const BottomSheetView = ({ children }: any) => children;
export const BottomSheetScrollView = ({ children }: any) => children;
export const BottomSheetFlatList = (_props: any) => null;
export const BottomSheetBackdrop = (_props: any) => null;
export const BottomSheetTextInput = React.forwardRef((_props: any, _ref: any) => null);

export default {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
  BottomSheetScrollView,
  BottomSheetFlatList,
  BottomSheetBackdrop,
  BottomSheetTextInput,
};
