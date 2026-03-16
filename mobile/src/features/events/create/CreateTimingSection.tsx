import React from 'react';
import { Text, View } from 'react-native';
import { Chip } from '../../../design/primitives';
import { createStyles as styles } from './create.styles';
import { SKILL_OPTIONS, TIME_OPTIONS, WHEN_OPTIONS } from './create.helpers';

function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

export function CreateTimingSection({
  onChangeSpots,
  onSelectSkill,
  onSelectTime,
  onSelectWhen,
  selectedTime,
  selectedWhen,
  skillLevel,
  spots,
  timingError,
}: {
  onChangeSpots?: (value: number) => void;
  onSelectSkill: (value: string) => void;
  onSelectTime: (value: string) => void;
  onSelectWhen: (value: string) => void;
  selectedTime: string;
  selectedWhen: string;
  skillLevel: string;
  spots?: number;
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
              accentColor="#C4A882"
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
              accentColor="#C4A882"
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
              accentColor="#8BAA7A"
            />
          ))}
        </View>
      </View>
      {typeof spots === 'number' && onChangeSpots ? (
        <View style={styles.formSection}>
          <SectionLabel label="Spots available" />
          <View style={styles.stepperRow}>
            <Chip label="Less" onPress={() => onChangeSpots(Math.max(1, spots - 1))} accentColor="#C4A882" />
            <View style={styles.stepperValueWrap}>
              <Text style={styles.stepperValue}>{spots}</Text>
              <Text style={styles.stepperSub}>open spots</Text>
            </View>
            <Chip label="More" onPress={() => onChangeSpots(Math.min(10, spots + 1))} accentColor="#8BAA7A" />
          </View>
        </View>
      ) : null}
    </>
  );
}
