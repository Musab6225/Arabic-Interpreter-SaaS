import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, StyleSheet, FlatList,
  TouchableOpacity, KeyboardAvoidingView, Platform
} from 'react-native';
import { Search, X, Bookmark, BookOpen, Zap, TrendingUp, Clock, Scale } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { useAnalytics, SmartSuggestion } from '../context/AnalyticsContext';
import * as Haptics from 'expo-haptics';
import { GLOSSARY_DB, GlossaryItem } from '../data/glossary';

type Dialect = 'MSA' | 'Egyptian' | 'Levantine';

// NEW: Helper to resolve term ID to glossary item
const findGlossaryItem = (termId: string): GlossaryItem | undefined => {
  return GLOSSARY_DB.find(item => 
    item.id === termId || 
    item.english.toLowerCase() === termId.toLowerCase()
  );
};

// NEW: Get domain from category
const getDomainFromCategory = (category: string): 'medical' | 'legal' | null => {
  const medicalCats = ['Anatomy', 'Vision', 'Dental', 'Childbirth', 'Mental Health', 'Cardiology', 'Emergency'];
  const legalCats = ['Civil', 'Criminal', 'Immigration', 'Family Law', 'Traffic', 'Courtroom'];
  if (medicalCats.includes(category)) return 'medical';
  if (legalCats.includes(category)) return 'legal';
  return null;
};

