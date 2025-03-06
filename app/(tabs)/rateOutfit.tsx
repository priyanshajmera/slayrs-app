import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
  Dimensions,
  ActionSheetIOS,
  Alert
} from 'react-native';
import { launchImageLibrary, ImageLibraryOptions, ImagePickerResponse, Asset } from 'react-native-image-picker';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MotiView, MotiText } from 'moti';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../utils/api';
import { WardrobeItem } from '../../types';
import * as ImagePicker from 'expo-image-picker';
import rateOutfit from '../../utils/api';

// Define interface to group wardrobe items by category
interface WardrobeItems {
  [category: string]: WardrobeItem[];
}

interface RatingResponse {
  rating: number;
  review: string;
  title: string;
}

const RateOutfit: React.FC = () => {
  const navigation = useNavigation();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selectedClothes, setSelectedClothes] = useState<number[]>([]);
  const [rating, setRating] = useState<number>(0);
  const [review, setReview] = useState<string>('');
  const [hoveredStar, setHoveredStar] = useState<number>(0);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [step, setStep] = useState<number>(1);
  const [aiRating, setAiRating] = useState<number | null>(null);
  const [aiReview, setAiReview] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [wardrobeByCategory, setWardrobeByCategory] = useState<WardrobeItems>({});
  const [fetchingWardrobe, setFetchingWardrobe] = useState(false);

  // Add refresh functionality
  useEffect(() => {
    // Reset state on component mount
    resetState();

    // Fetch wardrobe data
    fetchWardrobe();

    // Add focus listener to refresh content when navigating back to this screen
    const unsubscribe = navigation.addListener('focus', () => {
      setRefreshKey(prev => prev + 1);
      resetState();
      fetchWardrobe();
    });

    return unsubscribe;
  }, [navigation]);

  // Function to reset all state values
  const resetState = () => {
    setSelectedOption(null);
    setSelectedClothes([]);
    setRating(0);
    setReview('');
    setHoveredStar(0);
    setCurrentImage(null);
    setIsLoading(false);
    setStep(1);
    setAiRating(null);
    setAiReview('');
  };

  // Fetch wardrobe items from API
  const fetchWardrobe = async () => {
    try {
      setFetchingWardrobe(true);
      const response = await api.get<WardrobeItem[]>('/wardrobe');
      const items = response.data || [];
      setWardrobe(items);

      // Group items by category
      const groupedItems: WardrobeItems = {};
      items.forEach(item => {
        if (!groupedItems[item.category]) {
          groupedItems[item.category] = [];
        }
        groupedItems[item.category].push(item);
      });

      setWardrobeByCategory(groupedItems);
    } catch (error) {
      console.error('Error fetching wardrobe:', error);
      // Use empty arrays on error
      setWardrobe([]);
      setWardrobeByCategory({});
    } finally {
      setFetchingWardrobe(false);
    }
  };

  // Define available categories (fallback if API doesn't provide any)
  const categories = Object.keys(wardrobeByCategory).length > 0
    ? Object.keys(wardrobeByCategory)
    : ['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes', 'Accessories'];

  const requestPermissions = async () => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    const galleryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraPermission.status !== 'granted' || galleryPermission.status !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Please grant camera and photo library permissions to use this feature.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const handleImagePicker = async () => {
    if (!(await requestPermissions())) return;

    if (Platform.OS === 'ios') {
      // Show action sheet on iOS
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            captureImage();
          } else if (buttonIndex === 2) {
            selectFromGallery();
          }
        }
      );
    } else {
      // Show Alert on Android
      Alert.alert(
        'Select Image',
        'Choose an option',
        [
          { text: 'Camera', onPress: captureImage },
          { text: 'Gallery', onPress: selectFromGallery },
          { text: 'Cancel', style: 'cancel' },
        ],
        { cancelable: true }
      );
    }
  };

  const captureImage = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri; // Store the URI in a local variable
        setCurrentImage(imageUri);

        setIsLoading(true);
        if (!imageUri) {
          console.error('No image selected');
          setIsLoading(false);
          return;
        }

        // Proceed with API call using the local imageUri
        try {
          const formDataToSend = new FormData();
          const filename = imageUri.split('/').pop() || 'upload.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';

          formDataToSend.append('image', {
            uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
            name: filename,
            type,
          } as any);



          const ratingResponse = await api.post('/rating/outfitrating', formDataToSend, {
            headers: {
              'Content-Type': 'multipart/form-data',
              Accept: 'application/json',
            },
          });

          setAiRating(Number(ratingResponse.data.rating));
          setAiReview(ratingResponse.data.review);
          setStep(2);
        } catch (error: any) {
          console.error('Failed to submit selection:', error.response ? error.response.data : error.message);
          Alert.alert('Error', 'Failed to submit image for rating');
        } finally {
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.log('Camera error: ', error);
      Alert.alert('Error', 'Failed to capture image');
    }
  };

  const selectFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri; // Store the URI in a local variable
        setCurrentImage(imageUri);

        setIsLoading(true);
        if (!imageUri) {
          console.error('No image selected');
          setIsLoading(false);
          return;
        }

        // Proceed with API call using the local imageUri
        try {
          const formDataToSend = new FormData();
          const filename = imageUri.split('/').pop() || 'upload.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';

          formDataToSend.append('image', {
            uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
            name: filename,
            type,
          } as any);



          const ratingResponse = await api.post('/rating/outfitrating', formDataToSend, {
            headers: {
              'Content-Type': 'multipart/form-data',
              Accept: 'application/json',
            },
          });

          setAiRating(Number(ratingResponse.data.rating));
          setAiReview(ratingResponse.data.review);
          setStep(2);
        } catch (error: any) {
          console.error('Failed to submit selection:', error.response ? error.response.data : error.message);
          Alert.alert('Error', 'Failed to submit image for rating');
        } finally {
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.log('Gallery error: ', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleClothesSelection = (id: number) => {
    if (selectedClothes.includes(id)) {
      setSelectedClothes(selectedClothes.filter(item => item !== id));
    } else {
      setSelectedClothes([...selectedClothes, id]);
    }
  };

  const handleSubmitSelection = async () => {
    setIsLoading(true);
    try {
      // Create a payload object instead of FormData
      const payload = {
        selectedClothes: selectedClothes.map((id) => {
          const item = wardrobe.find((item) => item.id === id);
          return item ? item.image_url : null;
        }).filter(url => url !== null), // Filter out null values
      };

      const ratingResponse = await api.post<RatingResponse>('/rating/wardroberating', payload);

      setAiRating(Number(ratingResponse.data.rating));
      setAiReview(ratingResponse.data.review);
      setStep(2);
    } catch (error) {
      console.error('Failed to submit selection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderCurrentOutfitUpload = () => (
    <View style={styles.contentContainer}>
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 500 }}
        style={styles.card}
      >
        <TouchableOpacity
          style={[styles.uploadContainer, currentImage ? styles.imageContainer : null]}
          onPress={handleImagePicker}
          activeOpacity={0.8}
        >
          {!currentImage ? (
            <View style={styles.uploadContent}>
              <LinearGradient
                colors={['#A855F7', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.iconGradient}
              >
                <Feather name="upload" size={30} color="#fff" />
              </LinearGradient>
              <Text style={styles.uploadTitle}>Upload Your Current Outfit</Text>
              <Text style={styles.uploadSubtitle}>Tap to select an image</Text>
            </View>
          ) : (
            <>
              <Image source={{ uri: currentImage }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setCurrentImage(null)}
              >
                <Ionicons name="close-circle" size={26} color="#fff" />
              </TouchableOpacity>
            </>
          )}
        </TouchableOpacity>
      </MotiView>

      {isLoading ? (
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 400 }}
          style={styles.loadingContainer}
        >
          <BlurView intensity={40} tint="dark" style={styles.blurContainer}>
            <ActivityIndicator size="large" color="#A855F7" />
            <Text style={styles.loadingText}>Analyzing your outfit...</Text>
          </BlurView>
        </MotiView>
      ) : aiRating !== null && (
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 500 }}
          style={styles.ratingContainer}
        >
          <BlurView intensity={30} tint="dark" style={styles.blurContainer}>
            <View style={styles.ratingHeader}>
              <Text style={styles.ratingTitle}>AI Rating</Text>
              <View style={styles.ratingValueContainer}>
                <Text style={styles.ratingValue}>{aiRating}</Text>
                <Text style={styles.ratingMax}>/5</Text>
              </View>
            </View>
            <View style={styles.ratingStars}>
              {[...Array(5)].map((_, i) => (
                <Ionicons
                  key={i}
                  name={i < aiRating ? "star" : "star-outline"}
                  size={24}
                  color={i < aiRating ? "#FFC107" : "rgba(255, 255, 255, 0.3)"}
                />
              ))}
            </View>
            <Text style={styles.ratingText}>{aiReview}</Text>
          </BlurView>
        </MotiView>
      )}
    </View>
  );

  const renderWardrobeSelection = () => (
    <View style={styles.contentContainer}>
      {step === 1 ? (
        <>
          {fetchingWardrobe ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#A855F7" />
              <Text style={styles.loadingText}>Loading your wardrobe...</Text>
            </View>
          ) : (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 500 }}
              style={styles.wardrobeContainer}
            >
              <ScrollView style={styles.categoryScroll}>
                {categories.map((category, index) => (
                  <MotiView
                    key={`category-${category}`}
                    from={{ opacity: 0, translateX: -20 }}
                    animate={{ opacity: 1, translateX: 0 }}
                    transition={{ type: 'timing', duration: 300, delay: index * 100 }}
                    style={styles.categoryContainer}
                  >
                    <Text style={styles.categoryTitle}>{category}</Text>
                    {(!wardrobeByCategory[category] || wardrobeByCategory[category].length === 0) ? (
                      <Text style={styles.emptyCategory}>No items in this category</Text>
                    ) : (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.itemsScroll}
                      >
                        {wardrobeByCategory[category]?.map((item) => (
                          <TouchableOpacity
                            key={`item-${item.id}`}
                            onPress={() => handleClothesSelection(item.id)}
                            style={[
                              styles.itemContainer,
                              selectedClothes.includes(item.id) && styles.selectedItem
                            ]}
                          >
                            <Image
                              source={{ uri: item.image_url }}
                              style={styles.itemImage}
                              resizeMode="cover"
                            />
                            {selectedClothes.includes(item.id) && (
                              <View style={styles.selectedOverlay}>
                                <Ionicons name="checkmark-circle" size={24} color="#A855F7" />
                              </View>
                            )}
                            <Text style={styles.itemName} numberOfLines={1}>{item.description || category}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                  </MotiView>
                ))}
              </ScrollView>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    selectedClothes.length === 0 && styles.disabledButton
                  ]}
                  onPress={handleSubmitSelection}
                  disabled={selectedClothes.length === 0}
                >
                  <LinearGradient
                    colors={['#A855F7', '#EC4899']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                      styles.gradientButton,
                      selectedClothes.length === 0 && styles.disabledGradient
                    ]}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Text style={styles.submitButtonText}>Rate My Selection</Text>
                        <Ionicons name="star" size={18} color="#fff" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </MotiView>
          )}
        </>
      ) : (
        isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#A855F7" />
            <Text style={styles.loadingText}>Analyzing your selection...</Text>
          </View>
        ) : (
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 500 }}
            style={styles.ratingContainer}
          >
            <BlurView intensity={30} tint="dark" style={styles.blurContainer}>
              <View style={styles.ratingHeader}>
                <Text style={styles.ratingTitle}>AI Rating</Text>
                <View style={styles.ratingValueContainer}>
                  <Text style={styles.ratingValue}>{aiRating}</Text>
                  <Text style={styles.ratingMax}>/5</Text>
                </View>
              </View>
              <View style={styles.ratingStars}>
                {[...Array(5)].map((_, i) => (
                  <Ionicons
                    key={i}
                    name={i < (aiRating || 0) ? "star" : "star-outline"}
                    size={24}
                    color={i < (aiRating || 0) ? "#FFC107" : "rgba(255, 255, 255, 0.3)"}
                  />
                ))}
              </View>
              <Text style={styles.ratingText}>{aiReview}</Text>

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setStep(1)}
              >
                <Ionicons name="arrow-back-outline" size={22} color="#fff" />
                <Text style={styles.backButtonText}>Select Different Items</Text>
              </TouchableOpacity>
            </BlurView>
          </MotiView>
        )
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <LinearGradient
        colors={['rgba(10, 10, 14, 0.98)', 'rgba(18, 18, 22, 0.97)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView
          key={refreshKey}
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          <MotiView
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500 }}
            style={styles.header}
          >
            <Text style={styles.title}>Rate Your Outfit</Text>
            <Text style={styles.subtitle}>Get AI-powered fashion feedback</Text>
          </MotiView>

          {!selectedOption ? (
            <MotiView
              from={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 500, delay: 200 }}
              style={styles.optionsContainer}
            >
              <TouchableOpacity
                style={styles.optionCard}
                onPress={() => setSelectedOption('current')}
                activeOpacity={0.8}
              >
                <BlurView intensity={20} tint="dark" style={styles.optionBlur}>
                  <LinearGradient
                    colors={['rgba(168, 85, 247, 0.6)', 'rgba(236, 72, 153, 0.6)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.optionGradient}
                  >
                    <Ionicons name="camera-outline" size={36} color="#fff" />
                    <Text style={styles.optionTitle}>Rate Current Outfit</Text>
                    <Text style={styles.optionDescription}>Upload a photo of what you're wearing</Text>
                  </LinearGradient>
                </BlurView>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionCard}
                onPress={() => setSelectedOption('wardrobe')}
                activeOpacity={0.8}
              >
                <BlurView intensity={20} tint="dark" style={styles.optionBlur}>
                  <LinearGradient
                    colors={['rgba(168, 85, 247, 0.6)', 'rgba(236, 72, 153, 0.6)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.optionGradient}
                  >
                    <Ionicons name="shirt-outline" size={36} color="#fff" />
                    <Text style={styles.optionTitle}>Select from Wardrobe</Text>
                    <Text style={styles.optionDescription}>Create an outfit from your digital closet</Text>
                  </LinearGradient>
                </BlurView>
              </TouchableOpacity>
            </MotiView>
          ) : (
            <View style={styles.contentWrapper}>
              <MotiView
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ type: 'timing', duration: 300 }}
                style={styles.backNav}
              >
                <TouchableOpacity
                  onPress={() => {
                    setSelectedOption(null);
                    setCurrentImage(null);
                    setAiRating(null);
                    setAiReview('');
                    setStep(1);
                  }}
                  style={styles.backNavButton}
                >
                  <Ionicons name="arrow-back" size={24} color="rgba(255, 255, 255, 0.8)" />
                  <Text style={styles.backNavText}>Back to options</Text>
                </TouchableOpacity>
              </MotiView>

              {selectedOption === 'current' ? renderCurrentOutfitUpload() : renderWardrobeSelection()}
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0A0E',
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 8,
  },
  optionsContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  optionCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  optionBlur: {
    overflow: 'hidden',
    borderRadius: 16,
  },
  optionGradient: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: 'rgba(30, 30, 40, 0.5)',
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  contentWrapper: {
    paddingHorizontal: 20,
  },
  backNav: {
    marginBottom: 20,
  },
  backNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backNavText: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 8,
    fontSize: 16,
  },
  contentContainer: {
    flex: 1,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 20,
  },
  uploadContainer: {
    borderRadius: 16,
    backgroundColor: 'rgba(30, 30, 40, 0.5)',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
    position: 'relative',
  },
  uploadContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  imageContainer: {
    padding: 0,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  removeImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 4,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    overflow: 'hidden',
  },
  blurContainer: {
    padding: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(30, 30, 40, 0.3)',
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
  },
  ratingContainer: {
    marginVertical: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  ratingValueContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  ratingValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#A855F7',
  },
  ratingMax: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
    marginLeft: 2,
  },
  ratingStars: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  ratingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 24,
  },
  wardrobeContainer: {
    flex: 1,
  },
  categoryScroll: {
    flex: 1,
    marginBottom: 16,
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  emptyCategory: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontStyle: 'italic',
    paddingHorizontal: 4,
  },
  itemsScroll: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  itemContainer: {
    width: 120,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(30, 30, 40, 0.5)',
  },
  selectedItem: {
    borderColor: '#A855F7',
    borderWidth: 2,
  },
  itemImage: {
    width: '100%',
    height: 120,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 2,
  },
  itemName: {
    color: '#fff',
    fontSize: 14,
    padding: 8,
    textAlign: 'center',
  },
  buttonContainer: {
    marginVertical: 16,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledGradient: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  backButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 15,
  },
});

export default RateOutfit;
