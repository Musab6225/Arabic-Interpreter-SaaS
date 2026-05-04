import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CustomTerm {
  id: string;
  en: string;
  ar: string;
  category: 'medical' | 'legal';
  notes: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = '@interpreter_custom_terms';

export const CustomTermStorage = {
  async getAll(): Promise<CustomTerm[]> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      return json ? JSON.parse(json) : [];
    } catch (error) {
      console.error('Error loading custom terms:', error);
      return [];
    }
  },
  async save(term: CustomTerm): Promise<void> {
    try {
      const terms = await this.getAll();
      const existingIndex = terms.findIndex(t => t.id === term.id);
     
      if (existingIndex >= 0) {
        terms[existingIndex] = { ...term, updatedAt: new Date().toISOString() };
      } else {
        terms.push(term);
      }
     
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(terms));
    } catch (error) {
      console.error('Error saving custom term:', error);
      throw error;
    }
  },
  async delete(id: string): Promise<void> {
    try {
      const terms = await this.getAll();
      const filtered = terms.filter(t => t.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting custom term:', error);
      throw error;
    }
  },
};