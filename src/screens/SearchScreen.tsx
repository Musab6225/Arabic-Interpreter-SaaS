import React, { useState, useMemo, useRef } from 'react';
import { 
  View, Text, TextInput, StyleSheet, FlatList, 
  TouchableOpacity, KeyboardAvoidingView, Platform 
} from 'react-native';
import { Search, X, Bookmark } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';

// 1. Connect to your data file
import { GLOSSARY_DB, GlossaryItem } from '../data/glossary';

type Dialect = 'MSA' | 'Egyptian' | 'Levantine';

export default function SearchScreen() {
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const [query, setQuery] = useState('');
  const [activeDialect, setActiveDialect] = useState<Dialect>('MSA');
  const inputRef = useRef<TextInput>(null);

  // 2. Filter terms based on user input across ALL languages
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

  const renderResult = ({ item }: { item: GlossaryItem }) => {
    // 3. Switch the displayed Arabic text based on the active button
    const arabicDisplay = activeDialect === 'MSA' ? item.arabicMSA : 
                         activeDialect === 'Egyptian' ? item.arabicEgyptian : 
                         item.arabicLevantine;

    return (
      <View style={[styles.resultCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.divider }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: theme.colors.primary + '20' }]}>
            <Text style={{ color: theme.colors.primary, fontSize: 10, fontWeight: '700' }}>
              {item.category.toUpperCase()}
            </Text>
          </View>
          <Bookmark size={20} color={theme.colors.tabBarInactive} />
        </View>
        
        <View style={styles.bilingualRow}>
          <View style={styles.langColumn}>
            <Text style={styles.langLabel}>ENGLISH</Text>
            <Text style={[styles.termText, { color: theme.colors.text }]}>{item.english}</Text>
          </View>
          <View style={[styles.verticalDivider, { backgroundColor: theme.colors.divider }]} />
          <View style={[styles.langColumn, { alignItems: 'flex-end' }]}>
            <Text style={styles.langLabel}>العربية</Text>
            <Text style={[styles.termText, { color: theme.colors.text, textAlign: 'right' }]}>
              {arabicDisplay}
            </Text>
          </View>
        </View>

        <View style={styles.dialectRow}>
          {(['MSA', 'Egyptian', 'Levantine'] as Dialect[]).map((d) => (
            <TouchableOpacity
              key={d}
              onPress={() => setActiveDialect(d)}
              style={[
                styles.dialectBtn, 
                { backgroundColor: activeDialect === d ? theme.colors.primary : theme.colors.inputBackground, borderColor: theme.colors.divider }
              ]}
            >
              <Text style={[styles.dialectText, { color: activeDialect === d ? '#FFF' : theme.colors.text }]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{t('search')}</Text>
        <Text style={{ color: theme.colors.tabBarInactive }}>{GLOSSARY_DB.length} Medical Terms Loaded</Text>
      </View>

      <FlatList
        data={filteredResults}
        keyExtractor={(item) => item.id}
        renderItem={renderResult}
        contentContainerStyle={styles.resultsList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Search size={48} color={theme.colors.divider} />
            <Text style={{ color: theme.colors.tabBarInactive, marginTop: 10 }}>Type to search Anatomy, Vision, or Dental terms</Text>
          </View>
        }
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.searchBarContainer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.divider }]}>
          <View style={[styles.searchBar, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.divider }]}>
            <Search size={20} color={theme.colors.tabBarInactive} />
            <TextInput
              ref={inputRef}
              style={[styles.searchInput, { color: theme.colors.text, textAlign: isRTL ? 'right' : 'left' }]}
              placeholder="Search terms..."
              placeholderTextColor={theme.colors.tabBarInactive}
              value={query}
              onChangeText={setQuery}
            />
            {query.length > 0 && <TouchableOpacity onPress={() => setQuery('')}><X size={18} color={theme.colors.tabBarInactive} /></TouchableOpacity>}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 10 },
  headerTitle: { fontSize: 28, fontWeight: '700' },
  resultsList: { padding: 16, paddingBottom: 100 },
  resultCard: { borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  bilingualRow: { flexDirection: 'row', gap: 12, marginVertical: 12 },
  langColumn: { flex: 1 },
  langLabel: { fontSize: 10, color: '#8b949e', fontWeight: '600' },
  termText: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  verticalDivider: { width: 1 },
  dialectRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  dialectBtn: { flex: 1, paddingVertical: 6, borderRadius: 8, alignItems: 'center', borderWidth: 1 },
  dialectText: { fontSize: 12, fontWeight: '600' },
  searchBarContainer: { padding: 16, borderTopWidth: 1 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 50, borderRadius: 12, borderWidth: 1, gap: 10 },
  searchInput: { flex: 1, fontSize: 16 },
  emptyState: { alignItems: 'center', marginTop: 100 }
});