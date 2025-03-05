import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import { WardrobeItem } from '../../types';
import api from '../../utils/api';
import { BlurView } from 'expo-blur';
import { MotiView, MotiText, AnimatePresence } from 'moti';

const categories = ['All', 'Tops', 'Bottoms', 'Dresses', 'Shoes', 'Accessories'];

export default function Wardrobe() {
  const router = useRouter();
  const navigation = useNavigation();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [filteredWardrobe, setFilteredWardrobe] = useState<WardrobeItem[]>([]);
  const [pressed, setPressed] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchWardrobe();

    // Add focus listener to refresh content
    const unsubscribe = navigation.addListener('focus', () => {
      // Reset all states
      setRefreshKey(prev => prev + 1);
      setSelectedCategory('All');
      setSearchTerm('');
      setPressed(null);
      setIsLoading(true);
      // Fetch fresh data
      fetchWardrobe();
    });

    return unsubscribe;
  }, [navigation]);

  const fetchWardrobe = async () => {
    try {
      setIsLoading(true);
      const response = await api.get<WardrobeItem[]>('/wardrobe');
      const items = response.data || [];
      setWardrobe(items);
      setFilteredWardrobe(items);
    } catch (error) {
      console.error('Error fetching wardrobe:', error);
      setWardrobe([]);
      setFilteredWardrobe([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!Array.isArray(wardrobe)) {
      setFilteredWardrobe([]);
      return;
    }

    let filtered = [...wardrobe];
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredWardrobe(filtered);
  }, [selectedCategory, searchTerm, wardrobe]);

  

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(10, 10, 14, 0.98)', 'rgba(18, 18, 22, 0.97)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView
          key={refreshKey}
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.subtitle}> </Text>
              <Text style={styles.title}>Your Digital Wardrobe</Text>
            </View>
          </View>

          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', delay: 200 }}
            style={styles.searchContainer}
          >
            <Ionicons name="search" size={20} color="rgba(255, 255, 255, 0.4)" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search your wardrobe..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </MotiView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesContainer}
            contentContainerStyle={styles.categoriesContent}
          >
            {categories.map((category, index) => (
              <MotiView
                key={category}
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: 'timing', delay: 300 + index * 100 }}
              >
                <TouchableOpacity
                  onPress={() => setSelectedCategory(category)}
                  style={[
                    styles.categoryChip,
                    !(category === selectedCategory) && styles.unselectedChip,
                  ]}
                >
                  {category === selectedCategory ? (
                    <LinearGradient
                      colors={['#A855F7', '#EC4899']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.chipGradient}
                    >
                      <Text style={styles.selectedChipText}>
                        {category}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <Text style={styles.categoryChipText}>
                      {category}
                    </Text>
                  )}
                </TouchableOpacity>
              </MotiView>
            ))}
          </ScrollView>

          {isLoading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color="#B666D2" />
            </View>
          ) : Array.isArray(filteredWardrobe) && filteredWardrobe.length > 0 ? (
            <View style={styles.outfitsGrid}>
              {filteredWardrobe.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPressIn={() => setPressed(item.id)}
                  onPressOut={() => setPressed(null)}
                  onPress={() => router.push(`/wardrobe/${item.id}`)}
                  style={[
                    styles.outfitCard,
                    pressed === item.id && styles.outfitCardPressed
                  ]}
                >
                  <Image source={{ uri: item.image_url }} style={styles.outfitImage} />
                  <View style={styles.outfitOverlay}>
                    <View>
                      <Text style={styles.outfitName}>{item.tags}</Text>
                      <Text style={styles.outfitDetails}>
                        {item.category} • {item.subcategory}
                      </Text>
                    </View>
                    
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="shirt-outline" size={48} color="rgba(255, 255, 255, 0.3)" />
              </View>
              <Text style={styles.emptyText}>No items found</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => router.push('/upload')}
              >
                <LinearGradient
                  colors={['#A855F7', '#EC4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <View style={styles.buttonContent}>
                    <Ionicons name="add" size={24} color="#fff" />
                    <Text style={styles.addButtonText}>Add New Item</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '400',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: '600',
  },
  filterButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(20, 20, 20, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 15, 20, 0.95)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '400',
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categoriesContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  categoryChip: {
    borderRadius: 24,
    overflow: 'hidden',
    minWidth: 90,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  unselectedChip: {
    backgroundColor: 'rgba(15, 15, 20, 0.95)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  chipGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    width: '100%',
  },
  categoryChipText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedChipText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  outfitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingTop: 16,
  },
  outfitCard: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 15, 20, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 12,
  },
  outfitCardPressed: {
    transform: [{ scale: 0.98 }],
  },
  outfitImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  outfitOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  outfitName: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.1,
  },
  outfitDetails: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 14,
    letterSpacing: 0.1,
  },
  removeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(20, 20, 20, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 15,
    marginBottom: 20,
    letterSpacing: 0.1,
  },
  addButton: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  buttonGradient: {
    width: '100%',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});