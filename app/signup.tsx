import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, Platform, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SignupForm {
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;
  dateOfBirth: Date;
  gender: string;
}

const Signup = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<SignupForm>({
    fullName: '',
    email: '',
    password: '',
    phoneNumber: '',
    dateOfBirth: new Date(),
    gender: '',
  });

  const [dateString, setDateString] = useState('');

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({ ...prev, dateOfBirth: selectedDate }));
      
      // Format date to display
      const formattedDate = selectedDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      setDateString(formattedDate);
    }
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const handleSignup = async () => {
    // Validate form
    if (!formData.fullName || !formData.email || !formData.password || !dateString || !formData.gender) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!agreeToTerms) {
      Alert.alert('Error', 'Please agree to the Terms and Conditions');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/signup', {
        username: formData.fullName,
        email: formData.email,
        password: formData.password,
        phone: formData.phoneNumber,
        dob: formData.dateOfBirth.toISOString().split('T')[0],
        gender: formData.gender.toLowerCase(),
      });

      const { userId, message } = response.data;

      // Store the token
      if(response.status === 201) {
        Alert.alert('Success', message || 'Account created successfully!', [
          {
            text: 'OK',
            onPress: () => router.replace('/login')
          }
        ]);
      }
      
    } catch (error: any) {
      const message = error.response?.data?.message || 'An error occurred during sign up';
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

        <ScrollView style={styles.scrollView}>
          <View style={styles.contentContainer}>
            <View style={styles.card}>
              <Text style={styles.title}>Create Account</Text>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Full Name <Text style={styles.required}>*</Text></Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    placeholder="Enter your full name"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    style={styles.input}
                    value={formData.fullName}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, fullName: text }))}
                  />
                  <View style={styles.selectIcon}>
                    <Ionicons name="person-outline" size={20} color="#B666D2" />
                  </View>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Email <Text style={styles.required}>*</Text></Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    placeholder="Enter your email"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    style={styles.input}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={formData.email}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                  />
                  <View style={styles.selectIcon}>
                    <Ionicons name="mail-outline" size={20} color="#B666D2" />
                  </View>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Password <Text style={styles.required}>*</Text></Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    placeholder="Create a password"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    secureTextEntry={!showPassword}
                    style={styles.input}
                    value={formData.password}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
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

              <View style={styles.formGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    placeholder="Enter your phone number"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    style={styles.input}
                    keyboardType="phone-pad"
                    value={formData.phoneNumber}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, phoneNumber: text }))}
                  />
                  <View style={styles.selectIcon}>
                    <Ionicons name="call-outline" size={20} color="#B666D2" />
                  </View>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Date of Birth <Text style={styles.required}>*</Text></Text>
                <TouchableOpacity
                  style={styles.inputContainer}
                  onPress={showDatepicker}
                >
                  <Text style={[styles.input, !dateString && styles.placeholderText]}>
                    {dateString || 'Select your date of birth'}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="rgba(255,255,255,0.5)" style={styles.icon} />
                </TouchableOpacity>
              </View>

              {showDatePicker && (Platform.OS === 'android' ? (
                <DateTimePicker
                  testID="dateTimePicker"
                  value={formData.dateOfBirth}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                  maximumDate={new Date()}
                  minimumDate={new Date(1900, 0, 1)}
                />
              ) : (
                <View style={styles.datePickerContainer}>
                  <DateTimePicker
                    testID="dateTimePicker"
                    value={formData.dateOfBirth}
                    mode="date"
                    display="spinner"
                    onChange={onDateChange}
                    maximumDate={new Date()}
                    minimumDate={new Date(1900, 0, 1)}
                    textColor="#FFFFFF"
                    style={styles.datePickerIOS}
                  />
                  <View style={styles.datePickerButtons}>
                    <TouchableOpacity 
                      style={styles.datePickerButton} 
                      onPress={() => setShowDatePicker(false)}
                    >
                      <Text style={styles.datePickerButtonText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <View style={styles.rowContainer}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>Gender <Text style={styles.required}>*</Text></Text>
                  <TouchableOpacity
                    style={styles.inputContainer}
                    onPress={() => setShowGenderPicker(!showGenderPicker)}
                  >
                    <Text style={[styles.input, { paddingTop: 12 }]}>
                      {formData.gender || 'Select'}
                    </Text>
                    <View style={styles.selectIcon}>
                      <Ionicons name="chevron-down-outline" size={20} color="#B666D2" />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {showGenderPicker && (
                <View style={styles.genderPicker}>
                  {['Male', 'Female', 'Other'].map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={styles.genderOption}
                      onPress={() => {
                        setFormData(prev => ({ ...prev, gender: option }));
                        setShowGenderPicker(false);
                      }}
                    >
                      <Text style={[styles.genderOptionText, formData.gender === option && styles.genderOptionSelected]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={styles.termsContainer}>
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setAgreeToTerms(!agreeToTerms)}
                >
                  <View style={[styles.checkbox, agreeToTerms && styles.checkboxChecked]}>
                    {agreeToTerms && <Ionicons name="checkmark" size={12} color="white" />}
                  </View>
                </TouchableOpacity>
                <Text style={styles.termsText}>
                  I agree to the{' '}
                  <Text style={styles.termsLink}>Terms & Conditions</Text>
                  {' '}and{' '}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    (!formData.fullName || !formData.email || !formData.password || !dateString || !formData.gender || !agreeToTerms || isLoading) && styles.disabledButton
                  ]}
                  onPress={handleSignup}
                  disabled={!formData.fullName || !formData.email || !formData.password || !dateString || !formData.gender || !agreeToTerms || isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <LinearGradient
                      colors={['#A855F7', '#EC4899']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.buttonGradient}
                    >
                      <Text style={styles.saveButtonText}>Create Account</Text>
                    </LinearGradient>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/login')}>
                  <Text style={styles.loginLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

export default Signup;

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
    paddingHorizontal: 20,
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
    fontSize: 26,
    color: '#B666D2',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  menuButton: {
    padding: 6,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 120,
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
    marginBottom: 24,
  },
  label: {
    color: '#ffffff',
    marginBottom: 10,
    fontSize: 16,
    letterSpacing: 0.2,
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
  selectIcon: {
    position: 'absolute',
    right: 12,
    top: 14,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderPicker: {
    backgroundColor: 'rgba(18, 18, 18, 0.8)',
    borderRadius: 12,
    marginTop: -15,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  genderOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  genderOptionText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
  },
  genderOptionSelected: {
    color: '#B666D2',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  checkboxContainer: {
    marginRight: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#B666D2',
    borderColor: '#B666D2',
  },
  termsText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  termsLink: {
    color: '#B666D2',
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
    shadowRadius: 10,
    elevation: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  loginLink: {
    color: '#B666D2',
    fontSize: 14,
    fontWeight: '500',
  },
  datePickerContainer: {
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
    borderRadius: 16,
    marginTop: 10,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  datePickerIOS: {
    height: 180,
    width: '100%',
  },
  datePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  datePickerButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  datePickerButtonText: {
    color: '#B666D2',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.7,
  },
  placeholderText: {
    color: 'rgba(255,255,255,0.5)',
  },
  icon: {
    position: 'absolute',
    right: 12,
    top: 14,
  },
  buttonGradient: {
    width: '100%',
    padding: 18,
    alignItems: 'center',
  },
  required: {
    color: '#EC4899',
    fontSize: 16,
    fontWeight: '600',
  },
});
