import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import ExploreScreen from '../screens/ExploreScreen';
import CreateScreen from '../screens/CreateScreen';
import MatchesScreen from '../screens/MatchesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { View, Text } from 'react-native';

const Tab = createBottomTabNavigator();

// Simple icon placeholder component until we add an icon library
const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: focused ? '#fff' : '#666', fontSize: 20 }}>
            {name === 'Discover' ? '🔍' :
                name === 'Explore' ? '🌍' :
                    name === 'Create' ? '➕' :
                        name === 'Matches' ? '💬' :
                            '👤'}
        </Text>
    </View>
);

export default function MainTabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#000',
                    borderTopColor: '#333',
                    height: 80,
                    paddingTop: 10,
                },
                tabBarActiveTintColor: '#fff',
                tabBarInactiveTintColor: '#666',
                tabBarShowLabel: true,
                tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
            })}
        >
            <Tab.Screen name="Discover" component={HomeScreen} />
            <Tab.Screen name="Explore" component={ExploreScreen} />
            <Tab.Screen name="Create" component={CreateScreen} />
            <Tab.Screen name="Matches" component={MatchesScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}
