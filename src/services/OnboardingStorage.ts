cat > src/services/OnboardingStorage.ts << 'ENDOFFILE'
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@onboarding_complete';

export const OnboardingStorage = {
  async isComplete(): Promise<boolean> {
    try {
      const val = await AsyncStorage.getItem(KEY);
      return val === 'true';
    } catch {
      return false;
    }
  },

  async setComplete(): Promise<void> {
    try {
      await AsyncStorage.setItem(KEY, 'true');
    } catch {
      console.error('Failed to save onboarding state');
    }
  },

  // Call this during development to reset and re-see the onboarding
  async reset(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEY);
    } catch {}
  },
};
ENDOFFILE