export default function SearchScreen() {
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const { getSmartSuggestions, currentSession, logTermAccess } = useAnalytics();
  
  const [query, setQuery] = useState('');
  const [activeDialect, setActiveDialect] = useState<Dialect>('MSA');
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  // NEW: Compute smart suggestions when a term is selected or searched
  const smartSuggestions = useMemo(() => {
    if (!selectedTermId) return [];
    
    const suggestions = getSmartSuggestions(selectedTermId, {
      maxResults: 5,
      minConfidence: 0.05,
      includeReasons: true,
      timeWindowMinutes: 30,
      domainBoost: true,
    });

    // Resolve term IDs to full glossary data
    return suggestions.map(s => {
      const item = findGlossaryItem(s.termId);
      return {
        ...s,
        english: item?.english || s.english,
        glossaryItem: item,
      };
    }).filter(s => s.glossaryItem); // Only show resolved terms
  }, [selectedTermId, getSmartSuggestions]);

  // NEW: Get current session domain for UI highlighting
  const sessionDomain = useMemo(() => {
    if (!currentSession) return null;
    const domainMap: Record<string, 'medical' | 'legal'> = {
      'deposition': 'legal',
      'hearing': 'legal',
      'trial': 'legal',
      'medical-consultation': 'medical',
      'emergency': 'medical',
    };
    return domainMap[currentSession.proceedingType];
  }, [currentSession]);

  const filteredResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return GLOSSARY_DB.filter(item =>
      item.english.toLowerCase().includes(q) ||
      item.arabicMSA.includes(q) ||
      item.arabicEgyptian.includes(q) ||
      item.arabicLevantine.includes(q)
    );
  }, [query]);

  const handleDialectChange = (d: Dialect) => {
    Haptics.selectionAsync();
    setActiveDialect(d);
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQuery('');
    setSelectedTermId(null);
  };

  // NEW: Handle term selection for suggestions
  const handleTermPress = useCallback((item: GlossaryItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTermId(item.id);
    
    // Log access for analytics
    const dialectMap: Record<Dialect, 'msa' | 'egyptian' | 'levantine'> = {
      'MSA': 'msa',
      'Egyptian': 'egyptian',
      'Levantine': 'levantine',
    };
    
    const domain = getDomainFromCategory(item.category);
    logTermAccess(item.id, item.english, dialectMap[activeDialect], domain || undefined);
  }, [activeDialect, logTermAccess]);

  // NEW: Handle suggestion tap
  const handleSuggestionPress = useCallback((suggestion: SmartSuggestion & { glossaryItem?: GlossaryItem }) => {
    if (!suggestion.glossaryItem) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Set query to the suggested term to show its full card
    setQuery(suggestion.glossaryItem.english);
    setSelectedTermId(suggestion.glossaryItem.id);
    
    // Scroll to top
    // flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  // NEW: Render suggestion chip with reason indicators
  const renderSuggestionChip = ({ item }: { item: SmartSuggestion & { glossaryItem?: GlossaryItem } }) => {
    if (!item.glossaryItem) return null;
    
    const isDomainMatch = sessionDomain && getDomainFromCategory(item.glossaryItem.category) === sessionDomain;
    
    return (
      <TouchableOpacity
        style={[
          styles.suggestionChip,
          {
            backgroundColor: isDomainMatch ? theme.colors.primary + '18' : theme.colors.surface,
            borderColor: isDomainMatch ? theme.colors.primary : theme.colors.cardBorder,
          }
        ]}
        onPress={() => handleSuggestionPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.suggestionHeader}>
          <Text style={[styles.suggestionEnglish, { color: theme.colors.text }]} numberOfLines={1}>
            {item.english}
          </Text>
          <View style={styles.confidenceBadge}>
            <Text style={[styles.confidenceText, { color: theme.colors.primary }]}>
              {Math.round(item.confidence * 100)}%
            </Text>
          </View>
        </View>
        
        <Text style={[styles.suggestionArabic, { color: theme.colors.textSecondary }]} numberOfLines={1}>
          {activeDialect === 'MSA' ? item.glossaryItem?.arabicMSA :
           activeDialect === 'Egyptian' ? item.glossaryItem?.arabicEgyptian :
           item.glossaryItem?.arabicLevantine}
        </Text>

        {/* Reason indicators */}
        <View style={styles.reasonsRow}>
          {item.reasons.map((reason, idx) => (
            <View key={idx} style={[styles.reasonBadge, { backgroundColor: theme.colors.inputBackground }]}>
              {reason.type === 'sequence' && <TrendingUp size={10} color={theme.colors.primary} />}
              {reason.type === 'session_context' && <Scale size={10} color={theme.colors.warning} />}
              {reason.type === 'recent_access' && <Clock size={10} color={theme.colors.accent} />}
              {reason.type === 'domain_match' && <Zap size={10} color={theme.colors.success} />}
              <Text style={[styles.reasonText, { color: theme.colors.textMuted }]}>
                {reason.type === 'sequence' && `${reason.frequency}x`}
                {reason.type === 'session_context' && 'Session'}
                {reason.type === 'recent_access' && `${reason.minutesAgo}m`}
                {reason.type === 'domain_match' && 'Domain'}
              </Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  const renderResult = ({ item }: { item: GlossaryItem }) => {
    const arabicDisplay = activeDialect === 'MSA' ? item.arabicMSA :
                         activeDialect === 'Egyptian' ? item.arabicEgyptian :
                         item.arabicLevantine;
    
    const isSelected = selectedTermId === item.id;

    return (
      <TouchableOpacity
        style={[
          styles.resultCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: isSelected ? theme.colors.primary : theme.colors.cardBorder,
            borderWidth: isSelected ? 2 : 1,
            shadowColor: theme.colors.tabBarActive,
          }
        ]}
        onPress={() => handleTermPress(item)}
        activeOpacity={0.8}
      >
        {/* Category Badge */}
        <View style={styles.cardHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: theme.colors.primary + '14' }]}>
            <Text style={{ color: theme.colors.primary, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>
              {item.category.toUpperCase()}
            </Text>
          </View>
          <Bookmark size={18} color={theme.colors.textMuted} />
        </View>

        {/* Bilingual Row */}
        <View style={styles.bilingualRow}>
          <View style={styles.langColumn}>
            <Text style={[styles.langLabel, { color: theme.colors.textMuted }]}>ENGLISH</Text>
            <Text style={[styles.termText, { color: theme.colors.text }]}>{item.english}</Text>
          </View>
          <View style={[styles.verticalDivider, { backgroundColor: theme.colors.divider }]} />
          <View style={[styles.langColumn, { alignItems: 'flex-end' }]}>
            <Text style={[styles.langLabel, { color: theme.colors.textMuted }]}>العربية (MSA)</Text>
            <Text style={[styles.termText, { color: theme.colors.text, textAlign: 'right' }]}>
              {arabicDisplay}
            </Text>
          </View>
        </View>

        {/* Dialect Selector */}
        <View style={styles.dialectRow}>
          {(['MSA', 'Egyptian', 'Levantine'] as Dialect[]).map((d) => (
            <TouchableOpacity
              key={d}
              onPress={() => handleDialectChange(d)}
              style={[
                styles.dialectBtn,
                {
                  backgroundColor: activeDialect === d ? theme.colors.primary : theme.colors.inputBackground,
                  borderColor: activeDialect === d ? theme.colors.primary : 'transparent',
                }
              ]}
              activeOpacity={0.8}
            >
              <Text style={[styles.dialectText, { color: activeDialect === d ? '#fff' : theme.colors.textSecondary }]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* NEW: Smart Suggestions Panel - only show for selected term */}
        {isSelected && smartSuggestions.length > 0 && (
          <View style={[styles.suggestionsPanel, { borderTopColor: theme.colors.divider }]}>
            <View style={styles.suggestionsHeader}>
              <Zap size={16} color={theme.colors.primary} />
              <Text style={[styles.suggestionsTitle, { color: theme.colors.text }]}>
                Next Likely Terms
              </Text>
              {sessionDomain && (
                <View style={[styles.domainBadge, { backgroundColor: theme.colors.primary + '15' }]}>
                  <Text style={[styles.domainText, { color: theme.colors.primary }]}>
                    {sessionDomain.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={smartSuggestions}
              keyExtractor={(s) => s.termId}
              renderItem={renderSuggestionChip}
              contentContainerStyle={styles.suggestionsList}
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{t('search')}</Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textMuted }]}>
            {GLOSSARY_DB.length} terms across Medical & Legal
          </Text>
        </View>
      </View>

      {/* NEW: Active Session Indicator */}
      {currentSession && (
        <View style={[styles.sessionBanner, { backgroundColor: theme.colors.primary + '12' }]}>
          <View style={[styles.sessionDot, { backgroundColor: theme.colors.primary }]} />
          <Text style={[styles.sessionText, { color: theme.colors.primary }]}>
            {currentSession.proceedingType.replace('-', ' ').toUpperCase()} • {currentSession.termAccesses.length} terms logged
          </Text>
        </View>
      )}

      <FlatList
        data={filteredResults}
        keyExtractor={(item) => item.id}
        renderItem={renderResult}
        contentContainerStyle={styles.resultsList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, { backgroundColor: theme.colors.inputBackground }]}>
              <BookOpen size={32} color={theme.colors.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Start Searching</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
              Type to search across MSA, Egyptian, and Levantine dialects
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Search Bar */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.searchBarContainer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.divider }]}>
          <View style={[styles.searchBar, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.divider }]}>
            <Search size={20} color={theme.colors.textMuted} />
            <TextInput
              ref={inputRef}
              style={[styles.searchInput, { color: theme.colors.text, textAlign: isRTL ? 'right' : 'left' }]}
              placeholder="Search terms..."
              placeholderTextColor={theme.colors.textMuted}
              value={query}
              onChangeText={(text) => {
                setQuery(text);
                if (!text) setSelectedTermId(null);
              }}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
                <X size={16} color={theme.colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 12, marginBottom: 8 },
  headerTitle: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 14, marginTop: 4, fontWeight: '500' },

  // NEW: Session banner styles
  sessionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  sessionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sessionText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  resultsList: { padding: 20, paddingBottom: 120 },
  resultCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  categoryBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  bilingualRow: { flexDirection: 'row', gap: 16, marginVertical: 4 },
  langColumn: { flex: 1 },
  langLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginBottom: 6 },
  termText: { fontSize: 18, fontWeight: '700', lineHeight: 26 },
  verticalDivider: { width: 1, height: '100%', opacity: 0.5 },
  dialectRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  dialectBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  dialectText: { fontSize: 12, fontWeight: '700' },

  // NEW: Suggestions panel styles
  suggestionsPanel: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  domainBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  domainText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  suggestionsList: {
    paddingRight: 20,
    gap: 10,
  },

  // NEW: Suggestion chip styles
  suggestionChip: {
    width: 160,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginRight: 10,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  suggestionEnglish: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  confidenceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '800',
  },
  suggestionArabic: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  reasonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  reasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  reasonText: {
    fontSize: 10,
    fontWeight: '600',
  },

  searchBarContainer: {
    padding: 16,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 16, fontWeight: '500' },
  clearBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
});