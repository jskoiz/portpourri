import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Chip } from '../../../design/primitives';
import { profileStyles as styles } from './profile.styles';

export function TagPill({
  color = '#7C6AF7',
  interactive = true,
  label,
  onPress,
  selected,
}: {
  color?: string;
  interactive?: boolean;
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Chip
      onPress={onPress}
      label={label}
      active={selected}
      accentColor={color}
      interactive={interactive}
      style={styles.tagPill as any}
      textStyle={styles.tagPillText as any}
    />
  );
}

export function EditableField({
  editMode,
  label,
  onChangeText,
  placeholder,
  value,
}: {
  editMode: boolean;
  label: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {editMode ? (
        <TextInput
          style={styles.fieldInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(240,246,252,0.35)"
          autoCapitalize="none"
        />
      ) : (
        <Text style={[styles.fieldValue, { color: value ? '#F0F6FC' : 'rgba(240,246,252,0.35)' }]}>
          {value || placeholder}
        </Text>
      )}
    </View>
  );
}
