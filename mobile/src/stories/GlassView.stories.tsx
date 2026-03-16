import React from 'react';
import { Text, View, StyleSheet, ImageBackground } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native';
import { GlassView } from '../design/primitives/GlassView';
import { withStorySurface } from './support';

function GlassShowcase({ tier, label }: { tier: any; label: string }) {
  return (
    <View style={styles.showcase}>
      <ImageBackground
        source={{ uri: 'https://picsum.photos/400/200' }}
        style={styles.bgImage}
        imageStyle={{ borderRadius: 16 }}
      >
        <GlassView tier={tier} borderRadius={16} specularHighlight style={styles.card}>
          <Text style={styles.tierLabel}>{label}</Text>
          <Text style={styles.tierDesc}>tier="{tier}"</Text>
        </GlassView>
      </ImageBackground>
    </View>
  );
}

function AllTiersStory() {
  return (
    <View style={styles.container}>
      <GlassShowcase tier="thin" label="Thin Glass" />
      <GlassShowcase tier="light" label="Light Glass" />
      <GlassShowcase tier="medium" label="Medium Glass" />
      <GlassShowcase tier="thick" label="Thick Glass" />
      <GlassShowcase tier="frosted" label="Frosted Glass" />
    </View>
  );
}

const meta = {
  title: 'Design/GlassView',
  component: AllTiersStory,
  decorators: [withStorySurface()],
} satisfies Meta<typeof AllTiersStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AllTiers: Story = {};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  showcase: {
    height: 120,
  },
  bgImage: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    padding: 16,
  },
  tierLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C2420',
    marginBottom: 4,
  },
  tierDesc: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8C8279',
  },
});
