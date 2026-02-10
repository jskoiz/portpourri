import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignupScreen({ navigation }: any) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [birthdate, setBirthdate] = useState('1995-01-01'); // Simple placeholder for now
    const [gender, setGender] = useState('male'); // Simple placeholder

    const signup = useAuthStore((state) => state.signup);

    const handleSignup = async () => {
        try {
            await signup({ email, password, firstName, birthdate, gender });
            // Navigation will be handled by AppNavigator state change, 
            // but we might want to force Onboarding if it's a new user.
            // For now, let's assume the user is redirected to Home, and Home checks if onboarded.
            // Or better, we can manually navigate if the stack allows.
            // Since AppNavigator switches on `token`, it renders Home stack.
            // We need a way to detect "new user" or "not onboarded".
            // For MVP, let's just push Onboarding from Home or make Onboarding the default if not onboarded.
        } catch (error) {
            Alert.alert('Signup Failed', 'Could not create account');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.title}>Create Account</Text>

                <View style={styles.form}>
                    <Text style={styles.label}>First Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="First Name"
                        placeholderTextColor="#666"
                        value={firstName}
                        onChangeText={setFirstName}
                    />

                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor="#666"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                    />

                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#666"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    {/* Simplified inputs for MVP */}
                    <Text style={styles.label}>Birthdate (YYYY-MM-DD)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="1995-01-01"
                        placeholderTextColor="#666"
                        value={birthdate}
                        onChangeText={setBirthdate}
                    />

                    <Text style={styles.label}>Gender</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="male/female/other"
                        placeholderTextColor="#666"
                        value={gender}
                        onChangeText={setGender}
                    />

                    <TouchableOpacity style={styles.button} onPress={handleSignup}>
                        <Text style={styles.buttonText}>Sign Up</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={styles.link}>Already have an account? Log in</Text>
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
        justifyContent: 'center',
        minHeight: '100%',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 30,
    },
    form: {
        width: '100%',
    },
    label: {
        color: '#fff',
        marginBottom: 5,
        marginLeft: 5,
    },
    input: {
        backgroundColor: '#1a1a1a',
        color: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        fontSize: 16,
    },
    button: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 25,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20,
    },
    buttonText: {
        color: '#000',
        fontSize: 18,
        fontWeight: 'bold',
    },
    link: {
        color: '#ccc',
        textAlign: 'center',
        marginTop: 10,
    },
});
