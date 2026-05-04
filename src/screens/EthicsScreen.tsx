// src/screens/EthicsScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Shield,
  ChevronRight,
  Check,
  X,
  AlertCircle,
  BookOpen,
  Scale,
  Eye,
  Lock,
  Users,
  RotateCcw,
  Award,
  ChevronLeft,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { ethicsScenarios, EthicsScenario } from '../data/ethicsGuide';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';

type EthicsMode = 'list' | 'scenario' | 'result';

export default function EthicsScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [mode, setMode] = useState<EthicsMode>('list');
  const [currentScenario, setCurrentScenario] = useState<EthicsScenario | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [completedScenarios, setCompletedScenarios] = useState<string[]>([]);
  const [score, setScore] = useState(0);

  const categoryIcons: Record<string, any> = {
    'accuracy': Scale,
    'confidentiality': Lock,
    'impartiality': Eye,
    'professional-conduct': Users,
  };

  const categoryColors: Record<string, string> = {
    'accuracy': '#3498db',
    'confidentiality': '#9b59b6',
    'impartiality': '#e67e22',
    'professional-conduct': '#27ae60',
  };

  const startScenario = (scenario: EthicsScenario) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentScenario(scenario);
    setSelectedOption(null);
    setShowExplanation(false);
    setMode('scenario');
  };

  const selectOption = (index: number) => {
    if (showExplanation) return;
    Haptics.selectionAsync();
    setSelectedOption(index);
    setShowExplanation(true);

    if (currentScenario?.options[index].isCorrect) {
      setScore(s => s + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    if (!completedScenarios.includes(currentScenario!.id)) {
      setCompletedScenarios(prev => [...prev, currentScenario!.id]);
    }
  };

  const getProgress = () => {
    return Math.round((completedScenarios.length / ethicsScenarios.length) * 100);
  };

  if (mode === 'list') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ChevronLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Ethics Guide</Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textMuted }]}>
              Professional standards for interpreters
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.progressCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.cardBorder }]}>
            <View style={styles.progressHeader}>
              <Award size={22} color={theme.colors.primary} />
              <Text style={[styles.progressTitle, { color: theme.colors.text }]}>Your Progress</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${getProgress()}%`, backgroundColor: theme.colors.primary }]} />
            </View>
            <Text style={[styles.progressText, { color: theme.colors.textMuted }]}>
              {completedScenarios.length} of {ethicsScenarios.length} scenarios completed
            </Text>
          </View>

          <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Scenarios</Text>
          {ethicsScenarios.map(scenario => {
            const Icon = categoryIcons[scenario.category] || Shield;
            const color = categoryColors[scenario.category] || theme.colors.primary;
            const isCompleted = completedScenarios.includes(scenario.id);

            return (
              <TouchableOpacity
                key={scenario.id}
                style={[styles.scenarioCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.cardBorder }, isCompleted && { borderLeftWidth: 4, borderLeftColor: '#27ae60' }]}
                onPress={() => startScenario(scenario)}
                activeOpacity={0.7}
              >
                <View style={[styles.scenarioIcon, { backgroundColor: color + '15' }]}>
                  <Icon size={20} color={color} />
                </View>
                <View style={styles.scenarioContent}>
                  <Text style={[styles.scenarioTitle, { color: theme.colors.text }]}>{scenario.title}</Text>
                  <Text style={[styles.scenarioStandard, { color: theme.colors.textMuted }]} numberOfLines={1}>{scenario.standard}</Text>
                </View>
                {isCompleted ? (
                  <View style={[styles.completedBadge, { backgroundColor: '#27ae6020' }]}>
                    <Check size={14} color="#27ae60" />
                  </View>
                ) : (
                  <ChevronRight size={18} color={theme.colors.divider} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (mode === 'scenario' && currentScenario) {
    const Icon = categoryIcons[currentScenario.category] || Shield;
    const color = categoryColors[currentScenario.category] || theme.colors.primary;

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={styles.scenarioHeader}>
          <TouchableOpacity onPress={() => setMode('list')} style={styles.backButton}>
            <ChevronLeft size={24} color={theme.colors.textMuted} />
          </TouchableOpacity>
          <View style={[styles.categoryBadge, { backgroundColor: color + '15' }]}>
            <Icon size={14} color={color} />
            <Text style={[styles.categoryText, { color }]}>{currentScenario.category}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scenarioScroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.situationCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.cardBorder }]}>
            <AlertCircle size={20} color={theme.colors.primary} />
            <Text style={[styles.situationText, { color: theme.colors.text }]}>{currentScenario.situation}</Text>
          </View>

          <Text style={[styles.questionText, { color: theme.colors.text }]}>{currentScenario.question}</Text>

          <View style={styles.optionsContainer}>
            {currentScenario.options.map((option, index) => {
              const isSelected = selectedOption === index;
              const isCorrect = option.isCorrect;
              const showState = showExplanation && isSelected;

              let borderColor = theme.colors.cardBorder;
              let bgColor = theme.colors.surface;
              let icon = null;

              if (showState) {
                if (isCorrect) {
                  borderColor = '#27ae60';
                  bgColor = '#27ae6008';
                  icon = <Check size={20} color="#27ae60" />;
                } else {
                  borderColor = '#e74c3c';
                  bgColor = '#e74c3c08';
                  icon = <X size={20} color="#e74c3c" />;
                }
              }

              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.optionCard, { backgroundColor: bgColor, borderColor }, showState && { borderWidth: 2 }]}
                  onPress={() => selectOption(index)}
                  disabled={showExplanation}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionContent}>
                    <Text style={[styles.optionText, { color: theme.colors.text }]}>{option.text}</Text>
                  </View>
                  {icon && <View style={styles.optionIcon}>{icon}</View>}
                </TouchableOpacity>
              );
            })}
          </View>

          {showExplanation && selectedOption !== null && (
            <View style={[styles.explanationCard, { backgroundColor: theme.colors.primary + '08', borderColor: theme.colors.primary + '30' }]}>
              <BookOpen size={20} color={theme.colors.primary} />
              <Text style={[styles.explanationTitle, { color: theme.colors.primary }]}>
                {currentScenario.options[selectedOption].isCorrect ? 'Correct!' : 'Not quite'}
              </Text>
              <Text style={[styles.explanationText, { color: theme.colors.text }]}>
                {currentScenario.options[selectedOption].explanation}
              </Text>
              <View style={[styles.standardBadge, { backgroundColor: theme.colors.primary + '15' }]}>
                <Scale size={14} color={theme.colors.primary} />
                <Text style={[styles.standardText, { color: theme.colors.primary }]}>{currentScenario.standard}</Text>
              </View>
            </View>
          )}

          {showExplanation && (
            <TouchableOpacity style={[styles.nextButton, { backgroundColor: theme.colors.primary }]} onPress={() => setMode('list')}>
              <Text style={styles.nextButtonText}>Back to Scenarios</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  headerSubtitle: { fontSize: 14, marginTop: 2 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },

  progressCard: { padding: 20, borderRadius: 16, borderWidth: 1, marginTop: 8 },
  progressHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  progressTitle: { fontSize: 16, fontWeight: '700' },
  progressBar: { height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: 13, marginTop: 8, fontWeight: '500' },

  sectionTitle: { fontSize: 12, fontWeight: '700', marginTop: 28, marginBottom: 12, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 1 },

  scenarioCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  scenarioIcon: { padding: 10, borderRadius: 12, marginRight: 14 },
  scenarioContent: { flex: 1 },
  scenarioTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  scenarioStandard: { fontSize: 12, fontWeight: '500' },
  completedBadge: { padding: 6, borderRadius: 12 },

  scenarioHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  categoryText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },

  scenarioScroll: { padding: 24, paddingBottom: 40 },

  situationCard: { flexDirection: 'row', gap: 12, padding: 20, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  situationText: { flex: 1, fontSize: 15, lineHeight: 22, fontWeight: '500' },

  questionText: { fontSize: 20, fontWeight: '800', lineHeight: 28, marginBottom: 24 },

  optionsContainer: { gap: 12 },
  optionCard: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 14, borderWidth: 1.5 },
  optionContent: { flex: 1 },
  optionText: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
  optionIcon: { marginLeft: 12 },

  explanationCard: { marginTop: 24, padding: 20, borderRadius: 16, borderWidth: 1.5, gap: 10 },
  explanationTitle: { fontSize: 18, fontWeight: '800' },
  explanationText: { fontSize: 15, lineHeight: 24, fontWeight: '500' },
  standardBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginTop: 4 },
  standardText: { fontSize: 12, fontWeight: '700' },

  nextButton: { marginTop: 24, paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
  nextButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});