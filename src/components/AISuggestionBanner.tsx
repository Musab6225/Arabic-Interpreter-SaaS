// src/components/AISuggestionBanner.tsx

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Sparkles, ChevronDown, ChevronUp, Check } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { AISuggestion } from '../services/AISuggestionService';

interface AISuggestionBannerProps {
  isLoading: boolean;
  suggestion: AISuggestion | null;
  error: string | null;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onApply: (suggestion: AISuggestion) => void;
  termName: string;
}

export default function AISuggestionBanner({
  isLoading,
  suggestion,
  error,
  isExpanded,
  onToggleExpand,
  onApply,
  termName,
}: AISuggestionBannerProps) {
  const { theme } = useTheme();

  if (!isLoading && !suggestion && !error) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.primary + '12',
          borderColor: theme.colors.primary + '40',
        },
      ]}
    >
      {/* Header Row */}
      <TouchableOpacity
        style={styles.headerRow}
        onPress={onToggleExpand}
        activeOpacity={0.7}
        disabled={isLoading || !!error}
      >
        <View style={styles.headerLeft}>
          <Sparkles size={16} color={theme.colors.primary} />
          <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>
            AI Suggestion
          </Text>
          {isLoading && (
            <ActivityIndicator
              size="small"
              color={theme.colors.primary}
              style={{ marginLeft: 8 }}
            />
          )}
        </View>
        {suggestion && !isLoading && (
          isExpanded
            ? <ChevronUp size={16} color={theme.colors.primary} />
            : <ChevronDown size={16} color={theme.colors.primary} />
        )}
      </TouchableOpacity>

      {/* Loading State */}
      {isLoading && (
        <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>
          Generating translations for "{termName}"…
        </Text>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Text style={[styles.errorText, { color: '#E53E3E' }]}>{error}</Text>
      )}

      {/* Suggestion Content */}
      {suggestion && !isLoading && isExpanded && (
        <View style={styles.suggestionBody}>
          <DialectRow label="MSA" value={suggestion.arabicMSA} theme={theme} />
          <DialectRow label="Egyptian" value={suggestion.arabicEgyptian} theme={theme} />
          <DialectRow label="Levantine" value={suggestion.arabicLevantine} theme={theme} />

          {suggestion.notes ? (
            <Text style={[styles.notesText, { color: theme.colors.textMuted }]}>
              💡 {suggestion.notes}
            </Text>
          ) : null}

          <TouchableOpacity
            style={[styles.applyBtn, { backgroundColor: theme.colors.primary }]}
            onPress={() => onApply(suggestion)}
            activeOpacity={0.85}
          >
            <Check size={16} color="#fff" />
            <Text style={styles.applyBtnText}>Apply to Form</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Collapsed summary */}
      {suggestion && !isLoading && !isExpanded && (
        <Text
          style={[styles.collapsedPreview, { color: theme.colors.textSecondary }]}
          numberOfLines={1}
        >
          {suggestion.arabicMSA}  ·  {suggestion.arabicEgyptian}  ·  {suggestion.arabicLevantine}
        </Text>
      )}
    </View>
  );
}

function DialectRow({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: any;
}) {
  return (
    <View style={styles.dialectRow}>
      <Text style={[styles.dialectLabel, { color: theme.colors.textMuted }]}>
        {label}
      </Text>
      <Text style={[styles.dialectValue, { color: theme.colors.text }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  loadingText: {
    fontSize: 13,
    marginTop: 8,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 13,
    marginTop: 8,
  },
  suggestionBody: {
    marginTop: 12,
    gap: 8,
  },
  dialectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  dialectLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    width: 80,
  },
  dialectValue: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  notesText: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  applyBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  collapsedPreview: {
    fontSize: 13,
    marginTop: 6,
    textAlign: 'right',
  },
});