import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Platform, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../utils/api';
import * as ImagePicker from 'expo-image-picker';
import { ActionSheetIOS } from 'react-native';

interface ProfileData {
  id: number;
  username: string;
  email: string;
  gender: string;
  dob: string;
  phone: string;
  profileimageurl: string | null;
}

const Profile = () => {
  const router = useRouter();
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ProfileData>({
    id: 0,
    username: '',
    email: '',
    gender: '',
    dob: new Date().toISOString(),
    phone: '',
    profileimageurl: null
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await api.get<ProfileData>('/profile');
      setFormData(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || new Date(formData.dob);
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    setFormData(prev => ({ ...prev, dob: currentDate.toISOString() }));
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/profile');
              router.replace('/login');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account');
            }
          },
        },
      ],
    );
  };

  const handleSaveChanges = async () => {
    try {
      setIsLoading(true);
      await api.put('/profile', formData);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleProfilePictureUpdate = async () => {
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
        'Update Profile Picture',
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
        // Here we'd ideally upload this image to your server
        // For now, just update the local state
        setFormData(prev => ({ ...prev, profileimageurl: result.assets[0].uri }));
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
        // Here we'd ideally upload this image to your server
        // For now, just update the local state
        setFormData(prev => ({ ...prev, profileimageurl: result.assets[0].uri }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#B666D2" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchProfile}>
          <LinearGradient
            colors={['#A855F7', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(0, 0, 0, 0.9)', 'rgba(18, 18, 18, 0.95)']}
        style={styles.gradient}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <MotiView
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 1000 }}
          >
            <Text style={styles.title}>Your Profile</Text>
          </MotiView>

          <View style={styles.card}>
            <View style={styles.avatarContainer}>
              <TouchableOpacity style={styles.avatarButton} onPress={handleProfilePictureUpdate}>
                {formData.profileimageurl ? (
                  <Image
                    source={{ uri: formData.profileimageurl }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <Ionicons name="camera-outline" size={40} color="#B666D2" />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                value={formData.username}
                onChangeText={(text) => setFormData(prev => ({ ...prev, username: text }))}
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                keyboardType="email-address"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                keyboardType="phone-pad"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Date of Birth</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={showDatepicker}
              >
                <Text style={{ color: '#ffffff', fontSize: 15 }}>
                  {formatDate(formData.dob)}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#B666D2" style={styles.selectIcon} />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  testID="dateTimePicker"
                  value={new Date(formData.dob)}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onDateChange}
                  maximumDate={new Date()}
                  minimumDate={new Date(1900, 0, 1)}
                  textColor="#FFFFFF"
                  style={Platform.OS === 'ios' ? styles.datePickerIOS : undefined}
                />
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Gender</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowGenderPicker(!showGenderPicker)}
              >
                <Text style={{ color: '#ffffff', fontSize: 15 }}>
                  {formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1)}
                </Text>
                <Ionicons name="chevron-down-outline" size={20} color="#B666D2" style={styles.selectIcon} />
              </TouchableOpacity>
              {showGenderPicker && (
                <View style={styles.genderPicker}>
                  {['Male', 'Female', 'Other'].map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={styles.genderOption}
                      onPress={() => {
                        setFormData(prev => ({ ...prev, gender: option.toLowerCase() }));
                        setShowGenderPicker(false);
                      }}
                    >
                      <Text style={[
                        styles.genderOptionText,
                        formData.gender.toLowerCase() === option.toLowerCase() && styles.genderOptionSelected
                      ]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.passwordHeader}
              onPress={() => setShowPasswordChange(!showPasswordChange)}
            >
              <Text style={styles.changePassword}>Change Password</Text>
              <Ionicons
                name={showPasswordChange ? "chevron-up-outline" : "chevron-down-outline"}
                size={20}
                color="#B666D2"
              />
            </TouchableOpacity>

            {showPasswordChange && (
              <MotiView
                from={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ type: 'timing', duration: 300 }}
                style={styles.passwordSection}
              >
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Current Password</Text>
                  <TextInput
                    style={styles.input}
                    value={passwordData.currentPassword}
                    onChangeText={(text) => setPasswordData(prev => ({ ...prev, currentPassword: text }))}
                    secureTextEntry
                    placeholder="Enter current password"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>New Password</Text>
                  <TextInput
                    style={styles.input}
                    value={passwordData.newPassword}
                    onChangeText={(text) => setPasswordData(prev => ({ ...prev, newPassword: text }))}
                    secureTextEntry
                    placeholder="Enter new password"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Confirm New Password</Text>
                  <TextInput
                    style={styles.input}
                    value={passwordData.confirmPassword}
                    onChangeText={(text) => setPasswordData(prev => ({ ...prev, confirmPassword: text }))}
                    secureTextEntry
                    placeholder="Confirm new password"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  />
                </View>
              </MotiView>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => router.back()}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveChanges}
              >
                <LinearGradient
                  colors={['#A855F7', '#EC4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDeleteAccount}
            >
              <Ionicons name="trash-outline" size={20} color="#FF4747" />
              <Text style={styles.deleteButtonText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
export default Profile;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#B666D2',
    marginBottom: 20,
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
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarButton: {
    width: 140,
    height: 140,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 15, 20, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#fff',
    marginBottom: 8,
    fontSize: 16,
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
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 10,
  },
  changePassword: {
    color: '#B666D2',
    fontSize: 16,
    fontWeight: '500',
  },
  passwordSection: {
    marginTop: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 30,
  },
  cancelButton: {
    flex: 1,
    height: 56,
    borderRadius: 24,
    backgroundColor: 'rgba(18, 18, 18, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  saveButton: {
    flex: 1,
    height: 56,
    borderRadius: 24,
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
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    height: 56,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 71, 71, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 71, 71, 0.2)',
    gap: 8,
    shadowColor: '#FF4747',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  deleteButtonText: {
    color: '#FF4747',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  datePickerIOS: {
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
    width: '100%',
    height: 180,
    marginTop: 10,
    borderRadius: 12,
  },
  genderPicker: {
    backgroundColor: 'rgba(18, 18, 18, 0.8)',
    borderRadius: 12,
    marginTop: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 1,
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FF4747',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: 'rgba(168, 85, 247, 0.6)',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

