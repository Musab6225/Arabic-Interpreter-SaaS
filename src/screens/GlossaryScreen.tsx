import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookOpen, ChevronRight, Zap, TrendingUp, Clock, Scale } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { GLOSSARY_DB, GlossaryItem } from '../data/glossary';
import { useAnalytics, SmartSuggestion } from '../context/AnalyticsContext';

// NEW: Helper to resolve term ID to glossary item
const findGlossaryItem = (termId: string): GlossaryItem | undefined => {
  return GLOSSARY_DB.find(item => item.id === termId);
};

// NEW: Get domain from category
const getDomainFromCategory = (category: string): 'medical' | 'legal' | null => {
  const medicalCats = ['Anatomy', 'Vision', 'Dental', 'Childbirth', 'Mental Health', 'Cardiology', 'Emergency'];
  const legalCats = ['Civil', 'Criminal', 'Immigration', 'Family Law', 'Traffic', 'Courtroom'];
  if (medicalCats.includes(category)) return 'medical';
  if (legalCats.includes(category)) return 'legal';
  return null;
};

export default function GlossaryScreen() {
  const { theme } = useTheme();
  const { getSmartSuggestions, currentSession, logTermAccess } = useAnalytics();
  
  const [activeDomain, setActiveDomain] = useState<'Medical' | 'Legal'>('Medical');
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);

  const categories = {
    Medical: ['Anatomy', 'Vision', 'Dental', 'Childbirth', 'Mental Health', 'Cardiology', 'Emergency'],
    Legal: ['Civil', 'Criminal', 'Immigration', 'Family Law', 'Traffic', 'Courtroom']
  };

  const [activeTab, setActiveTab] = useState(categories.Medical[0]);

  const handleDomainChange = (domain: 'Medical' | 'Legal') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveDomain(domain);
    setActiveTab(categories[domain][0]);
    setSelectedTermId(null);
  };

  const handleCategoryPress = (item: string) => {
    Haptics.selectionAsync();
    setActiveTab(item);
    setSelectedTermId(null);
  };

  // NEW: Compute smart suggestions for selected term
  const smartSuggestions = useMemo(() => {
    if (!selectedTermId) return [];
    
    const suggestions = getSmartSuggestions(selectedTermId, {
      maxResults: 4,
      minConfidence: 0.05,
      includeReasons: true,
      timeWindowMinutes: 30,
      domainBoost: true,
    });

    return suggestions.map(s => {
      const item = findGlossaryItem(s.termId);
      return {
        ...s,
        english: item?.english || s.english,
        glossaryItem: item,
      };
    }).filter(s => s.glossaryItem);
  }, [selectedTermId, getSmartSuggestions]);

  // NEW: Get current session domain
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

  const filteredData = useMemo(() => {
    return GLOSSARY_DB.filter(item => item.category === activeTab);
  }, [activeTab]);

  // NEW: Handle term selection
  const handleTermPress = useCallback((item: GlossaryItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTermId(item.id);
    
    const domain = getDomainFromCategory(item.category);
    logTermAccess(item.id, item.english, 'all', domain || undefined);
  }, [logTermAccess]);

  // NEW: Handle suggestion tap
  const handleSuggestionPress = useCallback((suggestion: SmartSuggestion & { glossaryItem?: GlossaryItem }) => {
    if (!suggestion.glossaryItem) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Switch domain if needed
    const itemDomain = getDomainFromCategory(suggestion.glossaryItem.category);
    if (itemDomain) {
      const targetDomain = itemDomain === 'medical' ? 'Medical' : 'Legal';
      if (targetDomain !== activeDomain) {
        setActiveDomain(targetDomain);
      }
      setActiveTab(suggestion.glossaryItem.category);
    }
    
    setSelectedTermId(suggestion.glossaryItem.id);
  }, [activeDomain]);

  const renderItem = ({ item }: { item: GlossaryItem }) => {
    const isSelected = selectedTermId === item.id;

    return (
      <TouchableOpacity
        style={[
          styles.resultCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: isSelected ? theme.colors.primary : theme.colors.cardBorder,
            borderWidth: isSelected ? 2 : 1,
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
        </View>

        {/* English and MSA Row */}
        <View style={styles.bilingualRow}>
          <View style={styles.langColumn}>
            <Text style={[styles.langLabel, { color: theme.colors.textMuted }]}>ENGLISH</Text>
            <Text style={[styles.termText, { color: theme.colors.text }]}>{item.english}</Text>
          </View>
          <View style={[styles.verticalDivider, { backgroundColor: theme.colors.divider }]} />
          <View style={[styles.langColumn, { alignItems: 'flex-end' }]}>
            <Text style={[styles.langLabel, { color: theme.colors.textMuted }]}>العربية (MSA)</Text>
            <Text style={[styles.termText, { color: theme.colors.text, textAlign: 'right' }]}>
              {item.arabicMSA}
            </Text>
          </View>
        </View>

        {/* Dialect Row */}
        <View style={[styles.dialectRow, { borderTopColor: theme.colors.divider }]}>
          <View style={styles.langColumn}>
            <Text style={[styles.langLabel, { color: theme.colors.textMuted }]}>EGYPTIAN</Text>
            <Text style={[styles.dialectText, { color: theme.colors.textSecondary, textAlign: 'left' }]}>
              {item.arabicEgyptian}
            </Text>
          </View>
          <View style={[styles.langColumn, { alignItems: 'flex-end' }]}>
            <Text style={[styles.langLabel, { color: theme.colors.textMuted }]}>LEVANTINE</Text>
            <Text style={[styles.dialectText, { color: theme.colors.textSecondary, textAlign: 'right' }]}>
              {item.arabicLevantine}
            </Text>
          </View>
        </View>

        {/* NEW: Smart Suggestions Panel */}
        {isSelected && smartSuggestions.length > 0 && (
          <View style={[styles.suggestionsPanel, { borderTopColor: theme.colors.divider }]}>
            <View style={styles.suggestionsHeader}>
              <Zap size={16} color={theme.colors.primary} />
              <Text style={[styles.suggestionsTitle, { color: theme.colors.text }]}>
                Related Terms
              </Text>
              {sessionDomain && (
                <View style={[styles.domainBadge, { backgroundColor: theme.colors.primary + '15' }]}>
                  <Text style={[styles.domainText, { color: theme.colors.primary }]}>
                    {sessionDomain.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.suggestionsGrid}>
              {smartSuggestions.map((suggestion) => (
                <TouchableOpacity
                  key={suggestion.termId}
                  style={[
                    styles.suggestionChip,
                    {
                      backgroundColor: sessionDomain && getDomainFromCategory(suggestion.glossaryItem!.category) === sessionDomain
                        ? theme.colors.primary + '18'
                        : theme.colors.inputBackground,
                      borderColor: sessionDomain && getDomainFromCategory(suggestion.glossaryItem!.category) === sessionDomain
                        ? theme.colors.primary
                        : 'transparent',
                    }
                  ]}
                  onPress={() => handleSuggestionPress(suggestion)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.suggestionEnglish, { color: theme.colors.text }]} numberOfLines={1}>
                    {suggestion.english}
                  </Text>
                  <View style={styles.suggestionMeta}>
                    <Text style={[styles.suggestionArabic, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                      {suggestion.glossaryItem?.arabicMSA}
                    </Text>
                    <View style={styles.confidenceBadge}>
                      <Text style={[styles.confidenceText, { color: theme.colors.primary }]}>
                        {Math.round(suggestion.confidence * 100)}%
                      </Text>
                    </View>
                  </View>
                  <View style={styles.reasonsRow}>
                    {suggestion.reasons.slice(0, 2).map((reason, idx) => (
                      <View key={idx} style={[styles.reasonBadge, { backgroundColor: theme.colors.background }]}>
                        {reason.type === 'sequence' && <TrendingUp size={10} color={theme.colors.primary} />}
                        {reason.type === 'session_context' && <Scale size={10} color={theme.colors.warning} />}
                        {reason.type === 'recent_access' && <Clock size={10} color={theme.colors.accent} />}
                        <Text style={[styles.reasonText, { color: theme.colors.textMuted }]}>
                          {reason.type === 'sequence' && `${reason.frequency}x`}
                          {reason.type === 'session_context' && 'Active'}
                          {reason.type === 'recent_access' && `${reason.minutesAgo}m`}
                        </Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Glossary</Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textMuted }]}>
          Browse by domain and category
        </Text>
      </View>

      {/* NEW: Active Session Indicator */}
      {currentSession && (
        <View style={[styles.sessionBanner, { backgroundColor: theme.colors.primary + '12' }]}>
          <View style={[styles.sessionDot, { backgroundColor: theme.colors.primary }]} />
          <Text style={[styles.sessionText, { color: theme.colors.primary }]}>
            {currentSession.proceedingType.replace('-', ' ').toUpperCase()} • {currentSession.termAccesses.length} terms
          </Text>
        </View>
      )}

      {/* Domain Toggle */}
      <View style={[styles.domainToggleContainer, { backgroundColor: theme.colors.inputBackground }]}>
        <TouchableOpacity
          onPress={() => handleDomainChange('Medical')}
          style={[
            styles.domainBtn,
            activeDomain === 'Medical' && { backgroundColor: theme.colors.primary }
          ]}
          activeOpacity={0.9}
        >
          <Text style={[
            styles.domainBtnText,
            { color: activeDomain === 'Medical' ? '#FFF' : theme.colors.textSecondary }
          ]}>
            Medical
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDomainChange('Legal')}
          style={[
            styles.domainBtn,
            activeDomain === 'Legal' && { backgroundColor: theme.colors.primary }
          ]}
          activeOpacity={0.9}
        >
          <Text style={[
            styles.domainBtnText,
            { color: activeDomain === 'Legal' ? '#FFF' : theme.colors.textSecondary }
          ]}>
            Legal
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category Pills */}
      <View style={{ marginBottom: 12 }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories[activeDomain]}
          keyExtractor={(item) => item}
          contentContainerStyle={{ paddingLeft: 24, paddingRight: 10 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleCategoryPress(item)}
              style={[
                styles.dialectBtn,
                {
                  backgroundColor: activeTab === item ? theme.colors.primary : theme.colors.surface,
                  borderColor: activeTab === item ? theme.colors.primary : theme.colors.cardBorder,
                }
              ]}
              activeOpacity={0.85}
            >
              <Text style={{
                fontSize: 13,
                fontWeight: '700',
                color: activeTab === item ? '#FFFFFF' : theme.colors.textSecondary
              }}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Results */}
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.resultsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, { backgroundColor: theme.colors.inputBackground }]}>
              <BookOpen size={28} color={theme.colors.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No Terms Found</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
              Select a different category to browse terms
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 12, marginBottom: 8 },
  headerTitle: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 14, marginTop: 4, fontWeight: '500', color: '#8b949e' },

  // NEW: Session banner
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

  domainToggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 14,
    padding: 4,
  },
  domainBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  domainBtnText: { fontSize: 14, fontWeight: '700' },

  resultsList: { padding: 20, paddingBottom: 100 },
  resultCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  categoryBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  bilingualRow: { flexDirection: 'row', gap: 16, marginVertical: 4 },
  langColumn: { flex: 1 },
  langLabel: { fontSize: 10, color: '#8b949e', fontWeight: '700', letterSpacing: 0.8, marginBottom: 6 },
  termText: { fontSize: 18, fontWeight: '700', lineHeight: 26 },
  verticalDivider: { width: 1, height: '100%', opacity: 0.5 },
  dialectRow: { flexDirection: 'row', gap: 16, marginTop: 16, paddingTop: 14, borderTopWidth: 1 },
  dialectText: { fontSize: 14, fontWeight: '600', lineHeight: 22 },
  dialectBtn: {
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    marginRight: 8,
  },

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
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  // NEW: Suggestion chip styles
  suggestionChip: {
    width: '48%',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  suggestionEnglish: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  suggestionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  suggestionArabic: {
    fontSize: 12,
    fontWeight: '600',
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

  emptyState: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
});