import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import client from '../api/client';

export default function ProfileScreen() {
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        if (!user?.id) return;
        try {
            const response = await client.get('/profile');
            setProfile(response.data);
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#fff" />
            </View>
        );
    }

    if (!profile) return null;

    const primaryPhoto = profile.photos?.find((p: any) => p.isPrimary)?.storageKey;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Profile</Text>
                    <TouchableOpacity onPress={logout}>
                        <Text style={styles.logoutText}>Log Out</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.profileHeader}>
                    <Image
                        source={{ uri: primaryPhoto || 'https://via.placeholder.com/150' }}
                        style={styles.avatar}
                    />
                    <Text style={styles.name}>{profile.firstName}, {profile.age}</Text>
                    <Text style={styles.location}>{profile.profile?.city || 'Unknown City'}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About</Text>
                    <Text style={styles.bio}>{profile.profile?.bio || 'No bio yet.'}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Fitness Profile</Text>
                    <View style={styles.tagContainer}>
                        <View style={styles.tag}>
                            <Text style={styles.tagText}>{profile.fitnessProfile?.intensityLevel} intensity</Text>
                        </View>
                        <View style={styles.tag}>
                            <Text style={styles.tagText}>{profile.fitnessProfile?.weeklyFrequencyBand}x / week</Text>
                        </View>
                        <View style={styles.tag}>
                            <Text style={styles.tagText}>{profile.fitnessProfile?.primaryGoal}</Text>
                        </View>
                    </View>
                    <Text style={styles.activities}>
                        Activities: {profile.fitnessProfile?.favoriteActivities || 'None listed'}
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Intent</Text>
                    <View style={styles.intentContainer}>
                        {profile.profile?.intentDating && <Text style={styles.intentText}>❤️ Dating</Text>}
                        {profile.profile?.intentWorkout && <Text style={styles.intentText}>💪 Workout Partner</Text>}
                    </View>
                </View>

                <TouchableOpacity style={styles.editButton}>
                    <Text style={styles.editButtonText}>Edit Profile</Text>
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
    loadingContainer: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    logoutText: {
        color: '#ff4444',
        fontSize: 16,
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: 30,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#333',
    },
    name: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    location: {
        fontSize: 16,
        color: '#888',
    },
    section: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#222',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 12,
    },
    bio: {
        fontSize: 16,
        color: '#ccc',
        lineHeight: 24,
    },
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 12,
    },
    tag: {
        backgroundColor: '#333',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 8,
        marginBottom: 8,
    },
    tagText: {
        color: '#fff',
        fontSize: 14,
        textTransform: 'capitalize',
    },
    activities: {
        fontSize: 16,
        color: '#ccc',
    },
    intentContainer: {
        flexDirection: 'row',
        gap: 16,
    },
    intentText: {
        fontSize: 16,
        color: '#fff',
    },
    editButton: {
        margin: 20,
        backgroundColor: '#333',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    editButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    }
});
