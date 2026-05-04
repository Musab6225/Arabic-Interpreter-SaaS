// src/screens/SessionHistoryScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Clock, FileText, Shield, Calendar } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAnalytics, ChainOfCustodyRecord } from '../context/AnalyticsContext';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';

export default function SessionHistoryScreen() {
  const { theme } = useTheme();
  const { sessionHistory } = useAnalytics();
  const navigation = useNavigation();

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (start: number, end?: number) => {
    if (!end) return 'In progress';
    const mins = Math.floor((end - start) / 1000 / 60);
    return `${mins} min`;
  };

  const renderSession = ({ item }: { item: ChainOfCustodyRecord }) => (
    <View style={[styles.sessionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.cardBorder }]}>
      <View style={styles.sessionHeader}>
        <View style={[styles.typeBadge, { backgroundColor: theme.colors.primary + '15' }]}>
          <Shield size={14} color={theme.colors.primary} />
          <Text style={[styles.typeText, { color: theme.colors.primary }]}>
            {item.proceedingType.replace('-', ' ').toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.termCount, { color: theme.colors.textMuted }]}>
          {item.termAccesses.length} terms
        </Text>
      </View>

      <View style={styles.sessionDetails}>
        <View style={styles.detailRow}>
          <Calendar size={14} color={theme.colors.textMuted} />
          <Text style={[styles.detailText, { color: theme.colors.text }]}>
            {formatDate(item.startTime)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Clock size={14} color={theme.colors.textMuted} />
          <Text style={[styles.detailText, { color: theme.colors.textMuted }]}>
            Duration: {formatDuration(item.startTime, item.endTime)}
          </Text>
        </View>
        {item.caseReference && (
          <View style={styles.detailRow}>
            <FileText size={14} color={theme.colors.textMuted} />
            <Text style={[styles.detailText, { color: theme.colors.textMuted }]}>
              Ref: {item.caseReference}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.hashContainer}>
        <Text style={[styles.hashLabel, { color: theme.colors.textMuted }]}>Master Hash:</Text>
        <Text style={[styles.hashValue, { color: theme.colors.textMuted }]} numberOfLines={1}>
          {item.masterHash}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Session History</Text>
        <View style={{ width: 40 }} />
      </View>

      {sessionHistory.length === 0 ? (
        <View style={styles.emptyState}>
          <Shield size={48} color={theme.colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            No Sessions Yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
            Start a Chain of Custody session from Settings to see records here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={sessionHistory}
          renderItem={renderSession}
          keyExtractor={(item) => item.sessionId}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  
  listContent: { padding: 24, paddingBottom: 40 },
  
  sessionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  termCount: { fontSize: 13, fontWeight: '600' },
  
  sessionDetails: { gap: 6, marginBottom: 12 },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: { fontSize: 14, fontWeight: '500' },
  
  hashContainer: {
    borderTopWidth: 0.5,
    borderTopColor: '#e0e0e0',
    paddingTop: 10,
  },
  hashLabel: { fontSize: 11, fontWeight: '700', marginBottom: 2 },
  hashValue: { fontSize: 11, fontFamily: 'monospace' },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginTop: 16 },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
});