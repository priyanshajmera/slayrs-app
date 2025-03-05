import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';

interface SignInResponse {
  message: string;
  token: string;
  userDataToSend: {
    id: number;
    email: string;
    username: string;
    gender: string;
  };
}

export default function Login() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post<SignInResponse>('/signin', {
        email,
        password,
      });

      const { token, userDataToSend, message } = response.data;

      // Store the token
      await AsyncStorage.setItem('token', token);

      // Store user data
      await AsyncStorage.setItem('userData', JSON.stringify(userDataToSend));
      // Navigate to main app
      router.replace('/(tabs)/home');
    } catch (error: any) {
      const message = error.response?.data?.message || 'An error occurred during sign in';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
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

        <View style={styles.formContainer}>
          <View style={styles.card}>
            <Text style={styles.title}>Welcome Back</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  placeholder="Enter your email"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  style={styles.input}
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
                <Ionicons name="mail-outline" size={20} color="#B666D2" style={styles.selectIcon} />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputContainer, styles.select]}>
                <TextInput
                  placeholder="Enter your password"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  secureTextEntry={!showPassword}
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.selectIcon}>
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#B666D2"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.optionsContainer}>
            

              <Link href="/forgot-password" style={styles.forgotPassword}>
                Forgot Password?
              </Link>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.saveButton, isLoading && styles.disabledButton]}
                onPress={handleSignIn}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={['#A855F7', '#EC4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Sign In</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.replace('signup')}>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
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
    fontSize: 24,
    color: '#B666D2',
    fontWeight: 'bold',
  },
  menuButton: {
    padding: 4,
  },
  formContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: 'rgba(15, 15, 20, 0.95)',
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#B666D2',
    marginBottom: 28,
    letterSpacing: 0.8,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#ffffff',
    marginBottom: 8,
    fontSize: 16,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: 'rgba(10, 10, 15, 0.8)',
    borderRadius: 16,
    padding: 18,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    fontSize: 15,
    letterSpacing: 0.2,
  },
  select: {
    position: 'relative',
  },
  selectIcon: {
    position: 'absolute',
    right: 12,
    top: 14,
    zIndex: 1,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#B666D2',
    borderColor: '#B666D2',
  },
  checkboxLabel: {
    color: '#fff',
    fontSize: 14,
  },
  forgotPassword: {
    color: '#B666D2',
    fontSize: 14,
    fontWeight: '500',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  saveButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: 'rgba(168, 85, 247, 0.6)',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  buttonGradient: {
    width: '100%',
    padding: 18,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  signupLink: {
    color: '#B666D2',
    fontSize: 14,
    fontWeight: '500',
  },
  icon: {
    position: 'absolute',
    right: 12,
    top: 14,
    zIndex: 1,
  },
  disabledButton: {
    opacity: 0.7,
  },
});