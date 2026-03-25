import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing } from '../../constants/theme';
import apiService, { CastawaySearchResult } from '../../services/api';

export interface FavoriteCastaway {
  id: number;
  name: string;
}

interface FavoriteCastawaysInputProps {
  favoriteCastaways: FavoriteCastaway[];
  onChange: (castaways: FavoriteCastaway[]) => void;
}

interface CastawayRowProps {
  castaway: FavoriteCastaway;
  onDelete: (id: number) => void;
}

function CastawayRow({ castaway, onDelete }: CastawayRowProps) {
  return (
    <View style={styles.castawayRow}>
      <Text style={styles.castawayNameText}>{castaway.name}</Text>
      <TouchableOpacity onPress={() => onDelete(castaway.id)}>
        <Ionicons name="trash" size={20} color={Colors.warning} />
      </TouchableOpacity>
    </View>
  );
}

export default function FavoriteCastawaysInput({ favoriteCastaways, onChange }: FavoriteCastawaysInputProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<CastawaySearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchCastaways = async () => {
      if (!searchText.trim()) {
        setSearchResults([]);
        return;
      }

      try {
        setLoading(true);
        const results = await apiService.searchCastaways(searchText);
        setSearchResults(results);
      } catch (error) {
        console.error('Failed to search castaways:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchCastaways, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchText]);

  const handleAddCastaway = (castaway: CastawaySearchResult) => {
    if (!favoriteCastaways.find((c) => c.id === castaway.castawayId)) {
      onChange([
        ...favoriteCastaways,
        {
          id: castaway.castawayId,
          name: castaway.fullName,
        },
      ]);
    }
    setSearchText('');
    setSearchResults([]);
    setModalVisible(false);
  };

  const handleDeleteCastaway = (id: number) => {
    onChange(favoriteCastaways.filter((c) => c.id !== id));
  };

  const availableCastaways = searchResults.filter(
    (castaway) => !favoriteCastaways.find((c) => c.id === castaway.castawayId)
  );

  const canAddMoreCastaways = favoriteCastaways.length < 3;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Favorite Castaways</Text>
        <Text style={styles.countText}>{favoriteCastaways.length}/3</Text>
      </View>

      {favoriteCastaways.length === 0 ? (
        <Text style={styles.emptyText}>No favorite castaways added yet</Text>
      ) : (
        <FlatList
          data={favoriteCastaways}
          keyExtractor={(item) => String(item.id)}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <CastawayRow castaway={item} onDelete={handleDeleteCastaway} />
          )}
        />
      )}

      <TouchableOpacity
        style={[styles.addButton, !canAddMoreCastaways && styles.addButtonDisabled]}
        onPress={() => setModalVisible(true)}
        disabled={!canAddMoreCastaways}
      >
        <Ionicons
          name="add"
          size={20}
          color={!canAddMoreCastaways ? Colors.textSecondary : '#000'}
        />
        <Text style={[styles.addButtonText, !canAddMoreCastaways && styles.addButtonTextDisabled]}>
          Add Castaway
        </Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setModalVisible(false);
          setSearchText('');
          setSearchResults([]);
        }}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            setModalVisible(false);
            setSearchText('');
            setSearchResults([]);
          }}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Search Castaways</Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setSearchText('');
                  setSearchResults([]);
                }}
              >
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name..."
                value={searchText}
                onChangeText={setSearchText}
                placeholderTextColor={Colors.textSecondary}
              />
              {searchText !== '' && (
                <TouchableOpacity onPress={() => setSearchText('')}>
                  <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={styles.modalBody}>
              {loading && <ActivityIndicator size="large" color={Colors.primary} />}

              {!loading && searchText && availableCastaways.length === 0 && (
                <Text style={styles.modalEmptyText}>No castaways found</Text>
              )}

              {!loading &&
                !searchText &&
                <Text style={styles.modalEmptyText}>Type to search for castaways</Text>
              }

              {!loading &&
                availableCastaways.map((castaway) => (
                  <TouchableOpacity
                    key={castaway.castawayId}
                    style={styles.modalOption}
                    onPress={() => handleAddCastaway(castaway)}
                  >
                    <Text style={styles.modalOptionText}>{castaway.fullName}</Text>
                    {favoriteCastaways.find((c) => c.id === castaway.castawayId) && (
                      <Ionicons name="checkmark" size={20} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: FontSizes.medium,
    fontWeight: '600',
    color: Colors.text,
  },
  countText: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  castawayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.md,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
    height: 54,
  },
  castawayNameText: {
    flex: 1,
    fontSize: FontSizes.medium,
    color: Colors.text,
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    height: 54,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000',
    gap: Spacing.sm,
    backgroundColor: '#fff',
  },
  addButtonText: {
    fontSize: FontSizes.medium,
    fontWeight: '600',
    color: '#000',
  },
  addButtonDisabled: {
    opacity: 0.5,
    borderColor: Colors.textSecondary,
  },
  addButtonTextDisabled: {
    color: Colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: '70%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: FontSizes.large,
    fontWeight: '700',
    color: Colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.medium,
    color: Colors.text,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
  },
  modalBody: {
    maxHeight: 300,
  },
  modalEmptyText: {
    textAlign: 'center',
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    paddingVertical: Spacing.lg,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalOptionText: {
    fontSize: FontSizes.medium,
    color: Colors.text,
    flex: 1,
  },
});
