import React from 'react';
import { Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
    <Pressable
      onPress={interactive ? onPress : undefined}
      style={[
        styles.tagPill,
        selected
          ? { backgroundColor: color + '22', borderColor: color + '70' }
          : { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.07)' },
      ]}
    >
      <Text style={[styles.tagPillText, { color: selected ? color : 'rgba(240,246,252,0.35)' }]}>{label}</Text>
    </Pressable>
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

export function ProfileHero({
  primaryPhoto,
  profile,
}: {
  primaryPhoto?: string;
  profile: any;
}) {
  return (
    <View style={styles.hero}>
      <View style={styles.avatarGlowWrap}>
        <LinearGradient colors={['#7C6AF7', '#34D399']} style={styles.avatarGlowRing}>
          <View style={styles.avatarInnerWrap}>
            {/* eslint-disable-next-line @typescript-eslint/no-require-imports */}
            <TouchableOpacity activeOpacity={1}>
              <Text />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
      <Text style={styles.heroName}>
        {profile.firstName}
        {profile.age ? `, ${profile.age}` : ''}
      </Text>
      <View style={styles.intentBadge}>
        <Text style={styles.intentBadgeText}>🏃 Active Mover</Text>
      </View>
      <Text style={styles.heroLocation}>📍 {profile.profile?.city || 'Location not set'}</Text>
      <View style={styles.ambientStats}>
        <View style={styles.ambientStat}>
          <Text style={[styles.ambientStatNum, { color: '#7C6AF7' }]}>12</Text>
          <Text style={styles.ambientStatLabel}>matches</Text>
        </View>
        <View style={styles.ambientStatDot} />
        <View style={styles.ambientStat}>
          <Text style={[styles.ambientStatNum, { color: '#34D399' }]}>8</Text>
          <Text style={styles.ambientStatLabel}>activities</Text>
        </View>
        <View style={styles.ambientStatDot} />
        <View style={styles.ambientStat}>
          <Text style={[styles.ambientStatNum, { color: '#F59E0B' }]}>5</Text>
          <Text style={styles.ambientStatLabel}>connections</Text>
        </View>
      </View>
    </View>
  );
}

