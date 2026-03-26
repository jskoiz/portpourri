import React from 'react';
import { Alert, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Card } from '../../../design/primitives';
import { profileStyles as styles } from './profile.styles';

function SettingsRow({
  accessory = '›',
  icon,
  label,
  onPress,
  testID,
}: {
  accessory?: string;
  icon: string;
  label: string;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <TouchableOpacity
      testID={testID}
      style={[styles.settingsRow, { minHeight: 48 }]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.settingsIcon} importantForAccessibility="no">{icon}</Text>
      <Text style={styles.settingsLabel}>{label}</Text>
      <Text style={styles.settingsArrow} importantForAccessibility="no">{accessory}</Text>
    </TouchableOpacity>
  );
}

function SettingsToggleRow({
  icon,
  label,
  onValueChange,
  testID,
  value,
}: {
  icon: string;
  label: string;
  onValueChange: (value: boolean) => void;
  testID?: string;
  value: boolean;
}) {
  return (
    <View
      testID={testID}
      style={[styles.settingsRow, { minHeight: 48 }]}
      accessibilityLabel={label}
    >
      <Text style={styles.settingsIcon} importantForAccessibility="no">{icon}</Text>
      <Text style={styles.settingsLabel}>{label}</Text>
      <Switch
        testID={testID ? `${testID}-switch` : undefined}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E0D8CF', true: '#C4A882' }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

function BuildInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.buildInfoRow}>
      <Text style={styles.buildInfoLabel}>{label}</Text>
      <Text selectable style={styles.buildInfoValue}>{value}</Text>
    </View>
  );
}

export function ProfileSettingsSection({
  buildRows,
  hapticsOn,
  onOpenNotifications,
  onToggleBuildInfo,
  onToggleHaptics,
  showBuildInfo,
}: {
  buildRows: Array<{ label: string; value: string }>;
  hapticsOn: boolean;
  onOpenNotifications: () => void;
  onToggleBuildInfo: () => void;
  onToggleHaptics: (value: boolean) => void;
  showBuildInfo: boolean;
}) {
  return (
    <Card style={styles.settingsCard}>
      <SettingsRow icon="👤" label="Account" onPress={() => Alert.alert('Coming Soon', 'This feature is not yet available.')} />
      <View style={styles.fieldDivider} />
      <SettingsRow icon="🔒" label="Privacy" onPress={() => Alert.alert('Coming Soon', 'This feature is not yet available.')} />
      <View style={styles.fieldDivider} />
      <SettingsRow icon="🔔" label="Notifications" onPress={onOpenNotifications} />
      <View style={styles.fieldDivider} />
      <SettingsToggleRow testID="haptic-feedback-toggle" icon="📳" label="Haptic Feedback" value={hapticsOn} onValueChange={onToggleHaptics} />
      <View style={styles.fieldDivider} />
      <SettingsRow testID="build-provenance-toggle" icon="🧾" label="Build provenance" accessory={showBuildInfo ? '⌄' : '›'} onPress={onToggleBuildInfo} />
      {showBuildInfo ? (
        <>
          <View style={styles.fieldDivider} />
          <Card testID="build-provenance-panel" style={styles.buildInfoCard}>
            {buildRows.map((row, index) => (
              <View key={row.label}>
                <BuildInfoRow label={row.label} value={row.value} />
                {index < buildRows.length - 1 ? <View style={styles.buildInfoDivider} /> : null}
              </View>
            ))}
          </Card>
        </>
      ) : null}
    </Card>
  );
}
