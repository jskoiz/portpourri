import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import client from '../api/client';
import { useAuthStore } from '../store/authStore';

const INTENSITY_LEVELS = ['light', 'moderate', 'intense', 'athlete'];
const FREQUENCY_BANDS = ['1-2', '3-4', '5-6', '7+'];
const GOALS = ['performance', 'aesthetics', 'health', 'weight-loss'];

export default function OnboardingScreen({ navigation }: any) {
    const [intensity, setIntensity] = useState('moderate');
    const [frequency, setFrequency] = useState('3-4');
    const [goal, setGoal] = useState('health');
    const [activities, setActivities] = useState('');

    const user = useAuthStore((state) => state.user);
    const setUser = useAuthStore((state) => state.setUser); // Need to add setUser to store

    const handleSubmit = async () => {
        try {
            await client.put('/profile/fitness', {
                intensityLevel: intensity,
                weeklyFrequencyBand: frequency,
                primaryGoal: goal,
                favoriteActivities: activities,
            });

            // Update local user state
            if (user) {
                setUser({ ...user, isOnboarded: true });
            }

            // Navigate to Main or reset stack
            navigation.reset({
                index: 0,
                routes: [{ name: 'Main' }],
            });
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to save profile');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.title}>Fitness Profile</Text>
                <Text style={styles.subtitle}>Tell us about your active lifestyle.</Text>

                <View style={styles.section}>
                    <Text style={styles.label}>Intensity Level</Text>
                    <View style={styles.optionsRow}>
                        {INTENSITY_LEVELS.map((level) => (
                            <TouchableOpacity
                                key={level}
                                style={[styles.option, intensity === level && styles.optionSelected]}
                                onPress={() => setIntensity(level)}
                            >
                                <Text style={[styles.optionText, intensity === level && styles.optionTextSelected]}>
                                    {level.charAt(0).toUpperCase() + level.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Workouts per Week</Text>
                    <View style={styles.optionsRow}>
                        {FREQUENCY_BANDS.map((band) => (
                            <TouchableOpacity
                                key={band}
                                style={[styles.option, frequency === band && styles.optionSelected]}
                                onPress={() => setFrequency(band)}
                            >
                                <Text style={[styles.optionText, frequency === band && styles.optionTextSelected]}>
                                    {band}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Primary Goal</Text>
                    <View style={styles.optionsRow}>
                        {GOALS.map((g) => (
                            <TouchableOpacity
                                key={g}
                                style={[styles.option, goal === g && styles.optionSelected]}
                                onPress={() => setGoal(g)}
                            >
                                <Text style={[styles.optionText, goal === g && styles.optionTextSelected]}>
                                    {g.charAt(0).toUpperCase() + g.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                    <Text style={styles.buttonText}>Complete Profile</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    scrollContent: {
        padding: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#ccc',
        marginBottom: 30,
    },
    section: {
        marginBottom: 25,
    },
    label: {
        color: '#fff',
        fontSize: 18,
        marginBottom: 10,
        fontWeight: '600',
    },
    optionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    option: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 20,
        backgroundColor: '#1a1a1a',
        borderWidth: 1,
        borderColor: '#333',
    },
    optionSelected: {
        backgroundColor: '#fff',
        borderColor: '#fff',
    },
    optionText: {
        color: '#ccc',
        fontSize: 14,
    },
    optionTextSelected: {
        color: '#000',
        fontWeight: 'bold',
    },
    button: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 25,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 40,
    },
    buttonText: {
        color: '#000',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
