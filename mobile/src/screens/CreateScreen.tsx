import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CreateScreen() {
    const [activity, setActivity] = useState('');
    const [location, setLocation] = useState('');
    const [time, setTime] = useState('');
    const [description, setDescription] = useState('');

    const handleCreate = () => {
        // Demo-only: this screen is UI polish, not a real backend-backed feature yet.
        // Keep it non-blocking and avoid noisy alerts during demos.
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.title}>Create Invite</Text>
                <Text style={styles.subtitle}>Find partners for your next workout</Text>
                <View style={styles.callout}>
                    <Text style={styles.calloutTitle}>Demo note</Text>
                    <Text style={styles.calloutText}>
                        This flow is UI-complete for the demo. Posting invites is next (backend + notifications).
                    </Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Activity</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Hiking, Lifting, Tennis"
                            placeholderTextColor="#666"
                            value={activity}
                            onChangeText={setActivity}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Location</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Runyon Canyon, Gold's Gym"
                            placeholderTextColor="#666"
                            value={location}
                            onChangeText={setLocation}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Time</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Tomorrow at 6pm"
                            placeholderTextColor="#666"
                            value={time}
                            onChangeText={setTime}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Description (Optional)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Any details? Pace, intensity, etc."
                            placeholderTextColor="#666"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={4}
                        />
                    </View>

                    <TouchableOpacity style={[styles.button, styles.buttonDisabled]} onPress={handleCreate} disabled>
                        <Text style={styles.buttonText}>Post Invite (Coming soon)</Text>
                    </TouchableOpacity>
                </View>
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
    },
    subtitle: {
        fontSize: 16,
        color: '#888',
        marginTop: 4,
        marginBottom: 30,
    },
    callout: {
        backgroundColor: '#101010',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 12,
        padding: 14,
        marginTop: 16,
        marginBottom: 6,
    },
    calloutTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 6,
    },
    calloutText: {
        color: '#aaa',
        fontSize: 14,
        lineHeight: 20,
    },
    form: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 16,
        color: '#fff',
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    button: {
        backgroundColor: '#ff4444',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
