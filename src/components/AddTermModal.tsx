// src/components/AddTermModal.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  Modal, KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { X, Save, Languages, Tag, Sparkles } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { CustomTerm } from '../services/CustomTermStorage';
import * as Haptics from 'expo-haptics';
import { fetchAISuggestion, AISuggestion } from '../services/AISuggestionService';
import AISuggestionBanner from './AISuggestionBanner';

interface AddTermModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (term: CustomTerm) => void;
  editingTerm?: CustomTerm | null;
}

export default function AddTermModal({ visible, onClose, onSave, editingTerm }: AddTermModalProps) {
  const { theme } = useTheme();
  const [en, setEn] = useState('');
  const [ar, setAr] = useState('');
  const [category, setCategory] = useState<'medical' | 'legal'>('medical');

  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiExpanded, setAiExpanded] = useState(true);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFetchedTerm = useRef<string>('');

  useEffect(() => {
    if (editingTerm) {
      setEn(editingTerm.en);
      setAr(editingTerm.ar);
      setCategory(editingTerm.category);
    } else {
      setEn(''); setAr(''); setCategory('medical');
    }
    setAiSuggestion(null);
    setAiError(null);
    setAiLoading(false);
    lastFetchedTerm.current = '';
  }, [editingTerm, visible]);

  // Debounced auto-fetch
  useEffect(() => {
    const trimmed = en.trim();
    if (editingTerm || trimmed.length < 3 || trimmed === lastFetchedTerm.current) {
      if (trimmed.length < 3) { setAiSuggestion(null); setAiError(null); }
      return;
    }
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => triggerFetch(trimmed), 900);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [en, category, editingTerm]);

  const triggerFetch = async (term: string) => {
    lastFetchedTerm.current = term;
    setAiLoading(true);
    setAiError(null);
    setAiSuggestion(null);
    setAiExpanded(true);
    try {
      const suggestion = await fetchAISuggestion(term, category);
      setAiSuggestion(suggestion);
    } catch (err: any) {
      setAiError(err?.message || 'Unknown error occurred.');
    } finally {
      setAiLoading(false);
    }
  };

  // Manual test button — fires immediately, no debounce, no length check
  const handleManualTest = async () => {
    const term = en.trim() || 'Heart';
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    lastFetchedTerm.current = '';
    await triggerFetch(term);
  };

  const handleApplySuggestion = (suggestion: AISuggestion) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAr(suggestion.arabicMSA);
    setAiExpanded(false);
  };

  const handleSave = () => {
    if (!en.trim() || !ar.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Required Fields', 'Please fill in both English and Arabic terms.');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const term: CustomTerm = {
      id: editingTerm?.id || `custom_${Date.now()}`,
      en: en.trim(),
      ar: ar.trim(),
      category,
      notes: aiSuggestion
        ? `EGY: ${aiSuggestion.arabicEgyptian} | LEV: ${aiSuggestion.arabicLevantine}${aiSuggestion.notes ? ' | ' + aiSuggestion.notes : ''}`
        : '',
      createdAt: editingTerm?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSave(term);
    onClose();
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const handleCategorySelect = (cat: 'medical' | 'legal') => {
    Haptics.selectionAsync();
    if (cat !== category) { setAiSuggestion(null); setAiError(null); lastFetchedTerm.current = ''; }
    setCategory(cat);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'flex-end' }}
        >
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>

            {/* Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                  {editingTerm ? 'Edit Term' : 'Add New Term'}
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.colors.textMuted }]}>
                  {editingTerm ? 'Update your personal glossary entry' : 'Type a term — AI will suggest translations'}
                </Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={[styles.closeBtn, { backgroundColor: theme.colors.inputBackground }]}>
                <X size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 8 }} keyboardShouldPersistTaps="handled">

              {/* Category Selector */}
              <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>Category</Text>
              <View style={styles.categoryRow}>
                {(['medical', 'legal'] as const).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => handleCategorySelect(cat)}
                    style={[styles.categoryPill, {
                      backgroundColor: category === cat ? theme.colors.primary + '18' : theme.colors.inputBackground,
                      borderColor: category === cat ? theme.colors.primary : 'transparent',
                    }]}
                  >
                    <Tag size={14} color={category === cat ? theme.colors.primary : theme.colors.textMuted} />
                    <Text style={[styles.categoryPillText, { color: category === cat ? theme.colors.primary : theme.colors.textMuted }]}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* English Input */}
              <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary, marginTop: 20 }]}>English Term</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.divider }]}>
                <Languages size={18} color={theme.colors.textMuted} style={{ marginRight: 12 }} />
                <TextInput
                  placeholder="Enter English term..."
                  placeholderTextColor={theme.colors.textMuted}
                  value={en}
                  onChangeText={setEn}
                  style={[styles.input, { color: theme.colors.text }]}
                  autoCorrect={false}
                />
              </View>

              {/* ── MANUAL TEST BUTTON (remove this after confirming it works) ── */}
              {!editingTerm && (
                <TouchableOpacity
                  onPress={handleManualTest}
                  style={[styles.testBtn, { borderColor: theme.colors.primary + '60', backgroundColor: theme.colors.primary + '10' }]}
                  activeOpacity={0.7}
                >
                  <Sparkles size={14} color={theme.colors.primary} />
                  <Text style={[styles.testBtnText, { color: theme.colors.primary }]}>
                    Test AI Suggestion {en.trim() ? `for "${en.trim()}"` : '(uses "Heart")'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* AI Suggestion Banner */}
              <View style={{ marginTop: 12 }}>
                <AISuggestionBanner
                  isLoading={aiLoading}
                  suggestion={aiSuggestion}
                  error={aiError}
                  isExpanded={aiExpanded}
                  onToggleExpand={() => setAiExpanded(v => !v)}
                  onApply={handleApplySuggestion}
                  termName={en.trim() || 'Heart'}
                />
              </View>

              {/* Arabic Input */}
              <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary, marginTop: 4 }]}>Arabic Translation (MSA)</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.divider }]}>
                <Languages size={18} color={theme.colors.textMuted} style={{ marginRight: 12 }} />
                <TextInput
                  placeholder="Enter Arabic translation..."
                  placeholderTextColor={theme.colors.textMuted}
                  value={ar}
                  onChangeText={setAr}
                  style={[styles.input, { color: theme.colors.text, textAlign: 'right' }]}
                />
              </View>

              {aiSuggestion && !aiLoading && (
                <Text style={[styles.dialectHint, { color: theme.colors.textMuted }]}>
                  Egyptian & Levantine variants saved in notes automatically.
                </Text>
              )}

              {/* Save */}
              <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: theme.colors.primary }]} activeOpacity={0.85}>
                <Save size={18} color="#fff" />
                <Text style={styles.saveBtnText}>Save Term</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleClose} style={styles.cancelBtn}>
                <Text style={[styles.cancelBtnText, { color: theme.colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  modalContainer: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40,
    minHeight: '60%',
    shadowColor: '#000', shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.2, shadowRadius: 20, elevation: 16,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  modalTitle: { fontSize: 24, fontWeight: '700' },
  modalSubtitle: { fontSize: 13, marginTop: 4 },
  closeBtn: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  sectionLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  categoryRow: { flexDirection: 'row', gap: 10 },
  categoryPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, gap: 6 },
  categoryPillText: { fontSize: 14, fontWeight: '600' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingHorizontal: 16, height: 52, borderWidth: 1 },
  input: { flex: 1, fontSize: 16, fontWeight: '500' },
  testBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1.5 },
  testBtnText: { fontSize: 13, fontWeight: '600' },
  dialectHint: { fontSize: 11, marginTop: 6, marginBottom: 4, fontStyle: 'italic', textAlign: 'center' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 14, marginTop: 28, gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: { marginTop: 14, alignItems: 'center', paddingVertical: 8 },
  cancelBtnText: { fontSize: 15, fontWeight: '500' },
});