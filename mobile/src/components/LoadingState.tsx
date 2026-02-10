import React from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

export default function LoadingState() {
    return (
        <View style={styles.container}>
            <LottieView
                source={require('../../assets/animations/loading.json')}
                autoPlay
                loop
                style={styles.lottie}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    lottie: {
        width: 200,
        height: 200,
    },
});
