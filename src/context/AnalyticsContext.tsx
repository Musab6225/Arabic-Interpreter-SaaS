// src/context/AnalyticsContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

// ==================== TYPES ====================

export interface TermAccessLog {
  id: string;
  termId: string;
  english: string;
  dialectViewed: 'msa' | 'egyptian' | 'levantine' | 'all';
  timestamp: number;
  sessionId: string;
  hash: string;
  context?: 'medical' | 'legal';
  notes?: string;
}

export interface SearchSequence {
  termA: string;
  termB: string;
  frequency: number;
  lastOccurred: number;
}

export interface ChainOfCustodyRecord {
  sessionId: string;
  startTime: number;
  endTime?: number;
  caseReference?: string;
  proceedingType: 'deposition' | 'hearing' | 'trial' | 'medical-consultation' | 'emergency';
  termAccesses: TermAccessLog[];
  closed: boolean;
  masterHash: string;
}

// NEW: Context-aware suggestion with relevance scoring
export interface SmartSuggestion {
  termId: string;
  english: string;
  confidence: number; // 0-1 composite score
  reasons: SuggestionReason[];
}

export type SuggestionReason = 
  | { type: 'sequence'; frequency: number; pairedWith: string }
  | { type: 'session_context'; proceedingType: string }
  | { type: 'recent_access'; minutesAgo: number }
  | { type: 'domain_match'; domain: 'medical' | 'legal' };

interface AnalyticsContextType {
  currentSession: ChainOfCustodyRecord | null;
  sessionHistory: ChainOfCustodyRecord[];
  startSession: (proceedingType: ChainOfCustodyRecord['proceedingType'], caseReference?: string) => Promise<void>;
  endSession: () => Promise<void>;
  logTermAccess: (termId: string, english: string, dialectViewed: TermAccessLog['dialectViewed'], context?: string) => Promise<void>;
  exportSession: (sessionId: string) => Promise<string>;
  frequentSequences: SearchSequence[];
  getSuggestions: (termId: string) => string[];
  // NEW: Context-aware smart suggestions
  getSmartSuggestions: (termId: string, options?: SmartSuggestionOptions) => SmartSuggestion[];
  recentTerms: { termId: string; english: string; timestamp: number }[];
  getTermFrequency: (termId: string) => number;
}

// NEW: Options for smart suggestion weighting
export interface SmartSuggestionOptions {
  maxResults?: number;
  minConfidence?: number;
  includeReasons?: boolean;
  timeWindowMinutes?: number;
  domainBoost?: boolean;
}

// ==================== CONSTANTS ====================

const STORAGE_KEYS = {
  SESSION_HISTORY: '@analytics_session_history',
  CURRENT_SESSION: '@analytics_current_session',
  SEARCH_SEQUENCES: '@analytics_search_sequences',
  RECENT_TERMS: '@analytics_recent_terms',
};

// NEW: Domain category mapping for context matching
const DOMAIN_CATEGORIES: Record<string, 'medical' | 'legal'> = {
  'deposition': 'legal',
  'hearing': 'legal',
  'trial': 'legal',
  'medical-consultation': 'medical',
  'emergency': 'medical',
};

