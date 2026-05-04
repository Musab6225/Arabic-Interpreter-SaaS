// src/context/SpacedRepetitionContext.tsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { glossaryData, GlossaryItem } from '../data/glossary';

// ==================== TYPES ====================

export type DialectTarget = 'msa' | 'egyptian' | 'levantine';

export interface FlashcardItem {
  id: string;
  termId: string;
  english: string;
  targetDialect: DialectTarget;
  interval: number; // days until next review
  repetitions: number;
  easeFactor: number;
  dueDate: number; // timestamp
  lastReviewed: number | null;
  totalReviews: number;
  correctStreak: number;
  difficultyHistory: ('easy' | 'medium' | 'hard')[];
}

export interface QuizResult {
  termId: string;
  targetDialect: DialectTarget;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  confidence: number; // 0-1
  timestamp: number;
  timeSpentMs: number;
}

interface SpacedRepetitionContextType {
  flashcards: FlashcardItem[];
  dueCards: FlashcardItem[];
  quizResults: QuizResult[];
  addToLearningQueue: (termId: string, targetDialect: DialectTarget) => Promise<void>;
  removeFromQueue: (flashcardId: string) => Promise<void>;
  submitQuizResult: (result: QuizResult) => Promise<void>;
  getNextDueCard: () => FlashcardItem | null;
  getLearningStats: () => {
    totalCards: number;
    dueToday: number;
    mastered: number;
    streakDays: number;
    accuracyRate: number;
  };
  getTermForFlashcard: (termId: string) => GlossaryItem | undefined;
}

// ==================== CONSTANTS ====================

const STORAGE_KEYS = {
  FLASHCARDS: '@sr_flashcards',
  QUIZ_RESULTS: '@sr_quiz_results',
  LEARNING_STATS: '@sr_learning_stats',
  LAST_STUDY_DATE: '@sr_last_study_date',
};

// SM-2 Algorithm constants
const INITIAL_INTERVAL = 1;
const MIN_EASE_FACTOR = 1.3;

// ==================== CONTEXT ====================

const SpacedRepetitionContext = createContext<SpacedRepetitionContextType | undefined>(undefined);

