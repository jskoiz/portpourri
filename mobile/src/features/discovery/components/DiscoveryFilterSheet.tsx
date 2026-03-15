import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { Button, Chip } from '../../../design/primitives';
import { homeStyles as styles } from './home.styles';
import {
  availabilityOptions,
  goalOptions,
  intensityOptions,
  type FilterModalState,
} from './discoveryFilters';

function ModalFilterPill({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Chip
      onPress={onPress}
      label={label}
      active={active}
      accentColor="#7C6AF7"
      style={[styles.filterPill, active ? styles.filterPillActive : styles.filterPillInactive] as any}
      textStyle={[styles.filterPillText, { textTransform: 'capitalize' }] as any}
    />
  );
}

export function DiscoveryFilterSheet({
  onApply,
  onChangeAvailability,
  onChangeDistanceKm,
  onChangeGoals,
  onChangeIntensity,
  onChangeMaxAge,
  onChangeMinAge,
  onClose,
  onUndoSwipe,
  state,
  visible,
}: {
  onApply: () => void;
  onChangeAvailability: (value: 'morning' | 'evening') => void;
  onChangeDistanceKm: (value: string) => void;
  onChangeGoals: (value: string) => void;
  onChangeIntensity: (value: string) => void;
  onChangeMaxAge: (value: string) => void;
  onChangeMinAge: (value: string) => void;
  onClose: () => void;
  onUndoSwipe: () => void;
  state: FilterModalState;
  visible: boolean;
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalContainer}
      >
        <View style={styles.modalHandle} />
        <Text style={styles.modalTitle}>Filters</Text>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalContent}>
          <Text style={styles.filterSectionLabel}>Distance & Age</Text>
          <View style={styles.filterInputRow}>
            <TextInput
              style={styles.miniInput}
              value={state.distanceKm}
              onChangeText={onChangeDistanceKm}
              placeholder="km"
              placeholderTextColor="rgba(255,255,255,0.3)"
              keyboardType="numeric"
            />
            <TextInput
              style={styles.miniInput}
              value={state.minAge}
              onChangeText={onChangeMinAge}
              placeholder="Min age"
              placeholderTextColor="rgba(255,255,255,0.3)"
              keyboardType="numeric"
            />
            <TextInput
              style={styles.miniInput}
              value={state.maxAge}
              onChangeText={onChangeMaxAge}
              placeholder="Max age"
              placeholderTextColor="rgba(255,255,255,0.3)"
              keyboardType="numeric"
            />
          </View>

          <Text style={styles.filterSectionLabel}>Goals</Text>
          <View style={styles.pillWrap}>
            {goalOptions.map((goal) => (
              <ModalFilterPill
                active={state.goals.includes(goal)}
                key={goal}
                label={goal}
                onPress={() => onChangeGoals(goal)}
              />
            ))}
          </View>

          <Text style={styles.filterSectionLabel}>Intensity</Text>
          <View style={styles.pillWrap}>
            {intensityOptions.map((option) => (
              <ModalFilterPill
                active={state.intensity.includes(option)}
                key={option}
                label={option}
                onPress={() => onChangeIntensity(option)}
              />
            ))}
          </View>

          <Text style={styles.filterSectionLabel}>Availability</Text>
          <View style={styles.pillWrap}>
            {availabilityOptions.map((option) => (
              <ModalFilterPill
                active={state.availability.includes(option)}
                key={option}
                label={option}
                onPress={() => onChangeAvailability(option)}
              />
            ))}
          </View>

          <View style={styles.modalActions}>
            <Button label="Undo swipe" onPress={onUndoSwipe} variant="ghost" style={{ flex: 1 }} />
            <Button label="Apply" onPress={onApply} variant="primary" style={{ flex: 1 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
