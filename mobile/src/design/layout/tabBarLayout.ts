import { Platform } from 'react-native';

export const TAB_BAR_EXPANDED = Platform.OS === 'ios' ? 62 : 58;
export const TAB_BAR_COLLAPSED = 46;
export const TAB_BAR_MARGIN_H = 12;
export const TAB_BAR_MARGIN_BOTTOM = 8;

export function getFloatingTabBarReservedHeight(bottomInset: number) {
  return TAB_BAR_EXPANDED + bottomInset + TAB_BAR_MARGIN_BOTTOM;
}