// ==================== CONTEXT ====================

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [currentSession, setCurrentSession] = useState<ChainOfCustodyRecord | null>(null);
  const [sessionHistory, setSessionHistory] = useState<ChainOfCustodyRecord[]>([]);
  const [frequentSequences, setFrequentSequences] = useState<SearchSequence[]>([]);
  const [recentTerms, setRecentTerms] = useState<{ termId: string; english: string; timestamp: number }[]>([]);
  const [lastAccessedTerm, setLastAccessedTerm] = useState<string | null>(null);

  // Load persisted data on mount
  useEffect(() => {
    loadPersistedData();
  }, []);

  const loadPersistedData = async () => {
    try {
      const [historyData, currentData, sequencesData, recentData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.SESSION_HISTORY),
        AsyncStorage.getItem(STORAGE_KEYS.CURRENT_SESSION),
        AsyncStorage.getItem(STORAGE_KEYS.SEARCH_SEQUENCES),
        AsyncStorage.getItem(STORAGE_KEYS.RECENT_TERMS),
      ]);
      if (historyData) setSessionHistory(JSON.parse(historyData));
      if (currentData) setCurrentSession(JSON.parse(currentData));
      if (sequencesData) setFrequentSequences(JSON.parse(sequencesData));
      if (recentData) setRecentTerms(JSON.parse(recentData));
    } catch (e) {
      console.error('Failed to load analytics data:', e);
    }
  };

  // Cryptographic hash for tamper-evident logging
  const generateHash = async (data: string): Promise<string> => {
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      data + Date.now().toString()
    );
  };

  const startSession = async (
    proceedingType: ChainOfCustodyRecord['proceedingType'],
    caseReference?: string
  ) => {
    const sessionId = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${Date.now()}-${caseReference || 'unreferenced'}`
    );
    const newSession: ChainOfCustodyRecord = {
      sessionId,
      startTime: Date.now(),
      caseReference,
      proceedingType,
      termAccesses: [],
      closed: false,
      masterHash: '',
    };
    newSession.masterHash = await generateHash(JSON.stringify(newSession));
    
    setCurrentSession(newSession);
    setLastAccessedTerm(null);
    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(newSession));
  };

  const endSession = async () => {
    if (!currentSession) return;
    const endedSession: ChainOfCustodyRecord = {
      ...currentSession,
      endTime: Date.now(),
      closed: true,
      masterHash: await generateHash(JSON.stringify({ ...currentSession, endTime: Date.now(), closed: true })),
    };
    const updatedHistory = [endedSession, ...sessionHistory].slice(0, 100);
    setSessionHistory(updatedHistory);
    setCurrentSession(null);
    setLastAccessedTerm(null);
    await AsyncStorage.setItem(STORAGE_KEYS.SESSION_HISTORY, JSON.stringify(updatedHistory));
    await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
  };

  const logTermAccess = async (
    termId: string,
    english: string,
    dialectViewed: TermAccessLog['dialectViewed'],
    context?: string
  ) => {
    const newRecent = [{ termId, english, timestamp: Date.now() }, ...recentTerms].slice(0, 50);
    setRecentTerms(newRecent);
    await AsyncStorage.setItem(STORAGE_KEYS.RECENT_TERMS, JSON.stringify(newRecent));

    if (lastAccessedTerm && lastAccessedTerm !== termId) {
      await recordSequence(lastAccessedTerm, termId);
    }

    setLastAccessedTerm(termId);

    if (currentSession) {
      const logEntry: TermAccessLog = {
        id: await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${termId}-${Date.now()}`),
        termId,
        english,
        dialectViewed,
        timestamp: Date.now(),
        sessionId: currentSession.sessionId,
        hash: '',
        context: context as 'medical' | 'legal',
      };
      logEntry.hash = await generateHash(JSON.stringify(logEntry));
      const updatedSession = {
        ...currentSession,
        termAccesses: [...currentSession.termAccesses, logEntry],
      };
      updatedSession.masterHash = await generateHash(JSON.stringify(updatedSession));
      setCurrentSession(updatedSession);
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(updatedSession));
    }
  };

  const recordSequence = async (termA: string, termB: string) => {
    const updatedSequences = [...frequentSequences];
    const existingIndex = updatedSequences.findIndex(
      s => (s.termA === termA && s.termB === termB) || (s.termA === termB && s.termB === termA)
    );
    if (existingIndex >= 0) {
      updatedSequences[existingIndex] = {
        ...updatedSequences[existingIndex],
        frequency: updatedSequences[existingIndex].frequency + 1,
        lastOccurred: Date.now(),
      };
    } else {
      updatedSequences.push({
        termA,
        termB,
        frequency: 1,
        lastOccurred: Date.now(),
      });
    }
    const sorted = updatedSequences.sort((a, b) => b.frequency - a.frequency).slice(0, 100);
    setFrequentSequences(sorted);
    await AsyncStorage.setItem(STORAGE_KEYS.SEARCH_SEQUENCES, JSON.stringify(sorted));
  };

  // LEGACY: Keep original getSuggestions for backward compatibility
  const getSuggestions = (termId: string): string[] => {
    const suggestions: string[] = [];
    const forwardSequences = frequentSequences.filter(s => s.termA === termId && s.frequency >= 2);
    const backwardSequences = frequentSequences.filter(s => s.termB === termId && s.frequency >= 2);
    const allRelevant = [...forwardSequences, ...backwardSequences]
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 3);
    allRelevant.forEach(seq => {
      const suggestedId = seq.termA === termId ? seq.termB : seq.termA;
      if (!suggestions.includes(suggestedId)) {
        suggestions.push(suggestedId);
      }
    });
    return suggestions;
  };

  // NEW: Context-aware smart suggestions with composite scoring
  const getSmartSuggestions = (
    termId: string,
    options: SmartSuggestionOptions = {}
  ): SmartSuggestion[] => {
    const {
      maxResults = 5,
      minConfidence = 0.1,
      includeReasons = true,
      timeWindowMinutes = 30,
      domainBoost = true,
    } = options;

    const now = Date.now();
    const timeWindowMs = timeWindowMinutes * 60 * 1000;
    const suggestionMap = new Map<string, SmartSuggestion>();

    // 1. Sequence-based scoring (co-occurrence patterns)
    const sequences = frequentSequences.filter(
      s => (s.termA === termId || s.termB === termId) && s.frequency >= 1
    );

    sequences.forEach(seq => {
      const pairedId = seq.termA === termId ? seq.termB : seq.termA;
      const baseScore = Math.min(seq.frequency / 10, 0.5); // Cap at 0.5 for frequency
      const recencyBoost = seq.lastOccurred > now - timeWindowMs ? 0.2 : 0;
      
      const reasons: SuggestionReason[] = [];
      if (includeReasons) {
        reasons.push({
          type: 'sequence',
          frequency: seq.frequency,
          pairedWith: termId,
        });
      }

      suggestionMap.set(pairedId, {
        termId: pairedId,
        english: pairedId, // Will be resolved by caller using glossary
        confidence: baseScore + recencyBoost,
        reasons,
      });
    });

    // 2. Session context boost
    if (currentSession && domainBoost) {
      const sessionDomain = DOMAIN_CATEGORIES[currentSession.proceedingType];
      const sessionTerms = currentSession.termAccesses
        .filter(t => t.termId !== termId)
        .slice(-10); // Last 10 terms in session

      sessionTerms.forEach(access => {
        const existing = suggestionMap.get(access.termId);
        const contextBoost = 0.15;

        if (existing) {
          existing.confidence += contextBoost;
          if (includeReasons) {
            existing.reasons.push({
              type: 'session_context',
              proceedingType: currentSession.proceedingType,
            });
          }
        } else {
          suggestionMap.set(access.termId, {
            termId: access.termId,
            english: access.english,
            confidence: contextBoost,
            reasons: includeReasons ? [{
              type: 'session_context',
              proceedingType: currentSession.proceedingType,
            }] : [],
          });
        }
      });
    }

    // 3. Recent access boost (terms accessed recently across all sessions)
    const recentAccess = recentTerms.filter(
      r => r.termId !== termId && (now - r.timestamp) < timeWindowMs
    );

    recentAccess.forEach(access => {
      const existing = suggestionMap.get(access.termId);
      const minutesAgo = (now - access.timestamp) / 60000;
      const recencyScore = Math.max(0, 0.2 - (minutesAgo / timeWindowMinutes) * 0.2);

      if (existing) {
        existing.confidence += recencyScore;
        if (includeReasons) {
          existing.reasons.push({
            type: 'recent_access',
            minutesAgo: Math.round(minutesAgo),
          });
        }
      } else {
        suggestionMap.set(access.termId, {
          termId: access.termId,
          english: access.english,
          confidence: recencyScore,
          reasons: includeReasons ? [{
            type: 'recent_access',
            minutesAgo: Math.round(minutesAgo),
          }] : [],
        });
      }
    });

    // 4. Domain match boost (if current session has a domain)
    if (currentSession && domainBoost) {
      const sessionDomain = DOMAIN_CATEGORIES[currentSession.proceedingType];
      if (sessionDomain) {
        suggestionMap.forEach((suggestion, id) => {
          // This boost is applied externally by the caller using glossary data
          // We mark it here for the UI to apply
          if (includeReasons && sessionDomain) {
            suggestion.reasons.push({
              type: 'domain_match',
              domain: sessionDomain,
            });
          }
        });
      }
    }

    // Sort by confidence and filter
    return Array.from(suggestionMap.values())
      .filter(s => s.confidence >= minConfidence)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, maxResults);
  };

  const getTermFrequency = (termId: string): number => {
    return recentTerms.filter(r => r.termId === termId).length;
  };

  // FIXED: exportSession is now inside the component, before return
  const exportSession = async (sessionId: string): Promise<string> => {
    const session = sessionHistory.find(s => s.sessionId === sessionId);
    if (!session) return '';
    
    const exportData = {
      ...session,
      exportedAt: Date.now(),
      exportHash: await generateHash(JSON.stringify(session) + Date.now()),
    };
    
    return JSON.stringify(exportData, null, 2);
  };

  return (
    <AnalyticsContext.Provider
      value={{
        currentSession,
        sessionHistory,
        startSession,
        endSession,
        logTermAccess,
        exportSession,
        frequentSequences,
        getSuggestions,
        getSmartSuggestions,
        recentTerms,
        getTermFrequency,
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  );
}

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) throw new Error('useAnalytics must be used within AnalyticsProvider');
  return context;
};