import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, TextInput, Platform, ActivityIndicator, ActionSheetIOS, Alert } from 'react-native';
import { Upload as UploadIcon, Tag, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useNavigation } from 'expo-router';
import { Category, UploadFormData } from '../../types';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import api from '@/utils/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';

const categories: Category[] = [
  { name: 'Tops', subcategories: ['T-Shirts', 'Shirts', 'Sweaters'] },
  { name: 'Bottoms', subcategories: ['Jeans', 'Shorts', 'Skirts'] },
  { name: 'Dresses', subcategories: ['Casual', 'Formal', 'Party'] },
  { name: 'Shoes', subcategories: ['Sneakers', 'Boots', 'Heels'] },
  { name: 'Accessories', subcategories: ['Bags', 'Jewelry', 'Hats'] },
];

export default function Upload() {
  const router = useRouter();
  const navigation = useNavigation();
  const [refreshKey, setRefreshKey] = useState(0);
  const [formData, setFormData] = useState<UploadFormData>({
    image: null,
    category: '',
    subcategory: '',
    itemName: ''
  });
  const [uploading, setUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState('initial');
  const [fadeAnim, setFadeAnim] = useState(true);
  const bannerMessage = useRef('');

  useEffect(() => {
    // Add focus listener to refresh content
    const unsubscribe = navigation.addListener('focus', () => {
      setRefreshKey(prev => prev + 1);
      // Reset all state
      setFormData({
        image: null,
        category: '',
        subcategory: '',
        itemName: ''
      });
      setUploading(false);
      setUploadStage('initial');
      setFadeAnim(true);
      bannerMessage.current = '';
    });

    return unsubscribe;
  }, [navigation]);

  // Handle animation when message changes
  useEffect(() => {
    if (uploadStage !== 'initial') {
      // Fade out
      setFadeAnim(false);
      const timer = setTimeout(() => {
        // Set new message and fade in
        bannerMessage.current = getBannerMessage();
        setFadeAnim(true);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [uploadStage]);

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

  const pickImage = async () => {
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
        setFormData((prev: UploadFormData) => ({ ...prev, image: result.assets[0].uri }));
      }
    } catch (error) {
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
        setFormData((prev: UploadFormData) => ({ ...prev, image: result.assets[0].uri }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleUpload = async () => {
    const { image, category, subcategory, itemName } = formData;
    if (!image || !category || !subcategory || !itemName) {
      alert('Please fill in all fields');
      return;
    }

    setUploading(true);
    setUploadStage('uploading');

    try {
      // Create form data
      const formDataToSend = new FormData();
      formDataToSend.append('category', category);
      formDataToSend.append('subcategory', subcategory);
      formDataToSend.append('tags', itemName);

      // Handle image upload based on platform
      if (Platform.OS === 'web') {
        // For web, we need to fetch the image and convert it to a blob
        const response = await fetch(image);
        const blob = await response.blob();
        const filename = 'upload.jpg';

        formDataToSend.append('image', blob, filename);
      } else {
        // For native platforms (iOS/Android)
        const filename = image.split('/').pop() || 'upload.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formDataToSend.append('image', {
          uri: Platform.OS === 'ios' ? image.replace('file://', '') : image,
          name: filename,
          type,
        } as any);
      }

      // Simulate different stages of processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      setUploadStage('analyzing');
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      setUploadStage('generating');

      console.log('Uploading with form data:', formDataToSend);

      const response = await api.post('/outfits/upload', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Accept: 'application/json',
        },
      });

      if (response.status === 201) {
        setUploadStage('completed');
        await new Promise(resolve => setTimeout(resolve, 1000));
        alert('Upload successful!');
        router.push('/(tabs)/wardrobe');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStage('error');
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Failed to upload. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Loading banner messages based on stage
  const getBannerMessage = () => {
    switch (uploadStage) {
      case 'uploading':
        return 'Uploading file...';
      case 'analyzing':
        return 'Analyzing image...';
      case 'generating':
        return 'Generating description...';
      case 'completed':
        return 'Upload complete!';
      case 'error':
        return 'Upload failed';
      default:
        return '';
    }
  };

  // Initialize banner message on first render
  if (bannerMessage.current === '' && uploadStage !== 'initial') {
    bannerMessage.current = getBannerMessage();
  }

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
          <Text style={styles.title}>Upload Item</Text>

          <View style={styles.formContainer}>
            <MotiView
              from={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 500, delay: 100 }}
            >
              <TouchableOpacity onPress={pickImage} style={styles.uploadCard}>
                {formData.image ? (
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: formData.image }}
                      style={styles.image}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      onPress={() => setFormData((prev: UploadFormData) => ({ ...prev, image: null }))}
                      style={styles.removeButton}
                    >
                      <X size={20} color="white" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <UploadIcon size={32} color="white" />
                    <Text style={styles.uploadText}>Upload Photo</Text>
                    <Text style={styles.uploadSubtext}>Select a clear, well-lit photo of your item</Text>
                  </>
                )}
              </TouchableOpacity>
            </MotiView>

            {/* Item Details */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500, delay: 200 }}
            >
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Item Name</Text>
                <TextInput
                  value={formData.itemName}
                  onChangeText={(text: string) => setFormData((prev: UploadFormData) => ({ ...prev, itemName: text }))}
                  placeholder="Enter item name"
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  style={styles.input}
                />
              </View>
            </MotiView>

            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500, delay: 300 }}
            >
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Category</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.chipScrollView}
                  contentContainerStyle={styles.chipContainer}
                >
                  {categories.map((cat, index) => (
                    <MotiView
                      key={cat.name}
                      from={{ opacity: 0, translateX: -20 }}
                      animate={{ opacity: 1, translateX: 0 }}
                      transition={{ type: 'timing', delay: 400 + index * 100 }}
                    >
                      <TouchableOpacity
                        onPress={() => {
                          setFormData((prev: UploadFormData) => ({
                            ...prev,
                            category: cat.name,
                            subcategory: ''
                          }));
                        }}
                        style={styles.chip}
                      >
                        {formData.category === cat.name ? (
                          <LinearGradient
                            colors={['#A855F7', '#EC4899']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.chipGradient}
                          >
                            <Text style={styles.chipSelectedText}>{cat.name}</Text>
                          </LinearGradient>
                        ) : (
                          <View style={styles.unselectedChip}>
                            <Text style={styles.chipText}>{cat.name}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    </MotiView>
                  ))}
                </ScrollView>
              </View>
            </MotiView>

            {formData.category && (
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 500, delay: 400 }}
              >
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Subcategory</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.chipScrollView}
                    contentContainerStyle={styles.chipContainer}
                  >
                    {categories
                      .find(cat => cat.name === formData.category)
                      ?.subcategories.map((sub: string, index) => (
                        <MotiView
                          key={sub}
                          from={{ opacity: 0, translateX: -20 }}
                          animate={{ opacity: 1, translateX: 0 }}
                          transition={{ type: 'timing', delay: 500 + index * 100 }}
                        >
                          <TouchableOpacity
                            onPress={() => setFormData((prev: UploadFormData) => ({ ...prev, subcategory: sub }))}
                            style={styles.chip}
                          >
                            {formData.subcategory === sub ? (
                              <LinearGradient
                                colors={['#A855F7', '#EC4899']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.chipGradient}
                              >
                                <Text style={styles.chipSelectedText}>{sub}</Text>
                              </LinearGradient>
                            ) : (
                              <View style={styles.unselectedChip}>
                                <Text style={styles.chipText}>{sub}</Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        </MotiView>
                      ))}
                  </ScrollView>
                </View>
              </MotiView>
            )}

            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500, delay: 500 }}
            >
              <TouchableOpacity
                onPress={handleUpload}
                disabled={uploading}
                style={[styles.button, uploading && styles.buttonDisabled]}
              >
                <LinearGradient
                  colors={uploading ? ['rgba(168, 85, 247, 0.5)', 'rgba(236, 72, 153, 0.5)'] : ['#A855F7', '#EC4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>
                    {uploading ? 'Uploading...' : 'Upload Item'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </MotiView>
          </View>
        </ScrollView>
        
        {/* Loading Banner */}
        {uploading && (
          <MotiView
            from={{ opacity: 0, translateY: 50 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 300 }}
            style={styles.loadingBannerContainer}
          >
            <LinearGradient
              colors={['#A855F7', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loadingBanner}
            >
              <View style={styles.loadingContent}>
                <ActivityIndicator size="small" color="#ffffff" />
                <MotiView
                  animate={{ opacity: fadeAnim ? 1 : 0 }}
                  transition={{ type: 'timing', duration: 300 }}
                  style={styles.textContainer}
                >
                  <Text style={styles.loadingText}>{bannerMessage.current}</Text>
                </MotiView>
              </View>
            </LinearGradient>
          </MotiView>
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
    backgroundColor: 'rgba(0, 0, 0, 0.97)', // Darker for luxury
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 24, // More padding
    paddingBottom: 120,
  },
  title: {
    fontSize: 32, // Larger
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 28, // More space
    letterSpacing: 0.5, // Add letter spacing
  },
  uploadCard: {
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
    padding: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.32,
    shadowRadius: 5.46,
    elevation: 9,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16, // Larger radius
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)', // More visible
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 12, // More space
    right: 12, // More space
    backgroundColor: '#EF4444',
    borderRadius: 24, // Larger radius
    padding: 12, // More padding
    shadowColor: 'rgba(239, 68, 68, 0.5)', // Colored shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  uploadText: {
    color: 'white',
    marginTop: 20, // More space
    fontSize: 20, // Larger
    fontWeight: '600',
    letterSpacing: 0.3, // Add letter spacing
  },
  uploadSubtext: {
    color: 'rgba(255, 255, 255, 0.7)', // Brighter
    marginTop: 12, // More space
    textAlign: 'center',
    fontSize: 15, // Larger
    letterSpacing: 0.2, // Add letter spacing
  },
  formContainer: {
    gap: 28, // More space
  },
  inputGroup: {
    gap: 10, // More space
  },
  label: {
    color: 'rgba(255, 255, 255, 0.8)', // Brighter
    fontSize: 17, // Larger
    fontWeight: '500',
    letterSpacing: 0.2, // Add letter spacing
    marginBottom: 4, // Add space
  },
  input: {
    backgroundColor: 'rgba(15, 15, 20, 0.95)', // Darker
    color: 'white',
    paddingHorizontal: 18, // More padding
    paddingVertical: 14, // More padding
    borderRadius: 16, // Larger radius
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)', // More visible
    fontSize: 16, // Larger
    letterSpacing: 0.2, // Add letter spacing
  },
  chipScrollView: {
    flexDirection: 'row',
    marginTop: 8,
  },
  chipContainer: {
    gap: 10,
    paddingBottom: 4, // Add slight padding to prevent any clipping
  },
  chip: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    minWidth: 90,
    height: 44,  // Fixed height for all states
  },
  unselectedChip: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(15, 15, 20, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,  // Match the parent chip style
  },
  chipGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    letterSpacing: 0.2,
    fontWeight: '500',
    textAlign: 'center',
  },
  chipSelectedText: {
    color: 'white',
    fontSize: 14,
    letterSpacing: 0.2,
    fontWeight: '600',
    textAlign: 'center',
  },
  button: {
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 36,
    shadowColor: 'rgba(168, 85, 247, 0.5)',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 12,
    height: 52,  // Fixed height
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  loadingBannerContainer: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    padding: 0,
    zIndex: 1000,
    shadowColor: 'rgba(0, 0, 0, 0.5)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingBanner: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});