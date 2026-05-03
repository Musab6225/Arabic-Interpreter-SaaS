import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Trash2, Edit2 } from 'lucide-react-native';
// Import the storage service and modal we created
import { CustomTermStorage, CustomTerm } from '../services/CustomTermStorage';
import AddTermModal from '../components/AddTermModal';

export default function MyGlossaryScreen() {
  const { theme } = useTheme();
  
  // State for terms and modal visibility
  const [terms, setTerms] = useState<CustomTerm[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTerm, setEditingTerm] = useState<CustomTerm | null>(null);

  // Load terms from local storage when screen opens
  const loadTerms = useCallback(async () => {
    const storedTerms = await CustomTermStorage.getAll();
    setTerms([...storedTerms]); // Spread into a new array to force re-render
  }, []);

  useEffect(() => {
    loadTerms();
  }, [loadTerms]);

  const handleSaveTerm = async (term: CustomTerm) => {
    // FIX: Ensure new terms have a unique ID so they can be identified for deletion[cite: 3]
    const termWithId = {
      ...term,
      id: term.id || `term-${Date.now()}` 
    };

    await CustomTermStorage.save(termWithId);
    setModalVisible(false); // FIX: Ensure the modal closes after saving[cite: 3]
    await loadTerms(); 
  };

  const handleDelete = (id: string) => {
    // Safety check: Don't try to delete if the ID is missing[cite: 3]
    if (!id) {
      Alert.alert("Error", "This term cannot be deleted because it has no ID.");
      return;
    }

    Alert.alert("Delete Term", "Are you sure you want to remove this term?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive", 
        onPress: async () => {
          // 1. Delete from physical storage[cite: 3]
          await CustomTermStorage.delete(id);
          
          // 2. FIX: Manually filter the state so the item vanishes instantly[cite: 3]
          setTerms((currentTerms) => currentTerms.filter((t) => t.id !== id));
          
          // 3. Sync with storage[cite: 3]
          loadTerms();
        } 
      }
    ]);
  };

  const renderItem = ({ item }: { item: CustomTerm }) => (
    <View style={[styles.itemRow, { borderBottomColor: theme.colors.divider }]}>
      <View style={styles.termContainer}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.englishText, { color: theme.colors.text }]}>{item.en}</Text>
          <Text style={[styles.categoryLabel, { color: theme.colors.tabBarInactive }]}>{item.category}</Text>
        </View>
        <Text style={[styles.arabicText, { color: theme.colors.primary }]}>{item.ar}</Text>
      </View>
      
      {/* Actions: Edit/Delete[cite: 3] */}
      <View style={styles.itemActions}>
        <TouchableOpacity onPress={() => { setEditingTerm(item); setModalVisible(true); }}>
          <Edit2 size={18} color={theme.colors.tabBarInactive} style={{ marginRight: 20 }} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id)}>
          <Trash2 size={18} color="#FF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* Header with Add Button[cite: 3] */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>My Personal Terms</Text>
        <TouchableOpacity 
          onPress={() => { setEditingTerm(null); setModalVisible(true); }}
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={terms}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        // extraData ensures FlatList re-renders when the terms array changes[cite: 3]
        extraData={terms}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ color: theme.colors.tabBarInactive, textAlign: 'center' }}>
              Your personal glossary is empty.{"\n"}Tap the + button to add your first term.
            </Text>
          </View>
        }
      />

      {/* The Add/Edit Modal[cite: 3] */}
      <AddTermModal 
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveTerm}
        editingTerm={editingTerm}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    padding: 20, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  addButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 2,
    shadowOpacity: 0.2
  },
  listContent: { paddingBottom: 100 },
  itemRow: { padding: 16, borderBottomWidth: 1 },
  termContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  englishText: { fontSize: 16, fontWeight: '500' },
  categoryLabel: { fontSize: 12, marginTop: 4, textTransform: 'capitalize' },
  arabicText: { fontSize: 18, fontWeight: 'bold', textAlign: 'right', flex: 1 },
  itemActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  emptyContainer: { marginTop: 50, paddingHorizontal: 40 }
});