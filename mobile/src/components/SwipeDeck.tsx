import React, { useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, TouchableOpacity } from 'react-native';
import Swiper from 'react-native-deck-swiper';
import LottieView from 'lottie-react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

interface CardProps {
    user: any;
    onPress?: () => void;
}

const Card = ({ user, onPress }: CardProps) => {
    const primaryPhoto = user.photos?.find((p: any) => p.isPrimary)?.storageKey;

    return (
        <TouchableOpacity activeOpacity={1} onPress={onPress} style={styles.card}>
            <View style={styles.imageContainer}>
                {primaryPhoto ? (
                    <Image source={{ uri: primaryPhoto }} style={styles.image} resizeMode="cover" />
                ) : (
                    <View style={styles.placeholderImage}>
                        <Text style={styles.initials}>{user.firstName?.[0]}</Text>
                    </View>
                )}
                <View style={styles.overlay}>
                    <View style={styles.textContainer}>
                        <Text style={styles.name}>
                            {user.firstName}, {user.age}
                        </Text>
                        <Text style={styles.location}>
                            {user.profile?.city || 'Nearby'}
                        </Text>

                        <View style={styles.tagsContainer}>
                            {user.profile?.intentWorkout && (
                                <View style={styles.tag}>
                                    <Text style={styles.tagText}>💪 Workout</Text>
                                </View>
                            )}
                            {user.profile?.intentDating && (
                                <View style={styles.tag}>
                                    <Text style={styles.tagText}>❤️ Dating</Text>
                                </View>
                            )}
                        </View>

                        <Text style={styles.bio} numberOfLines={2}>
                            {user.profile?.bio}
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

interface SwipeDeckProps {
    data: any[];
    onSwipeLeft: (user: any) => void;
    onSwipeRight: (user: any) => void;
    onPress?: (user: any) => void;
}

export default function SwipeDeck({ data, onSwipeLeft, onSwipeRight, onPress }: SwipeDeckProps) {
    const swiperRef = useRef<Swiper<any>>(null);

    if (!data || data.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={styles.noMoreText}>No more profiles!</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Swiper
                ref={swiperRef}
                cards={data}
                renderCard={(card) => <Card user={card} onPress={() => onPress && onPress(card)} />}
                onSwipedLeft={(index) => onSwipeLeft(data[index])}
                onSwipedRight={(index) => onSwipeRight(data[index])}
                cardIndex={0}
                backgroundColor={'#000'}
                stackSize={3}
                cardVerticalMargin={0}
                cardHorizontalMargin={0}
                containerStyle={styles.swiperContainer}
                animateOverlayLabelsOpacity
                animateCardOpacity
                swipeBackCard
                overlayLabels={{
                    left: {
                        title: 'NOPE',
                        style: {
                            label: {
                                backgroundColor: 'red',
                                borderColor: 'red',
                                color: 'white',
                                borderWidth: 1,
                            },
                            wrapper: {
                                flexDirection: 'column',
                                alignItems: 'flex-end',
                                justifyContent: 'flex-start',
                                marginTop: 30,
                                marginLeft: -30,
                            },
                        },
                    },
                    right: {
                        title: 'LIKE',
                        style: {
                            label: {
                                backgroundColor: 'green',
                                borderColor: 'green',
                                color: 'white',
                                borderWidth: 1,
                            },
                            wrapper: {
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                justifyContent: 'flex-start',
                                marginTop: 30,
                                marginLeft: 30,
                            },
                        },
                    },
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    swiperContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    card: {
        flex: 1,
        borderRadius: 20, // Add some border radius for better look
        borderWidth: 0,
        borderColor: 'transparent',
        justifyContent: 'center',
        backgroundColor: '#000',
        height: SCREEN_HEIGHT - 120, // Adjust height to fit screen better
        overflow: 'hidden',
    },
    imageContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    placeholderImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#222',
        justifyContent: 'center',
        alignItems: 'center',
    },
    initials: {
        fontSize: 80,
        color: '#fff',
        fontWeight: 'bold',
    },
    overlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingBottom: 40,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    textContainer: {
        justifyContent: 'flex-end',
    },
    name: {
        fontSize: 36,
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
        marginBottom: 12,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 12,
    },
    tag: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    tagText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    bio: {
        fontSize: 16,
        color: '#fff',
        lineHeight: 22,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    },
    noMoreText: {
        color: '#fff',
        fontSize: 20,
        alignSelf: 'center',
        marginTop: '50%',
    },
});
