import React, { useEffect, useRef } from 'react';
import { View, Modal, StyleSheet, Text, Animated } from 'react-native';
import LottieView from 'lottie-react-native';

interface MatchAnimationProps {
    visible: boolean;
    onFinish: () => void;
}

export default function MatchAnimation({ visible, onFinish }: MatchAnimationProps) {
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.5)).current;

    useEffect(() => {
        if (!visible) {
            opacity.setValue(0);
            scale.setValue(0.5);
            return;
        }

        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 220,
                useNativeDriver: true,
            }),
            Animated.spring(scale, {
                toValue: 1,
                tension: 70,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start();
    }, [visible, opacity, scale]);

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="fade">
            <View style={styles.container}>
                <Animated.View style={[styles.content, { opacity, transform: [{ scale }] }]}>
                    <LottieView
                        source={require('../../assets/animations/match.json')}
                        autoPlay
                        loop={false}
                        onAnimationFinish={onFinish}
                        style={styles.lottie}
                    />
                    <Text style={styles.text}>It's a Match!</Text>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
    },
    lottie: {
        width: 300,
        height: 300,
    },
    text: {
        color: 'white',
        fontSize: 32,
        fontWeight: 'bold',
        marginTop: 20,
    },
});
