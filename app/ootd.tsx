import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet, TextInput } from 'react-native';
import { Heart, Share2, Download, X } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../utils/api';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';

interface ClothItem {
  id: number;
  image_url: string;
}

export default function OOTD() {
  const [isLoading, setIsLoading] = useState(true);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveForm, setSaveForm] = useState({ name: '', occasion: '' });
  const [vtonImage, setVtonImage] = useState(null);
  const [top, setTop] = useState<ClothItem | null>(null);
  const [bottom, setBottom] = useState<ClothItem | null>(null);
  const [suggestion, setSuggestion] = useState("");
  const [showNamePopup, setShowNamePopup] = useState(false);
  const [outfitName, setOutfitName] = useState('');

  const router = useRouter();
  const params = useLocalSearchParams();
  const outfit = params.outfit ? JSON.parse(params.outfit as string) : null;

  useEffect(() => {
    if (!outfit) {
      console.error('No outfit data found');
      setIsLoading(false);
      return;
    }

    const topItem = outfit?.find((item: any) => item.key === 'Top')?.clothId;
    const bottomItem = outfit?.find((item: any) => item.key === 'Bottom')?.clothId;
    const outfitSuggestion = outfit?.find((item: any) => item.key === 'suggestions')?.suggestion;

    if (topItem && bottomItem) {
      setTop(topItem);
      setBottom(bottomItem);
      setSuggestion(outfitSuggestion || "");
    }

    if (!top || !bottom) {
      console.error('Missing top or bottom item');
      setIsLoading(false);
      return;
    }

    fetchVtonImage();
  }, [outfit]);

  const fetchVtonImage = async () => {
    if (!top?.image_url || !bottom?.image_url) return;

    try {
      const response = await api.post('/virtualtryon', {
        top: top.image_url,
        bottom: bottom.image_url
      });
      setVtonImage(response.data.output);
    } catch (error) {
      console.error('Error fetching VTON image:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      if (vtonImage) {
        const base64Image = `data:image/jpeg;base64,${vtonImage}`;
        const filename = FileSystem.documentDirectory + "outfit.jpg";
        await FileSystem.writeAsStringAsync(filename, base64Image.split(',')[1], {
          encoding: FileSystem.EncodingType.Base64,
        });

        await Sharing.shareAsync(filename);
      }
    } catch (error) {
      console.error('Error sharing image:', error);
    }
  };

  const handleSaveOutfit = async () => {
    if (!saveSuccess) {
      setShowNamePopup(true);
    }
  };

  const handleSubmitName = async () => {
    if (!outfitName.trim() || !top?.id || !bottom?.id || !vtonImage || !suggestion) return;

    try {
      const response = await api.post('/favorites', {
        top: top.id,
        bottom: bottom.id,
        vtonimage: vtonImage,
        suggestion: suggestion,
        name: outfitName
      });

      if (response.status === 201) {
        setSaveSuccess(true);
        setShowNamePopup(false);
        setOutfitName('');
      } else {
        alert("Something went wrong. Please try again.");
      }
    } catch (error: any) {
      console.error("Failed to Save:", error);
      if (error.response?.status === 409) {
        alert("This outfit is already in your favorites.");
      } else {
        alert("Unexpected error. Please try again.");
      }
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(0, 0, 0, 0.9)', 'rgba(18, 18, 18, 0.95)']}
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../assets/noBgColor.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>

          <View style={styles.content}>
            <View style={styles.card}>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Generating Virtual Try-On...</Text>
                </View>
              ) : vtonImage ? (
                <Image
                  source={{ uri: `data:image/jpeg;base64,${vtonImage}` }}
                  style={styles.image}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.loadingContainer}>
                  <Text style={styles.errorText}>Failed to load image</Text>
                </View>
              )}

              <View style={styles.cardFooter}>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    onPress={handleSaveOutfit}
                    style={styles.iconButton}
                  >
                    <LinearGradient
                      colors={saveSuccess ? ['#EC4899', '#EC4899'] : ['rgba(15, 15, 20, 0.95)', 'rgba(15, 15, 20, 0.95)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.iconGradient}
                    >
                      <Heart size={20} color={saveSuccess ? "#ffffff" : "#ffffff"} />
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleShare}
                    style={styles.iconButton}
                  >
                    <LinearGradient
                      colors={['rgba(15, 15, 20, 0.95)', 'rgba(15, 15, 20, 0.95)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.iconGradient}
                    >
                      <Share2 size={20} color="#fff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.itemsContainer}>
              {outfit?.map((item: any) => (
                item.clothId && (
                  <View key={item.clothId.id} style={styles.itemCard}>
                    <View style={styles.itemContent}>
                      <Image
                        source={{ uri: item.clothId.image_url }}
                        style={styles.itemImage}
                        resizeMode="cover"
                      />
                      <View style={styles.itemDetails}>
                        <Text style={styles.itemTitle}>{item.clothId.tags}</Text>
                        <Text style={styles.itemSubtitle}>{item.clothId.subcategory}</Text>
                        <View style={styles.itemTag}>
                          <Text style={styles.itemTagText}>{item.clothId.category}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )
              ))}

              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  onPress={handleSaveOutfit}
                  style={[
                    styles.button,
                    saveSuccess && styles.buttonDisabled
                  ]}
                >
                  <LinearGradient
                    colors={saveSuccess ? ['rgba(168, 85, 247, 0.5)', 'rgba(236, 72, 153, 0.5)'] : ['#A855F7', '#EC4899']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.buttonText}>
                      {saveSuccess ? "Saved to Favorites ✓" : "Save to Favorites"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push('/favorites')}
                  style={styles.button}
                >
                  <LinearGradient
                    colors={['#A855F7', '#EC4899']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.buttonText}>Go To Favorites</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push('/generate')}
                  style={styles.button}
                >
                  <LinearGradient
                    colors={['#A855F7', '#EC4899']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.buttonText}>Generate New Outfit</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>

        {showNamePopup && (
          <View style={styles.overlay}>
            <View style={styles.popup}>
              <View style={styles.popupHeader}>
                <Text style={styles.popupTitle}>Name Your Outfit</Text>
                <TouchableOpacity onPress={() => setShowNamePopup(false)}>
                  <X size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              <TextInput
                value={outfitName}
                onChangeText={setOutfitName}
                placeholder="Enter outfit name"
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                style={styles.input}
              />

              <TouchableOpacity
                onPress={handleSubmitName}
                disabled={!outfitName.trim()}
                style={[
                  styles.button,
                  !outfitName.trim() && styles.buttonDisabled
                ]}
              >
                <LinearGradient
                  colors={!outfitName.trim() ? ['rgba(168, 85, 247, 0.5)', 'rgba(236, 72, 153, 0.5)'] : ['#A855F7', '#EC4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>Save</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
  content: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 150,
    height: 50,
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
  card: {
    backgroundColor: 'rgba(15, 15, 20, 0.95)',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
    marginBottom: 24,
  },
  suggestion: {
    padding: 24,
    backgroundColor: 'rgba(10, 10, 15, 0.95)',
  },
  suggestionText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  image: {
    aspectRatio: 4 / 5,
    width: '100%',
  },
  cardFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 20,
  },
  iconButton: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  iconGradient: {
    padding: 16,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemsContainer: {
    gap: 20,
  },
  itemCard: {
    backgroundColor: 'rgba(15, 15, 20, 0.95)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  itemContent: {
    flexDirection: 'row',
    gap: 16,
  },
  itemImage: {
    width: 96,
    height: 96,
    borderRadius: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  itemSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  itemTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  itemTagText: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  buttonGroup: {
    gap: 12,
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
    opacity: 0.7,
  },
  button: {
    borderRadius: 16,
    marginVertical: 8,
    shadowColor: 'rgba(182, 102, 210, 0.5)',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    overflow: 'hidden',
    minHeight: 56,
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  popup: {
    backgroundColor: 'rgba(15, 15, 20, 0.98)',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 24,
  },
  popupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  popupTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: 'rgba(18, 18, 18, 0.8)',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    fontSize: 15,
  },
  loadingContainer: {
    aspectRatio: 4 / 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#ffffff',
  },
  errorText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
});