import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import client from '../api/client';

export default function ChatScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { matchId, user } = route.params as any;

    const photoUrl =
        user?.photoUrl ||
        user?.photos?.find?.((p: any) => p.isPrimary)?.storageKey ||
        user?.photos?.[0]?.storageKey;
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<any[]>([]);

    useEffect(() => {
        fetchMessages();
        // Poll for new messages every 5 seconds
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [matchId]);

    const fetchMessages = async () => {
        try {
            const response = await client.get(`/matches/${matchId}/messages`);
            setMessages(response.data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const sendMessage = async () => {
        if (!message.trim()) return;

        const tempId = Date.now().toString();
        const tempMessage = {
            id: tempId,
            text: message,
            sender: 'me',
            timestamp: new Date(),
        };

        // Optimistic update
        setMessages(prev => [tempMessage, ...prev]);
        setMessage('');

        try {
            await client.post(`/matches/${matchId}/messages`, { content: tempMessage.text });
            fetchMessages(); // Refresh to get real ID and timestamp
        } catch (error) {
            console.error('Error sending message:', error);
            // Remove optimistic message on failure
            setMessages(prev => prev.filter(m => m.id !== tempId));
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        const isMe = item.sender === 'me';
        return (
            <View style={[
                styles.messageBubble,
                isMe ? styles.myMessage : styles.theirMessage
            ]}>
                <Text style={styles.messageText}>{item.text}</Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    {photoUrl && (
                        <Image source={{ uri: photoUrl }} style={styles.avatar} />
                    )}
                    <Text style={styles.headerTitle}>{user?.firstName || 'Chat'}</Text>
                </View>
            </View>

            <FlatList
                data={messages}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                inverted
                contentContainerStyle={styles.listContent}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
            >
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={message}
                        onChangeText={setMessage}
                        placeholder="Type a message..."
                        placeholderTextColor="#666"
                    />
                    <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
                        <Text style={styles.sendButtonText}>Send</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    backButton: {
        marginRight: 15,
    },
    backText: {
        color: '#fff',
        fontSize: 24,
    },
    headerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginRight: 10,
        backgroundColor: '#333',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    listContent: {
        padding: 15,
    },
    messageBubble: {
        padding: 12,
        borderRadius: 20,
        marginBottom: 10,
        maxWidth: '80%',
    },
    myMessage: {
        backgroundColor: '#007AFF',
        alignSelf: 'flex-end',
        borderBottomRightRadius: 4,
    },
    theirMessage: {
        backgroundColor: '#333',
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 4,
    },
    messageText: {
        color: '#fff',
        fontSize: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: '#333',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: '#1a1a1a',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        color: '#fff',
        marginRight: 10,
    },
    sendButton: {
        padding: 10,
    },
    sendButtonText: {
        color: '#007AFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
