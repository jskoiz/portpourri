import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MOCK_ACTIVITIES = [
    {
        id: '1',
        title: 'Sunset Yoga',
        location: 'Santa Monica Beach',
        time: 'Today, 6:00 PM',
        image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80',
        category: 'Yoga'
    },
    {
        id: '2',
        title: 'Run Club 5k',
        location: 'Venice Boardwalk',
        time: 'Tomorrow, 7:00 AM',
        image: 'https://images.unsplash.com/photo-1552674605-469523170d9e?w=800&q=80',
        category: 'Running'
    },
    {
        id: '3',
        title: 'Bouldering Session',
        location: 'Sender One LAX',
        time: 'Wed, 5:30 PM',
        image: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=800&q=80',
        category: 'Climbing'
    },
    {
        id: '4',
        title: 'HIIT Class',
        location: 'Barry\'s Bootcamp',
        time: 'Thu, 6:00 PM',
        image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
        category: 'Gym'
    },
];

export default function ExploreScreen() {
    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity style={styles.card}>
            <Image source={{ uri: item.image }} style={styles.image} />
            <View style={styles.overlay}>
                <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{item.category}</Text>
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardLocation}>📍 {item.location}</Text>
                <Text style={styles.cardTime}>🕒 {item.time}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Explore</Text>
                <Text style={styles.subtitle}>Find activities near you</Text>
            </View>
            <FlatList
                data={MOCK_ACTIVITIES}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        padding: 20,
        paddingBottom: 10,
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
    },
    list: {
        padding: 20,
    },
    card: {
        height: 200,
        marginBottom: 20,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#1a1a1a',
    },
    image: {
        width: '100%',
        height: '100%',
        opacity: 0.7,
    },
    overlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: 'linear-gradient(transparent, rgba(0,0,0,0.8))', // React Native doesn't support linear-gradient string like this, but we'll rely on the image opacity for now or add a view
    },
    categoryBadge: {
        position: 'absolute',
        top: -140, // Hacky positioning relative to bottom overlay, better to put it in top container
        right: 16,
        backgroundColor: '#fff',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    categoryText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 12,
    },
    cardTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    },
    cardLocation: {
        fontSize: 14,
        color: '#ddd',
        marginBottom: 2,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    },
    cardTime: {
        fontSize: 14,
        color: '#ff4444',
        fontWeight: '600',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    },
});
