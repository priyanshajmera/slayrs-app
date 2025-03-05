import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, TouchableOpacity, Text, StyleSheet, Animated, Image } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAuth } from '../context/AuthContext';

export default function TabLayout() {
  const [showMenu, setShowMenu] = useState(false);
  const menuAnimation = useRef(new Animated.Value(0)).current;
  const { logout } = useAuth();
  
  useEffect(() => {
    Animated.timing(menuAnimation, {
      toValue: showMenu ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [showMenu]);

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={['rgba(10, 10, 14, 0.98)', 'rgba(18, 18, 22, 0.97)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Tabs
          screenListeners={{
            focus: () => {
              // Force a re-render on tab focus
              const timestamp = new Date().getTime();
              return { timestamp };
            },
          }}
          screenOptions={{
            headerStyle: {
              backgroundColor: 'rgba(12, 12, 14, 0.96)',
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(255, 255, 255, 0.06)',
            },
            tabBarHideOnKeyboard: true,
            animation: 'fade',
            headerTitleStyle: {
              color: '#B666D2',
              fontSize: 28,
              fontWeight: '700',
              letterSpacing: 1,
              fontFamily: 'System',
            },
            headerTitleAlign: 'left',
            headerShadowVisible: false,
            headerTitle: () => (
              <View style={styles.headerTitleContainer}>
                <Image 
                  source={require('../../assets/noBgColor.png')} 
                  style={styles.headerLogo} 
                  resizeMode="contain"
                />
              </View>
            ),
            headerRight: () => (
              <View style={styles.headerContainer}>
                <TouchableOpacity 
                  onPress={() => setShowMenu(!showMenu)}
                  style={styles.headerButton}
                  activeOpacity={0.7}
                >
                  <View style={styles.profileButton}>
                    <Ionicons name="person-outline" size={20} color="#fff" />
                    <Animated.View style={{ 
                      transform: [{ 
                        rotate: menuAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '180deg']
                        }) 
                      }] 
                    }}>
                      <Ionicons name="chevron-down" size={16} color="#fff" />
                    </Animated.View>
                  </View>
                  {showMenu && (
                    <Animated.View 
                      style={[
                        styles.menuOverlay,
                        { 
                          opacity: menuAnimation,
                          transform: [{ 
                            translateY: menuAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [-10, 0]
                            }) 
                          }]
                        }
                      ]}
                    >
                      <BlurView intensity={40} tint="dark" style={styles.menuBlur}>
                        <Link href="/profile" asChild>
                          <TouchableOpacity 
                            style={styles.menuItem}
                            onPress={() => setShowMenu(false)}
                          >
                            <Ionicons name="person-circle-outline" size={22} color="#fff" />
                            <Text style={styles.menuText}>Profile</Text>
                          </TouchableOpacity>
                        </Link>
                        <View style={styles.menuDivider} />
                        <TouchableOpacity 
                          style={styles.menuItem}
                          onPress={async () => {
                            await logout();
                            setShowMenu(false);
                          }}
                        >
                          <Ionicons name="log-out-outline" size={22} color="#fff" />
                          <Text style={styles.menuText}>Logout</Text>
                        </TouchableOpacity>
                      </BlurView>
                    </Animated.View>
                  )}
                </TouchableOpacity>
              </View>
            ),
            tabBarStyle: {
              position: 'absolute',
              bottom: 0,
              left: 12,
              right: 12,
              height: 88,
              backgroundColor: 'rgba(15, 15, 20, 0.85)',
              borderTopWidth: 0,
              elevation: 0,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              borderRadius: 36,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.12)',
              paddingHorizontal: 10,
              marginBottom: 16,
              paddingBottom: 6,
              paddingTop: 6,
            },
            tabBarItemStyle: {
              height: 70,
              paddingTop: 12,
              paddingBottom: 8,
              justifyContent: 'center',
              alignItems: 'center',
            },
            tabBarActiveTintColor: '#B666D2',
            tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)',
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '600',
              position: 'relative',
              top: 4,
              opacity: 1,
            },
          }}
        >
          <Tabs.Screen
            name="home"
            options={{
              tabBarLabel: 'Home',
              tabBarIcon: ({ color, focused }) => (
                <View style={focused ? styles.activeTabBg : { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
                </View>
              ),
            }}
          />
          <Tabs.Screen
            name="wardrobe"
            options={{
              tabBarLabel: 'Wardrobe',
              tabBarIcon: ({ color, focused }) => (
                <View style={focused ? styles.activeTabBg : { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={focused ? "shirt-outline" : "shirt-outline"} size={24} color={color} />
                </View>
              ),
            }}
          />
          <Tabs.Screen
            name="upload"
            options={{
              tabBarLabel: 'Upload',
              tabBarIcon: ({ color }) => (
                <View style={styles.uploadButton}>
                  <LinearGradient
                    colors={['#A855F7', '#EC4899']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.uploadGradient}
                  >
                    <Ionicons name="cloud-upload-outline" size={26} color="#fff" />
                  </LinearGradient>
                </View>
              ),
            }}
          />
          <Tabs.Screen
            name="generate"
            options={{
              tabBarLabel: 'Generate',
              tabBarIcon: ({ color, focused }) => (
                <View style={focused ? styles.activeTabBg : { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={focused ? "color-wand" : "color-wand-outline"} size={24} color={color} />
                </View>
              ),
            }}
          />
          <Tabs.Screen
            name="favorites"
            options={{
              tabBarLabel: 'Favorites',
              tabBarIcon: ({ color, focused }) => (
                <View style={focused ? styles.activeTabBg : { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={focused ? "heart" : "heart-outline"} size={24} color={color} />
                </View>
              ),
            }}
          />
          <Tabs.Screen
            name="rateOutfit"
            options={{
              href: null,
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              headerTitle: () => (
                <View style={styles.headerTitleContainer}>
                  <Image 
                    source={require('../../assets/noBgColor.png')} 
                    style={styles.headerLogo} 
                    resizeMode="contain"
                  />
                </View>
              ),
              href: null,
              tabBarIcon: ({ color }) => (
                <View style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="person" size={22} color={color} />
                </View>
              ),
            }}
          />
        </Tabs>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    position: 'relative',
  },
  headerButton: {
    marginRight: 15,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(40, 40, 50, 0.7)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 24,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  menuOverlay: {
    position: 'absolute',
    top: 50,
    right: 0,
    borderRadius: 16,
    minWidth: 200,
    overflow: 'hidden',
    zIndex: 1000,
  },
  menuBlur: {
    padding: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(25, 25, 35, 0.6)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 14,
    borderRadius: 12,
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 8,
  },
  menuText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  gradient: {
    flex: 1,
  },
  activeTabBg: {
    backgroundColor: 'rgba(182, 102, 210, 0.15)',
    borderRadius: 16, 
    padding: 8,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButton: {
    marginBottom: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#B666D2',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'visible',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 120,
    height: 40,
  },
});