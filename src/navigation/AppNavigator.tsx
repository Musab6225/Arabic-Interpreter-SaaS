// src/navigation/AppNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Search, BookOpen, Settings, Plus } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import * as Haptics from 'expo-haptics';
import SearchScreen from '../screens/SearchScreen';
import GlossaryScreen from '../screens/GlossaryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import MyGlossaryScreen from '../screens/MyGlossaryScreen';
import LearningScreen from '../screens/LearningScreen';
import EthicsScreen from '../screens/EthicsScreen';
import SessionHistoryScreen from '../screens/SessionHistoryScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function SettingsStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SettingsMain" component={SettingsScreen} />
      <Stack.Screen name="Learning" component={LearningScreen} />
      <Stack.Screen name="Ethics" component={EthicsScreen} />
      <Stack.Screen name="SessionHistory" component={SessionHistoryScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const handleTabPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBar,
          borderTopWidth: 0,
          height: 84,
          paddingBottom: 24,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 8,
        },
        tabBarActiveTintColor: theme.colors.tabBarActive,
        tabBarInactiveTintColor: theme.colors.tabBarInactive,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarLabel: t('search'),
          tabBarIcon: ({ color, focused }) => (
            <Search size={22} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
        listeners={{ tabPress: handleTabPress }}
      />
      <Tab.Screen
        name="Glossary"
        component={GlossaryScreen}
        options={{
          tabBarLabel: t('glossary'),
          tabBarIcon: ({ color, focused }) => (
            <BookOpen size={22} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
        listeners={{ tabPress: handleTabPress }}
      />
      <Tab.Screen
        name="MyTerms"
        component={MyGlossaryScreen}
        options={{
          tabBarLabel: 'My Glossary',
          tabBarIcon: ({ color, focused }) => (
            <Plus size={22} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
          tabBarButton: undefined,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStackNavigator}
        options={{
          tabBarLabel: t('settings'),
          tabBarIcon: ({ color, focused }) => (
            <Settings size={22} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
        listeners={{ tabPress: handleTabPress }}
      />
    </Tab.Navigator>
  );
}