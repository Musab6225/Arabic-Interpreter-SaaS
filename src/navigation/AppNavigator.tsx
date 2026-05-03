import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Search, BookOpen, Settings, Plus } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import SearchScreen from '../screens/SearchScreen';
import GlossaryScreen from '../screens/GlossaryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import MyGlossaryScreen from '../screens/MyGlossaryScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBar,
          borderTopColor: theme.colors.divider,
          height: 70,
          paddingBottom: 12,
        },
        tabBarActiveTintColor: theme.colors.tabBarActive,
        tabBarInactiveTintColor: theme.colors.tabBarInactive,
      }}
    >
      <Tab.Screen 
        name="Search" 
        component={SearchScreen} 
        options={{
          tabBarLabel: t('search'),
          tabBarIcon: ({ color }) => <Search size={22} color={color} />,
        }}
      />
      <Tab.Screen 
        name="Glossary" 
        component={GlossaryScreen} 
        options={{
          tabBarLabel: t('glossary'),
          tabBarIcon: ({ color }) => <BookOpen size={22} color={color} />,
        }}
      />
      {/* Tab hidden by returning null for tabBarButton */}
      <Tab.Screen 
        name="MyTerms" 
        component={MyGlossaryScreen} 
        options={{
          tabBarLabel: 'My Glossary',
          tabBarIcon: ({ color }) => <Plus size={22} color={color} />,
          tabBarButton: () => null, 
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{
          tabBarLabel: t('settings'),
          tabBarIcon: ({ color }) => <Settings size={22} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}