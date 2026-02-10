import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import client from '../api/client';
import SwipeDeck from '../components/SwipeDeck';
import MatchAnimation from '../components/MatchAnimation';
import LoadingState from '../components/LoadingState';

export default function HomeScreen({ navigation }: any) {
    const user = useAuthStore((state) => state.user);
    const [feed, setFeed] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showMatch, setShowMatch] = useState(false);
    const [matchedProfile, setMatchedProfile] = useState<any>(null);
    const [matchData, setMatchData] = useState<any>(null);

    useEffect(() => {
        if (user && !user.isOnboarded) {
            setTimeout(() => {
                // @ts-ignore
                navigation.navigate('Onboarding');
            }, 100);
        } else {
            fetchFeed();
        }
    }, [user]);

    const fetchFeed = async () => {
        try {
            const response = await client.get('/discovery/feed');
            setFeed(response.data);
        } catch (error) {
            console.error('Error fetching feed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSwipeLeft = async (profile: any) => {
        console.log('Pass', profile.id);
        try {
            await client.post(`/discovery/pass/${profile.id}`);
        } catch (error) {
            console.error('Error passing user:', error);
        }
    };

    const handleSwipeRight = async (profile: any) => {
        console.log('Like', profile.id);
        try {
            const response = await client.post(`/discovery/like/${profile.id}`);
            if (response.data.status === 'match') {
                console.log('It is a match!', response.data.match);
                setMatchedProfile(profile);
                setMatchData(response.data.match);
                setShowMatch(true);
            }
        } catch (error) {
            console.error('Error liking user:', error);
        }
    };

    const handleMatchAnimationFinish = () => {
        setShowMatch(false);
        if (matchedProfile && matchData) {
            navigation.navigate('Chat', { matchId: matchData.id, user: matchedProfile });
        }
        setMatchedProfile(null);
        setMatchData(null);
    };

    const handlePress = (profile: any) => {
        navigation.navigate('ProfileDetail', {
            user: profile
        });
    };

    if (loading) {
        return <LoadingState />;
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <SwipeDeck
                    data={feed}
                    onSwipeLeft={handleSwipeLeft}
                    onSwipeRight={handleSwipeRight}
                    onPress={handlePress}
                />
            </View>
            <MatchAnimation visible={showMatch} onFinish={handleMatchAnimationFinish} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    content: {
        flex: 1,
    },
});
