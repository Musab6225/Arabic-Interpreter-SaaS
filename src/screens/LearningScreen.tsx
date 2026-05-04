// src/screens/LearningScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Brain,
  Trophy,
  Flame,
  Target,
  ChevronRight,
  RotateCcw,
  Check,
  X,
  Volume2,
  TrendingUp,
  BookOpen,
  Sparkles,
  ChevronLeft,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { useSpacedRepetition, FlashcardItem, DialectTarget } from '../context/SpacedRepetitionContext';
import { useAnalytics } from '../context/AnalyticsContext';
import { glossaryData } from '../data/glossary';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function LearningScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { 
    dueCards, 
    getNextDueCard, 
    submitQuizResult, 
    getLearningStats,
    getTermForFlashcard,
    addToLearningQueue,
  } = useSpacedRepetition();
  const { logTermAccess } = useAnalytics();

  const [mode, setMode] = useState<'overview' | 'quiz' | 'results'>('overview');
  const [currentCard, setCurrentCard] = useState<FlashcardItem | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [quizResults, setQuizResults] = useState<{ card: FlashcardItem; correct: boolean; confidence: number }[]>([]);
  const [selectedDialect, setSelectedDialect] = useState<DialectTarget>('egyptian');
  const [flipAnim] = useState(new Animated.Value(0));
  const [stats, setStats] = useState(getLearningStats());

  useEffect(() => {
    setStats(getLearningStats());
  }, [dueCards.length]);

  const startQuiz = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const card = getNextDueCard();
    if (card) {
      setCurrentCard(card);
      setMode('quiz');
      setShowAnswer(false);
      setQuizResults([]);
      flipAnim.setValue(0);
    } else {
      Alert.alert('No Cards Due', 'You have no flashcards due for review. Add some terms first!');
    }
  };

  const handleFlip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowAnswer(!showAnswer);
    Animated.spring(flipAnim, {
      toValue: showAnswer ? 0 : 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const handleAnswer = async (confidence: number, isCorrect: boolean) => {
    Haptics.impactAsync(
      isCorrect ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Heavy
    );

    if (!currentCard) return;

    const term = getTermForFlashcard(currentCard.termId);
    const correctAnswer = term ? term[currentCard.targetDialect] : '';

    await submitQuizResult({
      termId: currentCard.termId,
      targetDialect: currentCard.targetDialect,
      userAnswer: '',
      correctAnswer,
      isCorrect,
      confidence,
      timestamp: Date.now(),
      timeSpentMs: 0,
    });

    setQuizResults(prev => [...prev, { card: currentCard, correct: isCorrect, confidence }]);

    const nextCard = getNextDueCard();
    if (nextCard && nextCard.id !== currentCard.id) {
      setCurrentCard(nextCard);
      setShowAnswer(false);
      flipAnim.setValue(0);
    } else {
      setMode('results');
    }
  };

  const handleSelfAssessment = (rating: 'easy' | 'medium' | 'hard') => {
    const confidenceMap = { easy: 0.95, medium: 0.6, hard: 0.3 };
    const isCorrect = rating !== 'hard';
    handleAnswer(confidenceMap[rating], isCorrect);
  };

  const addTermToLearning = (termId: string, dialect: DialectTarget) => {
    Haptics.selectionAsync();
    addToLearningQueue(termId, dialect);
    Alert.alert('Added!', 'This term has been added to your learning queue.');
  };

  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });

  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  if (mode === 'overview') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ChevronLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Learning Center</Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textMuted }]}>
              Master dialectal terminology
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.statsGrid}>
            <StatCard icon={BookOpen} label="Total Cards" value={stats.totalCards.toString()} color={theme.colors.primary} theme={theme} />
            <StatCard icon={Target} label="Due Today" value={stats.dueToday.toString()} color="#e74c3c" theme={theme} />
            <StatCard icon={Trophy} label="Mastered" value={stats.mastered.toString()} color="#f39c12" theme={theme} />
            <StatCard icon={Flame} label="Day Streak" value={`${stats.streakDays}d`} color="#e67e22" theme={theme} />
          </View>

          <View style={[styles.accuracyCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.cardBorder }]}>
            <View style={styles.accuracyHeader}>
              <TrendingUp size={20} color={theme.colors.primary} />
              <Text style={[styles.accuracyTitle, { color: theme.colors.text }]}>Accuracy Rate</Text>
            </View>
            <View style={styles.accuracyBar}>
              <View style={[styles.accuracyFill, { width: `${stats.accuracyRate}%`, backgroundColor: stats.accuracyRate > 80 ? '#27ae60' : stats.accuracyRate > 50 ? '#f39c12' : '#e74c3c' }]} />
            </View>
            <Text style={[styles.accuracyText, { color: theme.colors.textMuted }]}>
              {stats.accuracyRate}% correct across all quizzes
            </Text>
          </View>

          {stats.dueToday > 0 && (
            <TouchableOpacity style={[styles.startButton, { backgroundColor: theme.colors.primary }]} onPress={startQuiz} activeOpacity={0.8}>
              <Brain size={24} color="#FFF" />
              <Text style={styles.startButtonText}>Start Review Session ({stats.dueToday} cards)</Text>
              <ChevronRight size={20} color="#FFF" />
            </TouchableOpacity>
          )}

          <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Add New Terms</Text>
          <View style={[styles.dialectSelector, { backgroundColor: theme.colors.surface, borderColor: theme.colors.cardBorder }]}>
            {(['msa', 'egyptian', 'levantine'] as DialectTarget[]).map(dialect => (
              <TouchableOpacity
                key={dialect}
                style={[styles.dialectOption, selectedDialect === dialect && { backgroundColor: theme.colors.primary + '20' }]}
                onPress={() => { Haptics.selectionAsync(); setSelectedDialect(dialect); }}
              >
                <Text style={[styles.dialectText, { color: selectedDialect === dialect ? theme.colors.primary : theme.colors.textMuted }]}>
                  {dialect === 'msa' ? 'MSA' : dialect === 'egyptian' ? 'Egyptian' : 'Levantine'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Suggested for Practice</Text>
          {glossaryData.slice(0, 5).map(term => (
            <TouchableOpacity
              key={term.id}
              style={[styles.suggestedTerm, { backgroundColor: theme.colors.surface, borderColor: theme.colors.cardBorder }]}
              onPress={() => addTermToLearning(term.id, selectedDialect)}
              activeOpacity={0.7}
            >
              <View style={styles.suggestedLeft}>
                <Text style={[styles.suggestedEnglish, { color: theme.colors.text }]}>{term.english}</Text>
                <Text style={[styles.suggestedArabic, { color: theme.colors.textMuted }]}>{term[selectedDialect]}</Text>
              </View>
              <View style={[styles.addButton, { backgroundColor: theme.colors.primary + '15' }]}>
                <Sparkles size={16} color={theme.colors.primary} />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (mode === 'quiz' && currentCard) {
    const term = getTermForFlashcard(currentCard.termId);
    if (!term) return null;
    const correctAnswer = term[currentCard.targetDialect];

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={styles.quizHeader}>
          <Text style={[styles.quizProgress, { color: theme.colors.textMuted }]}>
            Card {quizResults.length + 1}
          </Text>
          <View style={styles.streakBadge}>
            <Flame size={14} color="#e67e22" />
            <Text style={styles.streakText}>{stats.streakDays}d</Text>
          </View>
        </View>

        <View style={styles.quizContent}>
          <Text style={[styles.questionLabel, { color: theme.colors.textMuted }]}>
            What is the {currentCard.targetDialect === 'msa' ? 'MSA' : currentCard.targetDialect === 'egyptian' ? 'Egyptian' : 'Levantine'} for:
          </Text>
          <Text style={[styles.questionTerm, { color: theme.colors.text }]}>{currentCard.english}</Text>

          <View style={styles.cardContainer}>
            <Animated.View style={[styles.card, { opacity: frontOpacity, transform: [{ rotateY: frontInterpolate }] }]}>
              <View style={[styles.cardInner, { backgroundColor: theme.colors.surface, borderColor: theme.colors.cardBorder }]}>
                <Text style={[styles.cardPrompt, { color: theme.colors.textMuted }]}>Tap to reveal answer</Text>
                <TouchableOpacity onPress={handleFlip} style={styles.revealButton}>
                  <RotateCcw size={32} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            </Animated.View>

            <Animated.View style={[styles.card, { opacity: backOpacity, transform: [{ rotateY: backInterpolate }], position: 'absolute' }]}>
              <View style={[styles.cardInner, { backgroundColor: theme.colors.primary + '08', borderColor: theme.colors.primary + '30' }]}>
                <Text style={[styles.cardAnswer, { color: theme.colors.primary }]}>{correctAnswer}</Text>
                <View style={styles.answerMeta}>
                  <Text style={[styles.answerDialect, { color: theme.colors.textMuted }]}>{currentCard.targetDialect.toUpperCase()}</Text>
                  <TouchableOpacity onPress={() => {}}>
                    <Volume2 size={18} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </View>

          {showAnswer && (
            <View style={styles.assessmentContainer}>
              <Text style={[styles.assessmentPrompt, { color: theme.colors.text }]}>How well did you know this?</Text>
              <View style={styles.assessmentButtons}>
                <TouchableOpacity style={[styles.assessBtn, { backgroundColor: '#e74c3c20' }]} onPress={() => handleSelfAssessment('hard')}>
                  <X size={20} color="#e74c3c" />
                  <Text style={[styles.assessText, { color: '#e74c3c' }]}>Hard</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.assessBtn, { backgroundColor: '#f39c1220' }]} onPress={() => handleSelfAssessment('medium')}>
                  <Text style={[styles.assessText, { color: '#f39c12' }]}>Good</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.assessBtn, { backgroundColor: '#27ae6020' }]} onPress={() => handleSelfAssessment('easy')}>
                  <Check size={20} color="#27ae60" />
                  <Text style={[styles.assessText, { color: '#27ae60' }]}>Easy</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {!showAnswer && (
            <TouchableOpacity style={[styles.revealMainBtn, { backgroundColor: theme.colors.primary }]} onPress={handleFlip}>
              <Text style={styles.revealMainText}>Show Answer</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  if (mode === 'results') {
    const correct = quizResults.filter(r => r.correct).length;
    const total = quizResults.length;

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={styles.resultsContainer}>
          <View style={[styles.resultsCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.cardBorder }]}>
            <Trophy size={48} color={theme.colors.primary} />
            <Text style={[styles.resultsTitle, { color: theme.colors.text }]}>Session Complete!</Text>
            <Text style={[styles.resultsScore, { color: theme.colors.primary }]}>{correct} / {total}</Text>
            <Text style={[styles.resultsSubtitle, { color: theme.colors.textMuted }]}>
              {correct === total ? 'Perfect! Terms scheduled for long-term review.' : correct > total / 2 ? 'Good progress. Keep practicing!' : 'Keep at it. These terms will appear again soon.'}
            </Text>
          </View>

          <TouchableOpacity style={[styles.startButton, { backgroundColor: theme.colors.primary, marginTop: 24 }]} onPress={() => setMode('overview')}>
            <RotateCcw size={20} color="#FFF" />
            <Text style={styles.startButtonText}>Back to Learning Center</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return null;
}

function StatCard({ icon: Icon, label, value, color, theme }: any) {
  return (
    <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.cardBorder }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
        <Icon size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  headerSubtitle: { fontSize: 14, marginTop: 2 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8, justifyContent: 'space-between' },
  statCard: { width: (width - 60) / 2, padding: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  statIcon: { padding: 10, borderRadius: 12, marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 12, fontWeight: '600', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },

  accuracyCard: { marginTop: 20, padding: 20, borderRadius: 16, borderWidth: 1 },
  accuracyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  accuracyTitle: { fontSize: 16, fontWeight: '700' },
  accuracyBar: { height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, overflow: 'hidden' },
  accuracyFill: { height: '100%', borderRadius: 4 },
  accuracyText: { fontSize: 13, marginTop: 8, fontWeight: '500' },

  startButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 24, paddingVertical: 18, paddingHorizontal: 24, borderRadius: 16 },
  startButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  sectionTitle: { fontSize: 12, fontWeight: '700', marginTop: 28, marginBottom: 12, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 1 },

  dialectSelector: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  dialectOption: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  dialectText: { fontSize: 14, fontWeight: '700' },

  suggestedTerm: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  suggestedLeft: { flex: 1 },
  suggestedEnglish: { fontSize: 16, fontWeight: '700' },
  suggestedArabic: { fontSize: 14, marginTop: 2, fontWeight: '500' },
  addButton: { padding: 10, borderRadius: 10 },

  quizHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  quizProgress: { fontSize: 14, fontWeight: '600' },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#e67e2220', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  streakText: { color: '#e67e22', fontWeight: '700', fontSize: 13 },

  quizContent: { flex: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 20 },
  questionLabel: { fontSize: 15, fontWeight: '600', textAlign: 'center' },
  questionTerm: { fontSize: 28, fontWeight: '800', textAlign: 'center', marginTop: 8, marginBottom: 32 },

  cardContainer: { width: width - 48, height: 280, marginBottom: 32 },
  card: { width: '100%', height: '100%', backfaceVisibility: 'hidden' },
  cardInner: { flex: 1, borderRadius: 24, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', padding: 24 },
  cardPrompt: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
  revealButton: { padding: 16 },
  cardAnswer: { fontSize: 42, fontWeight: '800', textAlign: 'center' },
  answerMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20 },
  answerDialect: { fontSize: 13, fontWeight: '700', letterSpacing: 1 },

  revealMainBtn: { paddingVertical: 16, paddingHorizontal: 48, borderRadius: 14 },
  revealMainText: { color: '#FFF', fontSize: 17, fontWeight: '700' },

  assessmentContainer: { width: '100%', alignItems: 'center' },
  assessmentPrompt: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
  assessmentButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  assessBtn: { flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: 14, gap: 6 },
  assessText: { fontSize: 14, fontWeight: '700' },

  resultsContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  resultsCard: { width: '100%', alignItems: 'center', padding: 40, borderRadius: 24, borderWidth: 1 },
  resultsTitle: { fontSize: 24, fontWeight: '800', marginTop: 16 },
  resultsScore: { fontSize: 48, fontWeight: '800', marginVertical: 8 },
  resultsSubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginTop: 4 },
});