import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import api from '../../utils/api';

interface FavoriteOutfit {
  favorite_id: number;
  user_id: number;
  try_on_url: string;
  created_at: string;
  suggestion: string;
  name: string;
  top: {
    id: number;
    image_url: string;
    category: string;
    description: string;
    tags: string;
    subcategory: string;
  };
  bottom: {
    id: number;
    image_url: string;
    category: string;
    description: string;
    tags: string;
    subcategory: string;
  };
}

export default function Favorites() {
  const router = useRouter();
  const navigation = useNavigation();
  const [favorites, setFavorites] = useState<FavoriteOutfit[]>([]);
  const [pressed, setPressed] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedOutfit, setSelectedOutfit] = useState<FavoriteOutfit | null>(null);
  const [expandedOutfitId, setExpandedOutfitId] = useState<number | null>(null);

  useEffect(() => {
    fetchFavorites();

    // Add focus listener to refresh content
    const unsubscribe = navigation.addListener('focus', () => {
      setRefreshKey(prev => prev + 1);
      fetchFavorites();
    });

    return unsubscribe;
  }, [navigation]);

  const fetchFavorites = async () => {
    try {
      const response = await api.get<FavoriteOutfit[]>('/favorites');
      setFavorites(response.data);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const handleRemoveFavorite = async (id: number) => {
    try {
      await api.delete(`/favorites/${id}`);
      setFavorites(prev => prev.filter(fav => fav.favorite_id !== id));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  // Function to toggle the expanded state
  const toggleExpand = (id: number) => {
    setExpandedOutfitId(prev => (prev === id ? null : id));
  };

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
              <Text style={styles.title}>Your Saved Outfits</Text>
            </View>
          </View>

          {favorites.length > 0 ? (
            <View style={styles.outfitsGrid}>
              {favorites.map((outfit) => (
                <TouchableOpacity
                  key={outfit.favorite_id}
                  onPressIn={() => setPressed(outfit.favorite_id)}
                  onPressOut={() => setPressed(null)}
                  onPress={() => toggleExpand(outfit.favorite_id)}
                  style={[
                    styles.outfitCard,
                    pressed === outfit.favorite_id && styles.outfitCardPressed
                  ]}
                >
                  <Image source={{ uri: outfit.top.image_url }} style={styles.outfitImage} />
                  <View style={styles.outfitOverlay}>
                    <View>
                      <Text style={styles.outfitName}>{outfit.name}</Text>
                      <Text style={styles.outfitDetails}>
                        {new Date(outfit.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveFavorite(outfit.favorite_id)}
                    >
                      <Ionicons name="heart" size={24} color="#B666D2" />
                    </TouchableOpacity>
                  </View>
                  {expandedOutfitId === outfit.favorite_id && (
                    <View style={styles.detailsContainer}>
                      <Text style={styles.detailsTitle}>{outfit.name}</Text>
                      <Image source={{ uri: outfit.top.image_url }} style={styles.detailsImage} />
                      <Text style={styles.detailsText}>{outfit.top.description}</Text>
                      <Text style={styles.detailsText}>Category: {outfit.top.category}</Text>
                      <Text style={styles.detailsText}>Tags: {outfit.top.tags}</Text>
                      {outfit.bottom.image_url && (
                        <View>
                          <Text style={styles.detailsTitle}>Bottom Outfit</Text>
                          <Image source={{ uri: outfit.bottom.image_url }} style={styles.detailsImage} />
                          <Text style={styles.detailsText}>{outfit.bottom.description}</Text>
                          <Text style={styles.detailsText}>Category: {outfit.bottom.category}</Text>
                          <Text style={styles.detailsText}>Tags: {outfit.bottom.tags}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="heart-outline" size={48} color="rgba(255, 255, 255, 0.3)" />
              </View>
              <Text style={styles.emptyText}>No favorite outfits yet</Text>
              <TouchableOpacity
                style={styles.exploreButton}
                onPress={() => router.push('/(tabs)/generate')}
              >
                <LinearGradient
                  colors={['#A855F7', '#EC4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <View style={styles.buttonContent}>
                    <Ionicons name="color-wand-outline" size={24} color="#ffffff" />
                    <Text style={styles.exploreButtonText}>Generate Outfits</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Display selected outfit details */}
          {/* {selectedOutfit ? (
            <ScrollView>
              <View style={styles.detailsContainer}>
                <Text style={styles.detailsTitle}>{selectedOutfit.name}</Text>
                <Image source={{ uri: selectedOutfit.top.image_url }} style={styles.detailsImage} />
                <Text style={styles.detailsText}>{selectedOutfit.top.description}</Text>
                <Text style={styles.detailsText}>Category: {selectedOutfit.top.category}</Text>
                <Text style={styles.detailsText}>Tags: {selectedOutfit.top.tags}</Text>
                {selectedOutfit.bottom.image_url && (
                  <View>
                    <Text style={styles.detailsTitle}>Bottom Outfit</Text>
                    <Image source={{ uri: selectedOutfit.bottom.image_url }} style={styles.detailsImage} />
                    <Text style={styles.detailsText}>{selectedOutfit.bottom.description}</Text>
                    <Text style={styles.detailsText}>Category: {selectedOutfit.bottom.category}</Text>
                    <Text style={styles.detailsText}>Tags: {selectedOutfit.bottom.tags}</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          ) : (
            <View>
              <Text>No outfit selected</Text>
            </View>
          )} */}
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
    backgroundColor: 'rgba(0, 0, 0, 0.97)',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingTop: 16,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
    paddingHorizontal: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '400',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  filterButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(15, 15, 20, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  outfitsGrid: {
    gap: 20,
  },
  outfitCard: {
    borderRadius: 20,
    overflow: 'hidden',
    height: 220,
    backgroundColor: 'rgba(15, 15, 20, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 12,
    marginBottom: 16,
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
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  outfitName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  outfitDetails: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  removeButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(15, 15, 20, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(15, 15, 20, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 16,
    marginBottom: 24,
    letterSpacing: 0.3,
  },
  exploreButton: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: 'rgba(168, 85, 247, 0.5)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  buttonGradient: {
    width: '100%',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 10,
  },
  exploreButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  detailsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,

  },
  detailsImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  detailsText: {
    fontSize: 16,
    marginBottom: 5,

  }
}); 