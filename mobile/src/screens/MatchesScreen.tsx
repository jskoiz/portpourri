import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import client from '../api/client';

export default function MatchesScreen() {
    const navigation = useNavigation<any>();
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchMatches = async () => {
        try {
            const response = await client.get('/matches');
            setMatches(response.data);
        } catch (error) {
            console.error('Error fetching matches:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchMatches();
        }, [])
    );

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.matchItem}
            onPress={() => navigation.navigate('Chat', { matchId: item.id, user: item.user } as any)}
        >
            {item.user.photoUrl ? (
                <Image source={{ uri: item.user.photoUrl }} style={styles.avatar} />
            ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Text style={styles.avatarText}>{item.user.firstName[0]}</Text>
                </View>
            )}
            <View style={styles.matchInfo}>
                <Text style={styles.name}>{item.user.firstName}</Text>
                <Text style={styles.lastMessage} numberOfLines={1}>
                    {item.lastMessage || 'Start a conversation'}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Matches</Text>
            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#fff" />
                </View>
            ) : matches.length === 0 ? (
                <View style={styles.centered}>
                    <Text style={styles.placeholder}>No matches yet. Start swiping!</Text>
                </View>
            ) : (
                <FlatList
                    data={matches}
                    renderItem={renderItem}
                    keyExtractor={(item: any) => item.id}
                    contentContainerStyle={styles.list}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholder: {
        color: '#666',
        fontSize: 16,
    },
    list: {
        paddingBottom: 20,
    },
    matchItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 15,
        backgroundColor: '#333',
    },
    avatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#444',
    },
    avatarText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    matchInfo: {
        flex: 1,
    },
    name: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    lastMessage: {
        color: '#999',
        fontSize: 14,
    },
});
