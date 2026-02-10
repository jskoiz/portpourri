import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import client from '../api/client';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ProfileDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { user } = route.params as any;

    if (!user) return null;

    const primaryPhoto = user.photos?.find((p: any) => p.isPrimary)?.storageKey;

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: primaryPhoto || 'https://via.placeholder.com/400' }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.backButtonText}>←</Text>
                    </TouchableOpacity>

                    <View style={styles.overlay}>
                        <Text style={styles.name}>{user.firstName}, {user.age}</Text>
                        <Text style={styles.location}>{user.profile?.city || 'Nearby'}</Text>
                    </View>
                </View>

                <View style={styles.content}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>About</Text>
                        <Text style={styles.bio}>{user.profile?.bio || 'No bio available.'}</Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Fitness Profile</Text>
                        <View style={styles.tagContainer}>
                            {user.fitnessProfile?.intensityLevel && (
                                <View style={styles.tag}>
                                    <Text style={styles.tagText}>{user.fitnessProfile.intensityLevel} intensity</Text>
                                </View>
                            )}
                            {user.fitnessProfile?.weeklyFrequencyBand && (
                                <View style={styles.tag}>
                                    <Text style={styles.tagText}>{user.fitnessProfile.weeklyFrequencyBand}x / week</Text>
                                </View>
                            )}
                            {user.fitnessProfile?.primaryGoal && (
                                <View style={styles.tag}>
                                    <Text style={styles.tagText}>{user.fitnessProfile.primaryGoal}</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.activities}>
                            Activities: {user.fitnessProfile?.favoriteActivities || 'None listed'}
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Looking For</Text>
                        <View style={styles.intentContainer}>
                            {user.profile?.intentDating && <Text style={styles.intentText}>❤️ Dating</Text>}
                            {user.profile?.intentWorkout && <Text style={styles.intentText}>💪 Workout Partner</Text>}
                            {user.profile?.intentFriends && <Text style={styles.intentText}>👋 Friends</Text>}
                        </View>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.passButton]}
                    onPress={async () => {
                        try {
                            await client.post(`/discovery/pass/${user.id}`);
                            navigation.goBack();
                        } catch (error) {
                            console.error('Error passing user:', error);
                        }
                    }}
                >
                    <Text style={styles.actionButtonText}>✕</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, styles.likeButton]}
                    onPress={async () => {
                        try {
                            const response = await client.post(`/discovery/like/${user.id}`);
                            if (response.data.status === 'match') {
                                // We can't easily show the match animation here without complex state management or navigation params back to Home.
                                // For now, let's just go back. The Home screen might need to refresh.
                                console.log('Match created from detail screen');
                            }
                            navigation.goBack();
                        } catch (error) {
                            console.error('Error liking user:', error);
                        }
                    }}
                >
                    <Text style={styles.actionButtonText}>♥</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    scrollContent: {
        paddingBottom: 100,
    },
    imageContainer: {
        width: SCREEN_WIDTH,
        height: SCREEN_WIDTH * 1.2,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    overlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingTop: 40,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    name: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    },
    location: {
        fontSize: 18,
        color: '#eee',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    },
    content: {
        padding: 20,
    },
    section: {
        marginBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
        paddingBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
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
        flexWrap: 'wrap',
    },
    intentText: {
        fontSize: 16,
        color: '#fff',
    },
    actionButtons: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 40,
    },
    actionButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    passButton: {
        backgroundColor: '#fff',
    },
    likeButton: {
        backgroundColor: '#ff4444', // Or a gradient if we had one
    },
    actionButtonText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#000', // For pass button
    },
});
