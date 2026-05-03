import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Modal, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { X, Save, Languages, Tag } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { CustomTerm } from '../services/CustomTermStorage';

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

  useEffect(() => {
    if (editingTerm) {
      setEn(editingTerm.en);
      setAr(editingTerm.ar);
      setCategory(editingTerm.category);
    } else {
      setEn(''); setAr(''); setCategory('medical');
    }
  }, [editingTerm, visible]);

  const handleSave = () => {
    const term: CustomTerm = {
      id: editingTerm?.id || `custom_${Date.now()}`,
      en: en.trim(),
      ar: ar.trim(),
      category,
      notes: '',
      createdAt: editingTerm?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSave(term);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={{ color: theme.colors.text, fontSize: 20, marginBottom: 20 }}>Add New Term</Text>
          <TextInput 
            placeholder="English" 
            value={en} 
            onChangeText={setEn} 
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]} 
          />
          <TextInput 
            placeholder="Arabic" 
            value={ar} 
            onChangeText={setAr} 
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, textAlign: 'right' }]} 
          />
          <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: theme.colors.primary }]}>
            <Text style={{ color: '#fff' }}>Save Term</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={{ marginTop: 10 }}>
            <Text style={{ color: theme.colors.textSecondary }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', padding: 20 },
  modalContainer: { padding: 20, borderRadius: 15 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 15 },
  saveBtn: { padding: 15, borderRadius: 8, alignItems: 'center' }
});