export function SpacedRepetitionProvider({ children }: { children: React.ReactNode }) {
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([]);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [lastStudyDate, setLastStudyDate] = useState<number | null>(null);
  const [streakDays, setStreakDays] = useState(0);

  useEffect(() => {
    loadPersistedData();
  }, []);

  const loadPersistedData = async () => {
    try {
      const [cardsData, resultsData, lastDate] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.FLASHCARDS),
        AsyncStorage.getItem(STORAGE_KEYS.QUIZ_RESULTS),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_STUDY_DATE),
      ]);

      if (cardsData) setFlashcards(JSON.parse(cardsData));
      if (resultsData) setQuizResults(JSON.parse(resultsData));
      if (lastDate) {
        const date = parseInt(lastDate);
        setLastStudyDate(date);
        calculateStreak(date);
      }
    } catch (e) {
      console.error('Failed to load SR data:', e);
    }
  };

  const calculateStreak = (lastDate: number) => {
    const now = new Date();
    const last = new Date(lastDate);
    const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // Studied today already, keep current streak
      setStreakDays(prev => prev || 1);
    } else if (diffDays === 1) {
      // Studied yesterday, increment streak
      setStreakDays(prev => (prev || 0) + 1);
    } else {
      // Streak broken
      setStreakDays(0);
    }
  };

  const addToLearningQueue = async (termId: string, targetDialect: DialectTarget) => {
    const existing = flashcards.find(c => c.termId === termId && c.targetDialect === targetDialect);
    if (existing) return; // Already in queue

    const term = glossaryData.find(g => g.id === termId);
    if (!term) return;

    const newCard: FlashcardItem = {
      id: `${termId}-${targetDialect}-${Date.now()}`,
      termId,
      english: term.english,
      targetDialect,
      interval: INITIAL_INTERVAL,
      repetitions: 0,
      easeFactor: 2.5,
      dueDate: Date.now(), // Due immediately
      lastReviewed: null,
      totalReviews: 0,
      correctStreak: 0,
      difficultyHistory: [],
    };

    const updated = [...flashcards, newCard];
    setFlashcards(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify(updated));
  };

  const removeFromQueue = async (flashcardId: string) => {
    const updated = flashcards.filter(c => c.id !== flashcardId);
    setFlashcards(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify(updated));
  };

  // SM-2 Spaced Repetition Algorithm
  const calculateNextReview = (card: FlashcardItem, quality: number): FlashcardItem => {
    // quality: 0-5 (0=complete blackout, 5=perfect)
    let { interval, repetitions, easeFactor } = card;

    if (quality >= 3) {
      if (repetitions === 0) interval = 1;
      else if (repetitions === 1) interval = 6;
      else interval = Math.round(interval * easeFactor);

      repetitions += 1;
    } else {
      repetitions = 0;
      interval = 1;
    }

    easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

    const dueDate = Date.now() + interval * 24 * 60 * 60 * 1000;

    return {
      ...card,
      interval,
      repetitions,
      easeFactor,
      dueDate,
      lastReviewed: Date.now(),
      totalReviews: card.totalReviews + 1,
    };
  };

  const submitQuizResult = async (result: QuizResult) => {
    // Update quiz results
    const updatedResults = [...quizResults, result].slice(0, 500);
    setQuizResults(updatedResults);
    await AsyncStorage.setItem(STORAGE_KEYS.QUIZ_RESULTS, JSON.stringify(updatedResults));

    // Update streak
    const today = new Date().setHours(0, 0, 0, 0);
    if (lastStudyDate !== today) {
      setLastStudyDate(today);
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_STUDY_DATE, today.toString());
      calculateStreak(lastStudyDate || today);
    }

    // Update flashcard using SM-2
    const card = flashcards.find(c => c.termId === result.termId && c.targetDialect === result.targetDialect);
    if (!card) return;

    // Map confidence to SM-2 quality
    let quality: number;
    if (result.isCorrect) {
      if (result.confidence > 0.9) quality = 5;
      else if (result.confidence > 0.7) quality = 4;
      else quality = 3;
    } else {
      if (result.confidence > 0.5) quality = 2;
      else if (result.confidence > 0.2) quality = 1;
      else quality = 0;
    }

    const difficulty: 'easy' | 'medium' | 'hard' = 
      quality >= 4 ? 'easy' : quality >= 3 ? 'medium' : 'hard';

    const updatedCard = {
      ...calculateNextReview(card, quality),
      correctStreak: result.isCorrect ? card.correctStreak + 1 : 0,
      difficultyHistory: [...card.difficultyHistory, difficulty].slice(-10),
    };

    const updatedCards = flashcards.map(c => c.id === updatedCard.id ? updatedCard : c);
    setFlashcards(updatedCards);
    await AsyncStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify(updatedCards));
  };

  const getNextDueCard = (): FlashcardItem | null => {
    const now = Date.now();
    const due = flashcards.filter(c => c.dueDate <= now);
    if (due.length === 0) return null;
    
    // Prioritize by: lowest repetitions first, then oldest due date
    return due.sort((a, b) => {
      if (a.repetitions !== b.repetitions) return a.repetitions - b.repetitions;
      return a.dueDate - b.dueDate;
    })[0];
  };

  const getLearningStats = () => {
    const now = Date.now();
    const dueToday = flashcards.filter(c => c.dueDate <= now + 24 * 60 * 60 * 1000).length;
    const mastered = flashcards.filter(c => c.repetitions >= 5 && c.correctStreak >= 3).length;
    
    const totalResults = quizResults.length;
    const correctResults = quizResults.filter(r => r.isCorrect).length;
    const accuracyRate = totalResults > 0 ? Math.round((correctResults / totalResults) * 100) : 0;

    return {
      totalCards: flashcards.length,
      dueToday,
      mastered,
      streakDays,
      accuracyRate,
    };
  };

  const getTermForFlashcard = (termId: string) => {
    return glossaryData.find(g => g.id === termId);
  };

  const dueCards = flashcards.filter(c => c.dueDate <= Date.now());

  return (
    <SpacedRepetitionContext.Provider
      value={{
        flashcards,
        dueCards,
        quizResults,
        addToLearningQueue,
        removeFromQueue,
        submitQuizResult,
        getNextDueCard,
        getLearningStats,
        getTermForFlashcard,
      }}
    >
      {children}
    </SpacedRepetitionContext.Provider>
  );
}

export const useSpacedRepetition = () => {
  const context = useContext(SpacedRepetitionContext);
  if (!context) throw new Error('useSpacedRepetition must be used within SpacedRepetitionProvider');
  return context;
};