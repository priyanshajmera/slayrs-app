import { View, Text, StyleSheet, TouchableOpacity, ScrollView, PanResponder, Animated, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useState, useEffect, useRef } from 'react';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 40;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.5;

const features = [
  {
    icon: 'cloud-upload-outline' as const,
    title: "Digital Wardrobe",
    description: "Upload your clothing items and create a personalized digital wardrobe.",
    color: "purple",
    heading: "Digitize Your Wardrobe",
    subheading: "Transform your physical closet into a smart digital collection"
  },
  {
    icon: 'color-palette-outline' as const,
    title: "Style Analysis",
    description: "Get personalized style recommendations based on your preferences and wardrobe.",
    color: "pink",
    heading: "Discover Your Style",
    subheading: "Let AI analyze and enhance your personal fashion sense"
  },
  {
    icon: 'color-wand-outline' as const,
    title: "AI Outfit Generation",
    description: "Let our AI create perfect outfit combinations for any occasion.",
    color: "purple",
    heading: "Perfect Outfits Await",
    subheading: "Ready to revolutionize your style with AI?"
  }
];

export default function Home() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInteracting, setUserInteracting] = useState(false);
  const swipeAnim = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const autoSwipeTimer = useRef<NodeJS.Timeout | null>(null);

  // Function to handle card transitions (used by both manual and auto swipes)
  const transitionToNextCard = (nextIndex: number, direction: number = 1) => {
    // Animate the current card off-screen
    Animated.timing(swipeAnim, {
      toValue: -direction * SCREEN_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setCurrentIndex(nextIndex);
    });
  };

  // Auto-swipe functionality
  const startAutoSwipe = () => {
    // Clear any existing timer
    if (autoSwipeTimer.current) {
      clearInterval(autoSwipeTimer.current);
    }

    // Set up a new timer
    autoSwipeTimer.current = setInterval(() => {
      if (!userInteracting) {
        // Check if we're at the last card
        if (currentIndex === features.length - 1) {
          // Stop auto-swipe at the last card
          if (autoSwipeTimer.current) {
            clearInterval(autoSwipeTimer.current);
            autoSwipeTimer.current = null;
          }
        } else {
          // Not at the last card, proceed to next
          const nextIndex = currentIndex + 1;
          transitionToNextCard(nextIndex);
        }
      }
    }, 2000); // Auto-swipe every 2 seconds
  };

  // Add a function to restart auto-swipe when manually going back from last card
  const handleManualSwipe = (newIndex: number, direction: number) => {
    // Use the same transition for manual swipes as auto-swipes
    transitionToNextCard(newIndex, direction);
    
    // Resume auto-swipe after manual swipe completes
    setTimeout(() => {
      setUserInteracting(false);
      
      // If we were at the last card and manually went back, restart auto-swipe
      if (currentIndex === features.length - 1 && newIndex < currentIndex) {
        startAutoSwipe();
      }
    }, 500);
  };

  // Start auto-swipe when component mounts
  useEffect(() => {
    startAutoSwipe();
    
    // Clean up timer when component unmounts
    return () => {
      if (autoSwipeTimer.current) {
        clearInterval(autoSwipeTimer.current);
      }
    };
  }, [currentIndex, userInteracting]);

  // Reset animation when currentIndex changes
  useEffect(() => {
    swipeAnim.setValue(0);
    scale.setValue(1);
    opacity.setValue(1);
  }, [currentIndex]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      // User started interacting, pause auto-swipe
      setUserInteracting(true);
    },
    onPanResponderMove: (event, gesture) => {
      // Move card based on gesture
      swipeAnim.setValue(gesture.dx);
      
      // Scale down slightly as card moves away
      const scaleValue = Math.max(0.95, 1 - Math.abs(gesture.dx) / (SCREEN_WIDTH * 2));
      scale.setValue(scaleValue);
      
      // Reduce opacity as card moves away
      const opacityValue = Math.max(0.8, 1 - Math.abs(gesture.dx) / (SCREEN_WIDTH * 1.5));
      opacity.setValue(opacityValue);
    },
    onPanResponderRelease: (event, gesture) => {
      if (Math.abs(gesture.dx) > CARD_WIDTH * 0.25) { // Reduced threshold for easier swipe
        // User swiped far enough
        const direction = gesture.dx > 0 ? -1 : 1; // -1 for right (previous), 1 for left (next)
        let newIndex = currentIndex + direction;
        
        // Handle circular navigation
        if (newIndex < 0) newIndex = features.length - 1;
        if (newIndex >= features.length) newIndex = 0;
        
        // Use our new handler for consistent treatment of manual swipes
        handleManualSwipe(newIndex, direction);
      } else {
        // Not swiped far enough, spring back to center
        Animated.parallel([
          Animated.spring(swipeAnim, {
            toValue: 0,
            tension: 40, // Increased for snappier return
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.spring(scale, {
            toValue: 1,
            tension: 40,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.spring(opacity, {
            toValue: 1,
            tension: 40,
            friction: 7,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Resume auto-swipe after animation completes
          setTimeout(() => setUserInteracting(false), 300);
        });
      }
    },
  });

  const renderFeatureCard = (feature, index) => {
    if (index !== currentIndex) return null;
    
    return (
      <Animated.View
        key={index}
        style={[
          styles.carouselContainer,
          {
            transform: [
              { translateX: swipeAnim },
              { scale: scale }
            ],
            opacity: opacity
          }
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.featureCard}>
          <View style={styles.iconContainer}>
            <Ionicons name={feature.icon} size={32} color="#B666D2" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.featureHeading}>{feature.heading}</Text>
            <Text style={styles.featureSubheading}>{feature.subheading}</Text>
            <Text style={styles.featureDescription}>{feature.description}</Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(0, 0, 0, 0.9)', 'rgba(18, 18, 18, 0.95)']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/noBgColor.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </View>

        <View style={styles.carouselWrapper}>
          {features.map((feature, index) => (
            renderFeatureCard(feature, index)
          ))}
        </View>

        <View style={styles.dotsContainer}>
          {features.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex ? { backgroundColor: '#B666D2', width: 16 } : {}
              ]}
            />
          ))}
        </View>

        <View style={styles.bottomContainer}>
          {currentIndex === features.length - 1 && (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ 
                type: 'spring',
                delay: 300,
              }}
            >
              <TouchableOpacity
                style={styles.getStartedButton}
                onPress={() => router.push('/login')}
              >
                <LinearGradient
                  colors={['#A855F7', '#EC4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.getStartedGradient}
                >
                  <Text style={styles.getStartedText}>Begin Your Style Journey</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </MotiView>
          )}
        </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 150,
    height: 50,
  },
  logo: {
    fontSize: 28,
    color: '#B666D2',
    fontWeight: 'bold',
    letterSpacing: 0.6,
  },
  menuButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  carouselWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 24,
  },
  carouselContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    transform: [{ scale: 1 }],
  },
  featureCard: {
    backgroundColor: 'rgba(15, 15, 20, 0.98)',
    borderRadius: 24,
    padding: 28,
    width: CARD_WIDTH,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: 'rgba(182, 102, 210, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(182, 102, 210, 0.2)',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  featureHeading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.6,
  },
  featureSubheading: {
    fontSize: 17,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.3,
    lineHeight: 24,
  },
  featureDescription: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    width: '100%',
    marginTop: 24,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    height: 90,
  },
  getStartedButton: {
    borderRadius: 16,
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
  getStartedGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    height: '100%',
    width: '100%',
    gap: 10,
  },
  getStartedText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});