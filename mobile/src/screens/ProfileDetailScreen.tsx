import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import client from '../api/client';
import { normalizeApiError } from '../api/errors';
import { colors, radii, shadows, spacing, typography } from '../theme/tokens';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ProfileDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { user } = route.params as any;
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;

  const primaryPhoto = user.photos?.find((p: any) => p.isPrimary)?.storageKey || user.photoUrl;

  const handlePass = async () => {
    setSubmitting(true);
    try {
      await client.post(`/discovery/pass/${user.id}`);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Could not pass profile', normalizeApiError(error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async () => {
    setSubmitting(true);
    try {
      await client.post(`/discovery/like/${user.id}`);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Could not like profile', normalizeApiError(error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: primaryPhoto || 'https://via.placeholder.com/400' }} style={styles.image} resizeMode="cover" />
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.overlay}>
            <Text style={styles.name}>{user.firstName || 'Someone'}, {user.age ?? '--'}</Text>
            <Text style={styles.location}>{user.profile?.city || 'Nearby'}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={[styles.section, shadows.soft]}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bio}>{user.profile?.bio || 'No bio available yet.'}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={[styles.actionButton, styles.passButton, submitting && styles.disabled]} onPress={handlePass} disabled={submitting} activeOpacity={0.86}>
          <Text style={styles.passText}>Pass</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.likeButton, submitting && styles.disabled]} onPress={handleLike} disabled={submitting} activeOpacity={0.86}>
          <Text style={styles.likeText}>Like</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: 108 },
  imageContainer: { width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.18, position: 'relative' },
  image: { width: '100%', height: '100%' },
  backButton: {
    position: 'absolute', top: 50, left: 16, width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)'
  },
  backButtonText: { color: colors.textPrimary, fontSize: 22 },
  overlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.xl, backgroundColor: 'rgba(5,7,13,0.58)' },
  name: { fontSize: typography.h1, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.xs },
  location: { fontSize: typography.body, color: colors.textSecondary },
  content: { padding: spacing.xl },
  section: { marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, borderRadius: radii.xl, backgroundColor: colors.surfaceGlass },
  sectionTitle: { fontSize: typography.h3, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  bio: { fontSize: typography.body, color: colors.textSecondary, lineHeight: 24 },
  actionButtons: { position: 'absolute', bottom: 24, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: spacing.md },
  actionButton: {
    minWidth: 132,
    minHeight: 54,
    borderRadius: radii.pill,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  passButton: { backgroundColor: colors.surface, borderColor: colors.borderSoft },
  likeButton: { backgroundColor: colors.primary, borderColor: '#B2A5FF' },
  passText: { color: colors.textPrimary, fontWeight: '800' },
  likeText: { color: colors.black, fontWeight: '800' },
  disabled: { opacity: 0.7 },
});
