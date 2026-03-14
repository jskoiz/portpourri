import React from 'react';
import { Text, View } from 'react-native';
import { createStyles as styles } from './create.styles';

export function CreateHeader() {
  return (
    <View style={styles.header}>
      <Text style={styles.eyebrow}>HOST FLOW / INVITATION-FIRST</Text>
      <Text style={styles.title}>{`Invite people\nto move.`}</Text>
      <Text style={styles.subtitle}>Pick the activity, set timing, then publish one clean invite.</Text>
    </View>
  );
}

