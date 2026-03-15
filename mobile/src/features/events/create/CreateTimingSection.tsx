import React from 'react';
import { Text, View } from 'react-native';
import { Chip } from '../../../design/primitives';
import { createStyles as styles } from './create.styles';
import { SKILL_OPTIONS, TIME_OPTIONS, WHEN_OPTIONS } from './create.helpers';

function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

export function CreateTimingSection({
  onSelectSkill,
  onSelectTime,
  onSelectWhen,
  selectedTime,
  selectedWhen,
  skillLevel,
  timingError,
}: {
  onSelectSkill: (value: string) => void;
  onSelectTime: (value: string) => void;
  onSelectWhen: (value: string) => void;
  selectedTime: string;
  selectedWhen: string;
  skillLevel: string;
  timingError?: string;
}) {
  return (
    <>
      <View style={styles.formSection}>
        <SectionLabel label="When?" />
        <View style={styles.pillRow}>
          {WHEN_OPTIONS.map((option) => (
            <Chip
              key={option}
              label={option}
              active={selectedWhen === option}
              onPress={() => onSelectWhen(option)}
              accentColor="#7C6AF7"
            />
          ))}
        </View>
        <View style={[styles.pillRow, { marginTop: 12 }]}>
          {TIME_OPTIONS.map((option) => (
            <Chip
              key={option}
              label={option}
              active={selectedTime === option}
              onPress={() => onSelectTime(option)}
              accentColor="#F59E0B"
            />
          ))}
        </View>
        {timingError ? <Text style={styles.inlineError}>{timingError}</Text> : null}
      </View>

      <View style={styles.formSection}>
        <SectionLabel label="Skill level" />
        <View style={styles.pillRow}>
          {SKILL_OPTIONS.map((option) => (
            <Chip
              key={option}
              label={option}
              active={skillLevel === option}
              onPress={() => onSelectSkill(option)}
              accentColor="#34D399"
            />
          ))}
        </View>
      </View>
    </>
  );
}
