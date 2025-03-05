import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import { MotiView, MotiText } from 'moti';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const features = [
  {
    title: 'Add to Wardrobe',
    description: 'Add your outfits effortlessly and digitize your wardrobe with just a few clicks.',
    icon: 'cloud-upload-outline' as const,
    link: '/upload',
  },
  {
    title: 'My Wardrobe',
    description: 'Browse and manage your wardrobe by categories.',
    icon: 'shirt-outline' as const,
    link: '/(tabs)/wardrobe',
  },
  {
    title: 'Generate Outfit',
    description: 'Create perfect outfit combinations with AI',
    icon: 'color-wand-outline' as const,
    link: '/(tabs)/generate',
  },
  {
    title: 'Rate Outfit',
    description: 'Rate your outfits and get recommendations',
    icon: 'star-outline' as const,
    link: '/(tabs)/rateOutfit',
  },
    {
      title: 'Favorite Outfits',
      description: 'Your saved outfits and combinations',
      icon: 'heart-outline' as const,
      link: '/(tabs)/favorites',
    },
];

export default function Home() {
  const router = useRouter();
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchUsername();

    // Add focus listener to refresh content
    const unsubscribe = navigation.addListener('focus', () => {
      setRefreshKey(prev => prev + 1);
      fetchUsername();
    });

    return unsubscribe;
  }, [navigation]);

  const fetchUsername = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const { username } = JSON.parse(userData);
        setUsername(username);
      }
    } catch (error) {
      console.error('Error fetching username:', error);
    }
  };

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
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
          {/* Header with left-to-right animation */}
          <MotiView
            style={styles.header}
            from={{ opacity: 0, translateX: -30 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ 
              type: 'timing', 
              duration: 800, 
              delay: 100,
            }}
          >
            <View>
              <MotiText
                style={styles.subtitle}
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ type: 'timing', duration: 800, delay: 300 }}
              >
                Good {getGreeting()}
              </MotiText>
              
              <View style={styles.greetingContainer}>
                <MotiText
                  style={styles.greeting}
                  from={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ type: 'timing', duration: 800, delay: 400 }}
                >
                  Hello,{' '}
                </MotiText>
                <MotiText
                  style={[styles.greeting, styles.username]}
                  from={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ type: 'timing', duration: 800, delay: 600 }}
                >
                  {username || 'User'}
                </MotiText>
              </View>
            </View>
          </MotiView>

          {/* Menu items with staggered left-to-right animation */}
          <MotiView 
            style={styles.menuContainer}
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 500, delay: 300 }}
          >
            {features.map((feature, index) => (
              <MotiView
                key={feature.title}
                from={{ opacity: 0, translateX: -50 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ 
                  type: 'spring', 
                  delay: 800 + index * 150,
                  damping: 20,
                  stiffness: 120,
                }}
              >
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => router.push(feature.link)}
                >
                  <View style={styles.iconContainer}>
                    <Ionicons name={feature.icon} size={24} color="#B666D2" />
                  </View>
                  <View style={styles.menuTextContainer}>
                    <Text style={styles.menuTitle}>{feature.title}</Text>
                    <Text style={styles.menuDescription}>{feature.description}</Text>
                    <View style={styles.exploreContainer}>
                      <Text style={styles.exploreText}>Explore</Text>
                      <Ionicons name="arrow-forward" size={16} color="#B666D2" />
                    </View>
                  </View>
                </TouchableOpacity>
              </MotiView>
            ))}
          </MotiView>
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
    padding: 24,
    paddingTop: 16,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 32,
    paddingHorizontal: 4,
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  greeting: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  spaceChar: {
    fontSize: 32,
    width: 10, // Space width
  },
  username: {
    color: '#B666D2',
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '400',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  menuContainer: {
    gap: 20,
    paddingTop: 16,
  },
  menuItem: {
    backgroundColor: 'rgba(18, 18, 22, 0.95)',
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    flexDirection: 'row',
    gap: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(182, 102, 210, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(182, 102, 210, 0.2)',
  },
  menuTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  menuTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  menuDescription: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  exploreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  exploreText: {
    color: '#B666D2',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  cursor: {
    color: '#B666D2',
    fontWeight: '600',
  },
}); 