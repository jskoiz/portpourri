import React from 'react';
import { View, Modal, StyleSheet, Text } from 'react-native';
import LottieView from 'lottie-react-native';
import { MotiView } from 'moti';

interface MatchAnimationProps {
    visible: boolean;
    onFinish: () => void;
}

export default function MatchAnimation({ visible, onFinish }: MatchAnimationProps) {
    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="fade">
            <View style={styles.container}>
                <MotiView
                    from={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring' }}
                    style={styles.content}
                >
                    <LottieView
                        source={require('../../assets/animations/match.json')}
                        autoPlay
                        loop={false}
                        onAnimationFinish={onFinish}
                        style={styles.lottie}
                    />
                    <Text style={styles.text}>It's a Match!</Text>
                </MotiView>
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
