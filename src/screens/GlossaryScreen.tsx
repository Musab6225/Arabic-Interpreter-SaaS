import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity 
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
// IMPORTANT: Use GlossaryItem to match your data file
import { GLOSSARY_DB, GlossaryItem } from '../data/glossary';

export default function GlossaryScreen() {
  const { theme } = useTheme();
  
  // Domain state (Medical vs Legal)
  const [activeDomain, setActiveDomain] = useState<'Medical' | 'Legal'>('Medical');

  // Categories for each domain
  const categories = {
    Medical: ['Anatomy', 'Vision', 'Dental', 'Childbirth', 'Mental Health', 'Cardiology', 'Emergency'],
    Legal: ['Civil', 'Criminal', 'Immigration', 'Family Law', 'Traffic', 'Courtroom']
  };
  
  // Active tab state
  const [activeTab, setActiveTab] = useState(categories.Medical[0]);

  // Handle domain switch
  const handleDomainChange = (domain: 'Medical' | 'Legal') => {
    setActiveDomain(domain);
    setActiveTab(categories[domain][0]); // Reset tab to first category of new domain
  };

  const filteredData = useMemo(() => {
    return GLOSSARY_DB.filter(item => item.category === activeTab);
  }, [activeTab]);

  const renderItem = ({ item }: { item: GlossaryItem }) => (
    <View style={[styles.resultCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.divider }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.categoryBadge, { backgroundColor: theme.colors.primary + '20' }]}>
          <Text style={{ color: theme.colors.primary, fontSize: 10, fontWeight: '700' }}>
            {item.category.toUpperCase()}
          </Text>
        </View>
      </View>
      
      {/* English and MSA Row */}
      <View style={styles.bilingualRow}>
        <View style={styles.langColumn}>
          <Text style={styles.langLabel}>ENGLISH</Text>
          <Text style={[styles.termText, { color: theme.colors.text }]}>{item.english}</Text>
        </View>
        <View style={[styles.verticalDivider, { backgroundColor: theme.colors.divider }]} />
        <View style={[styles.langColumn, { alignItems: 'flex-end' }]}>
          <Text style={styles.langLabel}>العربية (MSA)</Text>
          <Text style={[styles.termText, { color: theme.colors.text, textAlign: 'right' }]}>
            {item.arabicMSA}
          </Text>
        </View>
      </View>

      {/* FIXED DIALECT ROW - FORCED LEFT/RIGHT SPLIT */}
      <View style={[styles.dialectRow, { borderTopWidth: 1, borderTopColor: theme.colors.divider, paddingTop: 10 }]}>
        {/* Left Side: Egyptian */}
        <View style={styles.langColumn}>
          <Text style={styles.langLabel}>EGYPTIAN</Text>
          <Text style={[styles.dialectText, { color: theme.colors.text, textAlign: 'left' }]}>
            {item.arabicEgyptian}
          </Text>
        </View>

        {/* Right Side: Levantine */}
        <View style={[styles.langColumn, { alignItems: 'flex-end' }]}>
          <Text style={styles.langLabel}>LEVANTINE</Text>
          <Text style={[styles.dialectText, { color: theme.colors.text, textAlign: 'right' }]}>
            {item.arabicLevantine}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Glossary</Text>
      </View>

      {/* Domain Toggle Switch */}
      <View style={styles.domainToggleContainer}>
        <TouchableOpacity 
          onPress={() => handleDomainChange('Medical')}
          style={[
            styles.domainBtn, 
            activeDomain === 'Medical' && { backgroundColor: theme.colors.primary }
          ]}
        >
          <Text style={[styles.domainBtnText, { color: activeDomain === 'Medical' ? '#FFF' : theme.colors.text }]}>Medical</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => handleDomainChange('Legal')}
          style={[
            styles.domainBtn, 
            activeDomain === 'Legal' && { backgroundColor: theme.colors.primary }
          ]}
        >
          <Text style={[styles.domainBtnText, { color: activeDomain === 'Legal' ? '#FFF' : theme.colors.text }]}>Legal</Text>
        </TouchableOpacity>
      </View>

      <View style={{ marginBottom: 10 }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories[activeDomain]}
          keyExtractor={(item) => item}
          contentContainerStyle={{ paddingLeft: 20, paddingRight: 10 }}
          renderItem={({ item }) => (
            <TouchableOpacity 
              onPress={() => setActiveTab(item)}
              style={[
                styles.dialectBtn, 
                { 
                  backgroundColor: activeTab === item ? theme.colors.primary : theme.colors.surface, 
                  borderColor: theme.colors.divider,
                  marginRight: 8,
                  paddingHorizontal: 15
                }
              ]}
            >
              <Text style={{ 
                fontSize: 14, 
                fontWeight: '600', 
                color: activeTab === item ? '#FFFFFF' : theme.colors.text 
              }}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.resultsList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={{ color: theme.colors.text + '50' }}>No terms found in this category.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 10, marginBottom: 5 },
  headerTitle: { fontSize: 28, fontWeight: '700' },
  domainToggleContainer: { 
    flexDirection: 'row', 
    marginHorizontal: 20, 
    marginBottom: 15, 
    backgroundColor: '#161b22', 
    borderRadius: 12, 
    padding: 4 
  },
  domainBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  domainBtnText: { fontSize: 14, fontWeight: '700' },
  resultsList: { padding: 16, paddingBottom: 100 },
  resultCard: { borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  bilingualRow: { flexDirection: 'row', gap: 12, marginVertical: 4 },
  langColumn: { flex: 1 }, 
  langLabel: { fontSize: 10, color: '#8b949e', fontWeight: '600', marginBottom: 2 },
  termText: { fontSize: 18, fontWeight: '700' },
  dialectText: { fontSize: 14, fontWeight: '600' },
  verticalDivider: { width: 1, height: '100%' },
  dialectRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  dialectBtn: { paddingVertical: 8, borderRadius: 20, alignItems: 'center', borderWidth: 1 },
  emptyState: { alignItems: 'center', marginTop: 100 }
});