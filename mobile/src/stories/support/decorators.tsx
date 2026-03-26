import React from 'react';
import { View } from 'react-native';
import { StoryScreenFrame } from './StoryScreenFrame';

type StoryDecoratorOptions = {
  backgroundColor?: string;
  centered?: boolean;
  height?: number;
  padding?: number;
  width?: number;
};

export function withStorySurface(options: StoryDecoratorOptions = {}) {
  const {
    backgroundColor = '#FDFBF8',
    centered = true,
    padding = 24,
  } = options;

  return (Story: React.ComponentType) => (
    <View
      style={{
        flex: 1,
        alignItems: centered ? 'center' : 'stretch',
        justifyContent: centered ? 'center' : 'flex-start',
        padding,
        backgroundColor,
      }}
    >
      <Story />
    </View>
  );
}

export function withStoryBottomSurface(options: StoryDecoratorOptions = {}) {
  const {
    backgroundColor = '#FDFBF8',
    padding = 24,
  } = options;

  return (Story: React.ComponentType) => (
    <View
      style={{
        flex: 1,
        justifyContent: 'flex-end',
        padding,
        backgroundColor,
      }}
    >
      <Story />
    </View>
  );
}

export function withStoryScreenFrame(options: StoryDecoratorOptions = {}) {
  const {
    backgroundColor = '#FDFBF8',
    centered = true,
    height,
    width,
  } = options;

  return (Story: React.ComponentType) => (
    <StoryScreenFrame
      backgroundColor={backgroundColor}
      centered={centered}
      height={height}
      width={width}
    >
      <Story />
    </StoryScreenFrame>
  );
}
