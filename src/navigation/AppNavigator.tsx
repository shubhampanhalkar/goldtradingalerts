import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import DashboardScreen from '../screens/DashboardScreen';
import LevelsScreen from '../screens/LevelsScreen';
import AlertHistoryScreen from '../screens/AlertHistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const COLORS = {
  background: '#0D0D0D',
  card: '#141414',
  border: '#1E1E1E',
  gold: '#F0B90B',
  text: '#FFFFFF',
  muted: '#888888',
};

const icons: Record<string, string> = {
  Dashboard: '📊',
  Levels: '📍',
  Alerts: '🔔',
  Settings: '⚙️',
};

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>
              {icons[route.name]}
            </Text>
          ),
          tabBarActiveTintColor: COLORS.gold,
          tabBarInactiveTintColor: COLORS.muted,
          tabBarStyle: {
            backgroundColor: COLORS.card,
            borderTopColor: COLORS.border,
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
          },
          tabBarLabelStyle: { fontSize: 11 },
          headerStyle: { backgroundColor: COLORS.card, borderBottomColor: COLORS.border },
          headerTintColor: COLORS.gold,
          headerTitleStyle: { fontWeight: 'bold', fontSize: 18 },
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Levels" component={LevelsScreen} />
        <Tab.Screen name="Alerts" component={AlertHistoryScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
