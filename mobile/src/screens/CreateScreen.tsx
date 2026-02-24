import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppInput from '../components/ui/AppInput';
import AppCard from '../components/ui/AppCard';
import AppButton from '../components/ui/AppButton';
import { colors, spacing, typography } from '../theme/tokens';

export default function CreateScreen() {
  const [activity, setActivity] = useState('');
  const [location, setLocation] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.kicker}>Host mode</Text>
        <Text style={styles.title}>Create</Text>
        <Text style={styles.subtitle}>Styled placeholder flow ready for backend wiring.</Text>

        <AppCard>
          <AppInput label="Activity" placeholder="Hiking, lifting, tennis" value={activity} onChangeText={setActivity} />
          <AppInput label="Location" placeholder="Gym, park, neighborhood" value={location} onChangeText={setLocation} />
          <AppInput label="Time" placeholder="Tomorrow at 6 PM" value={time} onChangeText={setTime} />
          <AppInput label="Description" placeholder="Pace, level, and details" value={description} onChangeText={setDescription} multiline />
          <AppButton label="Posting soon" onPress={() => {}} disabled />
          <View style={styles.noteWrap}>
            <Text style={styles.noteTitle}>Coming soon</Text>
            <Text style={styles.note}>The visual treatment is final-ready; publishing behavior is intentionally unchanged.</Text>
          </View>
        </AppCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.xl },
  kicker: { color: colors.accentSoft, fontSize: typography.caption, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '700' },
  title: { fontSize: typography.h1, color: colors.textPrimary, fontWeight: '800', marginTop: spacing.xs },
  subtitle: { fontSize: typography.body, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.xl },
  noteWrap: { marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  noteTitle: { color: colors.textPrimary, fontWeight: '700', marginBottom: spacing.xs },
  note: { fontSize: typography.bodySmall, color: colors.textMuted, lineHeight: 20 },
});
