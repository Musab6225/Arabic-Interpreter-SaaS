cat > src/screens/OnboardingScreen.tsx << 'ENDOFFILE'
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Dimensions, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import * as Haptics from 'expo-haptics';
import { BookOpen, Globe, Sparkles, CheckCircle } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: () => void;
}

const slides = [
  {
    icon: BookOpen,
    iconColor: '#3B82F6',
    iconBg: '#3B82F620',
    title: 'Your Professional\nInterpreter Toolkit',
    subtitle: 'Built for high-stakes environments',
    body: 'This app is designed specifically for Arabic interpreters working in medical and legal settings — where using the wrong word can have serious consequences.',
    highlight: null,
  },
  {
    icon: Globe,
    iconColor: '#10B981',
    iconBg: '#10B98120',
    title: 'Three Dialects,\nOne Search',
    subtitle: 'Never lose a patient or client',
    body: 'Arabic spoken on the street is very different from formal written Arabic. This app gives you all three versions side by side.',
    highlight: {
      rows: [
        { label: 'MSA', sublabel: 'Formal / Written', value: 'قلب', note: 'Used in official documents' },
        { label: 'Egyptian', sublabel: 'عامية مصرية', value: 'ألب', note: 'How Egyptians say it' },
        { label: 'Levantine', sublabel: 'شامية', value: 'قلب', note: 'Syria, Lebanon, Jordan' },
      ],
      term: 'Heart',
    },
  },
  {
    icon: Sparkles,
    iconColor: '#F59E0B',
    iconBg: '#F59E0B20',
    title: 'AI Fills the Gaps',
    subtitle: 'For terms not in the database',
    body: 'Can\'t find a term? Go to My Glossary, tap +, type any English term and AI will instantly suggest all three Arabic dialect translations for you to review and save.',
    highlight: {
      demo: true,
      steps: [
        'Tap + in My Glossary',
        'Type any medical or legal term',
        'AI suggests MSA, Egyptian & Levantine',
        'Review, edit if needed, then save',
      ],
    },
  },
  {
    icon: CheckCircle,
    iconColor: '#10B981',
    iconBg: '#10B98120',
    title: "You're Ready\nto Interpret",
    subtitle: '598 terms across Medical & Legal',
    body: 'Search the full glossary, build your personal term list, and use AI to fill any gap. Your clients are counting on you — and now you\'re prepared.',
    highlight: {
      stats: [
        { value: '598', label: 'Professional Terms' },
        { value: '3', label: 'Arabic Dialects' },
        { value: '2', label: 'Domains: Med & Legal' },
        { value: 'AI', label: 'Powered Suggestions' },
      ],
    },
  },
];

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const goToNext = () => {
    if (currentIndex < slides.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const next = currentIndex + 1;
      setCurrentIndex(next);
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete();
    }
  };

  const goToSlide = (index: number) => {
    Haptics.selectionAsync();
    setCurrentIndex(index);
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
  };

  const handleScroll = (e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    if (index !== currentIndex) setCurrentIndex(index);
  };

  const isLast = currentIndex === slides.length - 1;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      
      {/* Skip button */}
      {!isLast && (
        <TouchableOpacity style={styles.skipBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onComplete(); }}>
          <Text style={[styles.skipText, { color: theme.colors.textMuted }]}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {slides.map((slide, index) => (
          <View key={index} style={[styles.slide, { width }]}>
            <SlideContent slide={slide} theme={theme} />
          </View>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={styles.dotsRow}>
        {slides.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => goToSlide(i)}>
            <View style={[
              styles.dot,
              {
                backgroundColor: i === currentIndex ? theme.colors.primary : theme.colors.divider,
                width: i === currentIndex ? 24 : 8,
              }
            ]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* CTA Button */}
      <View style={styles.btnContainer}>
        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: theme.colors.primary }]}
          onPress={goToNext}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>
            {isLast ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

function SlideContent({ slide, theme }: { slide: any; theme: any }) {
  const Icon = slide.icon;
  return (
    <ScrollView
      contentContainerStyle={styles.slideContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Icon */}
      <View style={[styles.iconCircle, { backgroundColor: slide.iconBg }]}>
        <Icon size={36} color={slide.iconColor} />
      </View>

      {/* Text */}
      <Text style={[styles.title, { color: theme.colors.text }]}>{slide.title}</Text>
      <Text style={[styles.subtitle, { color: slide.iconColor }]}>{slide.subtitle}</Text>
      <Text style={[styles.body, { color: theme.colors.textSecondary }]}>{slide.body}</Text>

      {/* Dialect highlight card */}
      {slide.highlight?.rows && (
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.cardBorder }]}>
          <Text style={[styles.cardTerm, { color: theme.colors.textMuted }]}>Example: "{slide.highlight.term}"</Text>
          {slide.highlight.rows.map((row: any, i: number) => (
            <View key={i} style={[styles.dialectRow, i < slide.highlight.rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.colors.divider }]}>
              <View>
                <Text style={[styles.dialectLabel, { color: theme.colors.text }]}>{row.label}</Text>
                <Text style={[styles.dialectSub, { color: theme.colors.textMuted }]}>{row.sublabel}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.dialectValue, { color: theme.colors.primary }]}>{row.value}</Text>
                <Text style={[styles.dialectNote, { color: theme.colors.textMuted }]}>{row.note}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* AI steps */}
      {slide.highlight?.steps && (
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.cardBorder }]}>
          {slide.highlight.steps.map((step: string, i: number) => (
            <View key={i} style={styles.stepRow}>
              <View style={[styles.stepNum, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={[styles.stepText, { color: theme.colors.textSecondary }]}>{step}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Stats grid */}
      {slide.highlight?.stats && (
        <View style={styles.statsGrid}>
          {slide.highlight.stats.map((stat: any, i: number) => (
            <View key={i} style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.cardBorder }]}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>{stat.label}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skipBtn: { position: 'absolute', top: 56, right: 24, zIndex: 10, paddingVertical: 8, paddingHorizontal: 12 },
  skipText: { fontSize: 15, fontWeight: '500' },
  slide: { flex: 1 },
  slideContent: { paddingHorizontal: 28, paddingTop: 60, paddingBottom: 20, alignItems: 'center' },
  iconCircle: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 28 },
  title: { fontSize: 32, fontWeight: '800', textAlign: 'center', lineHeight: 40, marginBottom: 8 },
  subtitle: { fontSize: 15, fontWeight: '600', textAlign: 'center', marginBottom: 16 },
  body: { fontSize: 16, lineHeight: 26, textAlign: 'center', marginBottom: 28 },
  card: { width: '100%', borderRadius: 16, borderWidth: 1, padding: 16, marginTop: 4 },
  cardTerm: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  dialectRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  dialectLabel: { fontSize: 15, fontWeight: '700' },
  dialectSub: { fontSize: 12, marginTop: 2 },
  dialectValue: { fontSize: 20, fontWeight: '700' },
  dialectNote: { fontSize: 11, marginTop: 2 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  stepNum: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  stepNumText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  stepText: { fontSize: 15, flex: 1, lineHeight: 22 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4, width: '100%' },
  statCard: { width: '47%', borderRadius: 14, borderWidth: 1, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  statLabel: { fontSize: 12, textAlign: 'center', fontWeight: '500' },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: 16 },
  dot: { height: 8, borderRadius: 4 },
  btnContainer: { paddingHorizontal: 28, paddingBottom: 16 },
  nextBtn: { padding: 18, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  nextBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
ENDOFFILE