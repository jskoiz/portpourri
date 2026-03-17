import React from 'react';
import { Text, View } from 'react-native';
import { fontFamily } from '../../../lib/fonts';
import { createStyles as styles } from './create.styles';

export function CreateHeader() {
  return (
    <View style={styles.header}>
      <Text style={styles.eyebrow}>CREATE</Text>
      <Text style={[styles.title, { fontFamily: fontFamily.serifBold, letterSpacing: -0.5 }]}>{`Create\nan event`}</Text>
      <Text style={styles.subtitle}>Choose an activity, set the details, and invite others.</Text>
    </View>
  );
}

