import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import api from '../../utils/api';
import { GenerateFormData, OutfitItem } from '../../types';
import { MotiView } from 'moti';
import TypeWriter from 'react-native-typewriter';

type Parameter = {
  id: keyof GenerateFormData;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  options: string[];
};

const parameters: Parameter[] = [
  {
    id: 'occasion',
    label: 'Occasion',
    icon: 'calendar-outline',
    options: ['Casual', 'Work', 'Party'],
  },
  {
    id: 'weather',
    label: 'Weather',
    icon: 'partly-sunny-outline',
    options: ['Hot', 'Rainy', 'Cold'],
  },
  {
    id: 'style',
    label: 'Style',
    icon: 'shirt-outline',
    options: ['Classic', 'Minimalistic', 'Trendy'],
  },
  {
    id: 'timeOfDay',
    label: 'Time of Day',
    icon: 'time-outline',
    options: ['Day', 'Night'],
  },
  {
    id: 'layering',
    label: 'Layering',
    icon: 'layers-outline',
    options: ['Yes', 'No'],
  },
];

interface OutfitOption {
  option: string;
  items: OutfitItem[];
}

export default function Generate() {
  const router = useRouter();
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [formData, setFormData] = useState<GenerateFormData>({
    occasion: '',
    weather: '',
    style: '',
    timeOfDay: '',
    layering: false,
    description: '',
    fit: '',
  });
  const [outfits, setOutfits] = useState<OutfitOption[]>([]);
  const [currentOutfit, setCurrentOutfit] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [styleDescription, setStyleDescription] = useState('');
  const [showStyleDescription, setShowStyleDescription] = useState(false);

  useEffect(() => {
    // Add focus listener to refresh content
    const unsubscribe = navigation.addListener('focus', () => {
      setRefreshKey(prev => prev + 1);
      // Reset form or fetch any necessary data here
      setFormData({
        occasion: '',
        style: '',
        weather: '',
        timeOfDay: '',
        layering: false,
        description: '',
        fit: '',
      });
      setOutfits([]);
      setError('');
    });

    return unsubscribe;
  }, [navigation]);

  const handleChange = (field: keyof GenerateFormData, value: string) => {
    if (field === 'layering') {
      setFormData(prev => ({
        ...prev,
        [field]: value === 'Yes',
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: prev[field] === value ? '' : value,
      }));
    }
  };

  const transformFormData = () => {
    return [
      { id: 0, category: 'Occasion', tag: formData.occasion },
      { id: 1, category: 'Weather', tag: formData.weather },
      { id: 3, category: 'Body Fit', tag: formData.fit },
      { id: 4, category: 'Time of Day', tag: formData.timeOfDay },
      { id: 5, category: 'Layering with other clothes?', tag: formData.layering ? 'Yes' : 'No' },
    ];
  };

  const handleGenerateOutfit = async () => {
    setCurrentOutfit(0);
    setShowStyleDescription(false);
    if (outfits.length) {
      setOutfits([]);
    }
    setLoading(true);
    setError('');

    // Scroll to generated section immediately when button is clicked
    scrollViewRef.current?.scrollToEnd({ animated: true });

    try {
      const requestPayload = transformFormData();
      const response = await api.post<Record<string, OutfitItem[]>>('/ootd', requestPayload);
      const responseData = response.data;
      const parsedOutfits = Object.keys(responseData).map((key) => ({
        option: key,
        items: responseData[key],
      }));
      setOutfits(parsedOutfits);
    } catch (err) {
      setError('Failed to fetch outfits');
    } finally {
      setLoading(false);
    }
  };

  const handleShowStyleDetails = () => {
    setShowStyleDescription(true);
    // Format suggestion text as bullet points
    const suggestionItem = outfits[currentOutfit]?.items.find(item => item.key === "suggestions");
    const suggestion = suggestionItem ? suggestionItem.suggestion : 
      "This outfit combines style and comfort perfectly. The colors complement each other well, and the silhouette is flattering. Consider accessorizing with minimal jewelry for a complete look.";
    
    // Process text into bullet points
    const formattedText = suggestion
      .split('.')
      .map(sentence => sentence.trim())
      .filter(sentence => sentence !== '')
      .map(sentence => `- ${sentence}`);
    
    setStyleDescription(formattedText.join('\n'));
    
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleNextOutfit = () => {
    setCurrentOutfit(Math.min(outfits.length - 1, currentOutfit + 1));
    setShowStyleDescription(false);
  };

  const handlePreviousOutfit = () => {
    setCurrentOutfit(Math.max(0, currentOutfit - 1));
    setShowStyleDescription(false);
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
          ref={scrollViewRef}
          key={refreshKey}
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.subtitle}> </Text>
              <Text style={styles.title}>Create Your Perfect Outfit</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.promptContainer}>
              <Text style={styles.promptTitle}>Describe Your Style</Text>
              <TextInput
                placeholder="e.g., Casual summer outfit for a beach day..."
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                style={styles.promptInput}
                multiline
                numberOfLines={4}
                value={formData.description}
                onChangeText={(value) => handleChange('description', value)}
              />
            </View>

            <Text style={styles.sectionTitle}>Outfit Parameters</Text>

            {parameters.map((param, paramIndex) => (
              <MotiView
                key={param.id}
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: 'timing', delay: 200 + paramIndex * 100 }}
              >
                <View style={styles.parameterSection}>
                  <Text style={styles.parameterLabel}>{param.label}</Text>
                  <View style={styles.optionsContainer}>
                    {param.options.map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={styles.optionButton}
                        onPress={() => handleChange(param.id, option)}
                      >
                        {param.id === 'layering' 
                          ? (
                            (formData.layering && option === 'Yes') || (!formData.layering && option === 'No') 
                            ? (
                              <LinearGradient
                                colors={['#A855F7', '#EC4899']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.optionGradient}
                              >
                                <View style={styles.optionContent}>
                                  <Ionicons
                                    name={param.icon}
                                    size={13}
                                    color="#ffffff"
                                    style={styles.optionIcon}
                                  />
                                  <Text style={styles.selectedOptionText}>
                                    {option}
                                  </Text>
                                </View>
                              </LinearGradient>
                            ) : (
                              <View style={styles.unselectedOption}>
                                <View style={styles.optionContent}>
                                  <Ionicons
                                    name={param.icon}
                                    size={13}
                                    color="rgba(255, 255, 255, 0.4)"
                                    style={styles.optionIcon}
                                  />
                                  <Text style={styles.optionText}>
                                    {option}
                                  </Text>
                                </View>
                              </View>
                            )
                          )
                          : formData[param.id] === option ? (
                          <LinearGradient
                            colors={['#A855F7', '#EC4899']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.optionGradient}
                          >
                            <View style={styles.optionContent}>
                              <Ionicons
                                name={param.icon}
                                size={13}
                                color="#ffffff"
                                style={styles.optionIcon}
                              />
                              <Text style={styles.selectedOptionText}>
                                {option}
                              </Text>
                            </View>
                          </LinearGradient>
                        ) : (
                          <View style={styles.unselectedOption}>
                            <View style={styles.optionContent}>
                              <Ionicons
                                name={param.icon}
                                size={13}
                                color="rgba(255, 255, 255, 0.4)"
                                style={styles.optionIcon}
                              />
                              <Text style={styles.optionText}>
                                {option}
                              </Text>
                            </View>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </MotiView>
            ))}

            <TouchableOpacity
              style={styles.generateButton}
              onPress={handleGenerateOutfit}
              disabled={loading}
            >
              <LinearGradient
                colors={['#A855F7', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <Ionicons name="refresh" size={24} color="#ffffff" style={styles.spinner} />
                    <Text style={styles.generateButtonText}>Generating...</Text>
                  </View>
                ) : (
                  <Text style={styles.generateButtonText}>Generate Outfit</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.generatedSection}>
            <Text style={styles.sectionTitle}>Generated Outfits</Text>
            {loading ? (
              <View style={styles.loadingPlaceholder}>
                <LinearGradient
                  colors={['rgba(168, 85, 247, 0.08)', 'rgba(236, 72, 153, 0.08)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.loadingGradient}
                >
                  <View style={styles.loadingContent}>
                    <Text style={styles.loadingText}>
                      Creating your perfect outfit
                    </Text>
                    <MotiView
                      from={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{
                        type: 'timing',
                        duration: 500,
                        loop: true,
                      }}
                    >
                      <Text style={styles.loadingDots}>...</Text>
                    </MotiView>
                  </View>
                </LinearGradient>
              </View>
            ) : error ? (
              <View style={styles.placeholder}>
                <Ionicons name="alert-circle-outline" size={48} color="rgba(255, 255, 255, 0.3)" />
                <Text style={styles.placeholderText}>{error}</Text>
              </View>
            ) : outfits.length > 0 ? (
              <View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {outfits[currentOutfit].items
                    .filter(item => item.clothId && item.clothId.image_url)
                    .map((item, index) => (
                      <View key={index} style={styles.outfitItem}>
                        <Image
                          source={{ uri: item.clothId.image_url }}
                          style={styles.outfitImage}
                        />
                      </View>
                    ))}
                </ScrollView>
                
                {showStyleDescription ? (
                  <View style={styles.styleDetailsContainer}>
                    <MotiView
                      from={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ type: 'timing', duration: 800 }}
                    >
                      {styleDescription.split('\n').map((line, index) => (
                        <MotiView
                          key={index}
                          from={{ opacity: 0, translateX: -10 }}
                          animate={{ opacity: 1, translateX: 0 }}
                          transition={{
                            type: 'timing',
                            duration: 500,
                            delay: index * 300, // Stagger the animations
                          }}
                          style={styles.bulletPointContainer}
                        >
                          <Text style={styles.styleDetailsText}>{line}</Text>
                        </MotiView>
                      ))}
                    </MotiView>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.tryOnButton}
                    onPress={handleShowStyleDetails}
                  >
                    <LinearGradient
                      colors={['#A855F7', '#EC4899']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.buttonGradient}
                    >
                      <Text style={styles.tryOnButtonText}>Show Style Details</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
                 <TouchableOpacity
                  style={styles.tryOnButton}
                  onPress={() => router.navigate('/ootd' as never, { outfit: outfits[currentOutfit].items } as never)}
                >
                  <LinearGradient
                    colors={['#A855F7', '#EC4899']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.tryOnButtonText}>Virtual Try On</Text>
                  </LinearGradient>
                </TouchableOpacity>
                
                <View style={styles.navigationButtons}>
                  <TouchableOpacity
                    onPress={handlePreviousOutfit}
                    disabled={currentOutfit === 0}
                    style={[styles.navButton, currentOutfit === 0 && styles.disabledButton]}
                  >
                    <Text style={styles.navButtonText}>Previous</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleNextOutfit}
                    disabled={currentOutfit === outfits.length - 1}
                    style={[styles.navButton, currentOutfit === outfits.length - 1 && styles.disabledButton]}
                  >
                    <Text style={styles.navButtonText}>Next</Text>
                  </TouchableOpacity>
                </View>
               
              </View>
            ) : (
              <View style={styles.placeholder}>
                <Ionicons name="shirt-outline" size={48} color="rgba(255, 255, 255, 0.3)" />
                <Text style={styles.placeholderText}>
                  Your perfect outfit will appear here! Let the magic happen! ✨
                </Text>
              </View>
            )}
          </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
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
  card: {
    backgroundColor: 'rgba(15, 15, 20, 0.95)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
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
  promptContainer: {
    marginBottom: 24,
  },
  promptTitle: {
    fontSize: 17,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.1,
  },
  promptInput: {
    backgroundColor: 'rgba(10, 10, 15, 0.7)',
    borderRadius: 16,
    padding: 18,
    color: '#ffffff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    textAlignVertical: 'top',
    minHeight: 120,
    letterSpacing: 0.2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
    letterSpacing: 0.1,
  },
  parameterSection: {
    marginBottom: 20,
  },
  parameterLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 15,
    marginBottom: 12,
    letterSpacing: 0.1,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  optionButton: {
    borderRadius: 24,
    overflow: 'hidden',
    minWidth: 120,
    flex: 1,
    height: 42,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    margin: 2,
  },
  unselectedOption: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(10, 10, 15, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
  },
  optionGradient: {
    width: '100%',
    height: '100%',
    padding: 0,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    height: '100%',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  optionText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.1,
    textAlign: 'center',
  },
  selectedOptionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.1,
    textAlign: 'center',
  },
  generateButton: {
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    overflow: 'hidden',
    shadowColor: 'rgba(168, 85, 247, 0.5)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    height: 48,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  spinner: {
    transform: [{ rotate: '0deg' }],
  },
  generateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  generatedSection: {
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 20,
  },
  placeholderText: {
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    fontSize: 15,
    letterSpacing: 0.1,
    paddingHorizontal: 20,
  },
  outfitItem: {
    width: 150,
    height: 150,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  outfitImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  navButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  navButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  tryOnButton: {
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    overflow: 'hidden',
    shadowColor: 'rgba(168, 85, 247, 0.5)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    height: 48,
  },
  tryOnButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIcon: {
    width: 13,
    height: 13,
    textAlign: 'center',
  },
  loadingPlaceholder: {
    height: 300,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 15, 20, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 16,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  loadingDots: {
    color: '#B666D2',
    fontSize: 20,
    fontWeight: '600',
  },
  styleDetailsContainer: {
    backgroundColor: 'rgba(20, 20, 25, 0.9)',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  styleDetailsText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0.3,
  },
  bulletPointContainer: {
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
});
