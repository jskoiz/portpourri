import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { render } from '@testing-library/react-native';
import AppCard from '../AppCard';

describe('AppCard', () => {
  it('renders children', () => {
    const { getByText } = render(
      <AppCard>
        <Text>Hello card</Text>
      </AppCard>,
    );
    expect(getByText('Hello card')).toBeTruthy();
  });

  it('renders children inside a flex:1 wrapper so they fill the card width', () => {
    // The card uses flexDirection:'row'. Children must be wrapped with flex:1
    // so they expand to fill the available width even when no accent prop
    // is provided. Previously the wrapper View had `undefined` style when no
    // accent was supplied, causing children to not fill the available width.
    const { getByText } = render(
      <AppCard>
        <Text>Content</Text>
      </AppCard>,
    );
    const content = getByText('Content');
    // In RNTL's fiber tree there are two Text nodes before reaching the wrapper
    // View (one for the element, one for the text node). The View with flex:1
    // is two levels up from getByText result.
    const wrapperView = content.parent?.parent;
    const flatStyle = StyleSheet.flatten(wrapperView?.props?.style ?? {});
    expect(flatStyle?.flex).toBe(1);
  });

  it('renders with accent strip', () => {
    const { getByText } = render(
      <AppCard accent="#FF0000">
        <Text>Accented</Text>
      </AppCard>,
    );
    expect(getByText('Accented')).toBeTruthy();
  });

  it('renders imageCard variant with children', () => {
    const { getByText } = render(
      <AppCard variant="imageCard" imageUri="https://example.com/photo.jpg">
        <Text>Image content</Text>
      </AppCard>,
    );
    expect(getByText('Image content')).toBeTruthy();
  });
});
