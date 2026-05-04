import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Trash2, Edit2, BookOpen, FolderOpen } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { CustomTermStorage, CustomTerm } from '../services/CustomTermStorage';
import AddTermModal from '../components/AddTermModal';

export default function MyGlossaryScreen() {
  const { theme } = useTheme();

  const [terms, setTerms] = useState<CustomTerm[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTerm, setEditingTerm] = useState<CustomTerm | null>(null);

  const loadTerms = useCallback(async () => {
    const storedTerms = await CustomTermStorage.getAll();
    setTerms([...storedTerms]);
  }, []);

  useEffect(() => {
    loadTerms();
  }, [loadTerms]);

  const handleSaveTerm = async (term: CustomTerm) => {
    const termWithId = {
      ...term,
      id: term.id || `term-${Date.now()}`
    };
    
    await CustomTermStorage.save(termWithId);
    setModalVisible(false);
    await loadTerms();
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDelete = (id: string) => {
  if (!id) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Alert.alert('Error', 'This term cannot be deleted because it has no ID.');
    return;
  }

  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

  const doDelete = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await CustomTermStorage.delete(id);
    setTerms((currentTerms) => currentTerms.filter((t) => t.id !== id));
    await loadTerms();
  };

  if (Platform.OS === 'web') {
    // Alert doesn't work on web — use browser confirm instead
    if (window.confirm('Are you sure you want to delete this term?')) {
      doDelete();
    }
  } else {
    Alert.alert('Delete Term', 'Are you sure you want to remove this term?', [
      { text: 'Cancel', style: 'cancel', onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) },
      { text: 'Delete', style: 'destructive', onPress: doDelete },
    ]);
  }
};

  const handleEdit = (item: CustomTerm) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingTerm(item);
    setModalVisible(true);
  };

  const handleAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEditingTerm(null);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setModalVisible(false);
  };

  const renderItem = ({ item }: { item: CustomTerm }) => (
    <View style={[
      styles.itemRow, 
      { 
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.cardBorder,
      }
    ]}>
      <View style={styles.termContainer}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.englishText, { color: theme.colors.text }]}>{item.en}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.categoryChip, { backgroundColor: theme.colors.primary + '14' }]}>
              <Text style={[styles.categoryLabel, { color: theme.colors.primary }]}>{item.category}</Text>
            </View>
          </View>
        </View>
        <Text style={[styles.arabicText, { color: theme.colors.primary }]}>{item.ar}</Text>
      </View>

      {/* Actions */}
      <View style={styles.itemActions}>
        <TouchableOpacity 
          onPress={() => handleEdit(item)} 
          style={[styles.actionBtn, { backgroundColor: theme.colors.inputBackground }]}
        >
          <Edit2 size={16} color={theme.colors.tabBarInactive} />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => handleDelete(item.id)} 
          style={[styles.actionBtn, { backgroundColor: theme.colors.error + '12' }]}
        >
          <Trash2 size={16} color={theme.colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>My Personal Terms</Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textMuted }]}>
            {terms.length} custom {terms.length === 1 ? 'term' : 'terms'} saved
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleAdd}
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          activeOpacity={0.85}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={terms}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        extraData={terms}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: theme.colors.inputBackground }]}>
              <FolderOpen size={36} color={theme.colors.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Your Glossary is Empty</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
              Tap the + button to add your first custom translation term
            </Text>
          </View>
        }
      />

      <AddTermModal
        visible={modalVisible}
        onClose={handleCloseModal}
        onSave={handleSaveTerm}
        editingTerm={editingTerm}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  headerTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 14, marginTop: 4, fontWeight: '500' },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  listContent: { padding: 20, paddingBottom: 100, gap: 12 },
  itemRow: { 
    padding: 18, 
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  termContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  englishText: { fontSize: 16, fontWeight: '600' },
  metaRow: { flexDirection: 'row', marginTop: 8, gap: 8 },
  categoryChip: { 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 6,
  },
  categoryLabel: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize', letterSpacing: 0.3 },
  arabicText: { fontSize: 18, fontWeight: '700', textAlign: 'right', flex: 1, marginLeft: 16 },
  itemActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14, gap: 8 },
  actionBtn: { 
    width: 36, 
    height: 36, 
    borderRadius: 10, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  emptyContainer: { marginTop: 80, paddingHorizontal: 40, alignItems: 'center' },
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