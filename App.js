import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from './src/theme/ThemeContext';
import { LanguageProvider } from './src/i18n/LanguageContext';
import { AnalyticsProvider } from './src/context/AnalyticsContext';
import { SpacedRepetitionProvider } from './src/context/SpacedRepetitionContext';
import AppNavigator from './src/navigation/AppNavigator';
import OnboardingScreen from './src/screens/OnboardingScreen';
import { OnboardingStorage } from './src/services/OnboardingStorage';

export default function App() {
  const [onboardingDone, setOnboardingDone] = useState(null);

  useEffect(() => {
    OnboardingStorage.isComplete().then(done => setOnboardingDone(done));
  }, []);

  const handleOnboardingComplete = async () => {
    await OnboardingStorage.setComplete();
    setOnboardingDone(true);
  };

  // Still checking AsyncStorage — show nothing to avoid flash
  if (onboardingDone === null) return <View style={{ flex: 1, backgroundColor: '#0A0E17' }} />;

  // Show onboarding for first-time users
  if (!onboardingDone) {
    return (
      <SafeAreaProvider>
        <LanguageProvider>
          <ThemeProvider>
            <OnboardingScreen onComplete={handleOnboardingComplete} />
          </ThemeProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    );
  }

  // Normal app for returning users
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <ThemeProvider>
          <AnalyticsProvider>
            <SpacedRepetitionProvider>
              <NavigationContainer>
                <AppNavigator />
              </NavigationContainer>
            </SpacedRepetitionProvider>
          </AnalyticsProvider>
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
