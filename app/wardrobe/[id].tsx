import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import api from '../../utils/api';
import { WardrobeItem, Category } from '../../types';
import { MotiView } from 'moti';

const categories: Category[] = [
    { name: 'Tops', subcategories: ['T-Shirts', 'Shirts', 'Sweaters'] },
    { name: 'Bottoms', subcategories: ['Jeans', 'Shorts', 'Skirts'] },
    { name: 'Dresses', subcategories: ['Casual', 'Formal', 'Party'] },
    { name: 'Shoes', subcategories: ['Sneakers', 'Boots', 'Heels'] },
    { name: 'Accessories', subcategories: ['Bags', 'Jewelry', 'Hats'] },
];

export default function WardrobeItemDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const navigation = useNavigation();
    const [item, setItem] = useState<WardrobeItem | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSubcategory, setSelectedSubcategory] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isFavorite, setIsFavorite] = useState(false);
    const [editableItem, setEditableItem] = useState<WardrobeItem | null>(null);

    useEffect(() => {
        fetchItemDetails();
    }, [id]);

    const fetchItemDetails = async () => {
        try {
            setIsLoading(true);
            const response = await api.get<WardrobeItem>(`/outfits/${id}`);
            const itemData = response.data;
            setItem(itemData);
            setEditableItem(itemData);
            setName(itemData.tags || '');
            setDescription(itemData.description || '');
            setSelectedCategory(itemData.category || '');
            setSelectedSubcategory(itemData.subcategory || '');
        } catch (error) {
            console.error('Error fetching item details:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleFavorite = async () => {
        if (!item) return;
        try {
            if (isFavorite) {
                await api.delete(`/favorites/${item.id}`);
            } else {
                await api.post(`/favorites/${item.id}`);
            }
            setIsFavorite(!isFavorite);
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    };

    const handleSaveChanges = async () => {
        if (!editableItem) return;
        try {
            await api.put(`/outfits/${editableItem.id}`, {
                tags: name,
                description,
                category: selectedCategory,
                subcategory: selectedSubcategory,
            });
            alert('Item updated successfully!');
            router.push('/(tabs)/wardrobe');
        } catch (error) {
            console.error('Error updating item:', error);
            alert('Failed to update item. Please try again.');
        }
    };

    const handleDeleteItem = async () => {
        if (!item) return;
        try {
            await api.delete(`/outfits/${item.id}`);
            alert('Item deleted successfully!');
            router.back();
        } catch (error) {
            console.error('Error deleting item:', error);
            alert('Failed to delete item. Please try again.');
        }
    };

    const currentSubcategories = categories.find(cat => cat.name === selectedCategory)?.subcategories || [];

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#B666D2" />
            </View>
        );
    }

    if (!item) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Item not found</Text>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['rgba(10, 10, 14, 0.98)', 'rgba(18, 18, 22, 0.97)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                <View style={styles.header}>
                    <View style={styles.headerTitleContainer}>
                        <Image 
                            source={require('../../assets/noBgColor.png')} 
                            style={styles.headerLogo} 
                            resizeMode="contain"
                        />
                    </View>
                    <TouchableOpacity 
                        style={styles.headerButton}
                        onPress={() => router.push('/profile')}
                    >
                        <View style={styles.profileButton}>
                            <Ionicons name="person-outline" size={20} color="#fff" />
                            <Ionicons name="chevron-down" size={16} color="#fff" />
                        </View>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.scrollView}>
                    <MotiView
                        from={{ opacity: 0, translateY: -20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'timing', duration: 500 }}
                    >
                        <View style={styles.imageContainer}>
                            <Image
                                source={{ uri: item.image_url }}
                                style={styles.image}
                                resizeMode="cover"
                            />
                        </View>
                    </MotiView>

                    <View style={styles.detailsContainer}>
                        <MotiView
                            from={{ opacity: 0, translateY: 20 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ type: 'timing', duration: 500 }}
                        >
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Name</Text>
                                <TextInput
                                    style={styles.input}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Enter item name"
                                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                                />
                            </View>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Description</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={description}
                                    onChangeText={setDescription}
                                    placeholder="The shirt features a light blue cotton fabric adorned with a subtle leaf pattern..."
                                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                                    multiline
                                    numberOfLines={4}
                                />
                            </View>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Category</Text>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    style={styles.categoriesContainer}
                                >
                                    {categories.map((category, index) => (
                                        <MotiView
                                            key={category.name}
                                            from={{ opacity: 0, translateX: -20 }}
                                            animate={{ opacity: 1, translateX: 0 }}
                                            transition={{ type: 'timing', delay: 300 + index * 100 }}
                                        >
                                            <TouchableOpacity
                                                onPress={() => setSelectedCategory(category.name)}
                                                style={[
                                                    styles.categoryChip,
                                                    !(category.name === selectedCategory) && styles.unselectedChip,
                                                ]}
                                            >
                                                {category.name === selectedCategory ? (
                                                    <LinearGradient
                                                        colors={['#A855F7', '#EC4899']}
                                                        start={{ x: 0, y: 0 }}
                                                        end={{ x: 1, y: 0 }}
                                                        style={styles.chipGradient}
                                                    >
                                                        <Text style={styles.selectedChipText}>{category.name}</Text>
                                                    </LinearGradient>
                                                ) : (
                                                    <Text style={styles.categoryChipText}>{category.name}</Text>
                                                )}
                                            </TouchableOpacity>
                                        </MotiView>
                                    ))}
                                </ScrollView>
                            </View>
                            {selectedCategory && (
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Sub-Category</Text>
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        style={styles.categoriesContainer}
                                    >
                                        {currentSubcategories.map((subcategory, index) => (
                                            <MotiView
                                                key={subcategory}
                                                from={{ opacity: 0, translateX: -20 }}
                                                animate={{ opacity: 1, translateX: 0 }}
                                                transition={{ type: 'timing', delay: 400 + index * 100 }}
                                            >
                                                <TouchableOpacity
                                                    onPress={() => setSelectedSubcategory(subcategory)}
                                                    style={[
                                                        styles.categoryChip,
                                                        !(subcategory === selectedSubcategory) && styles.unselectedChip,
                                                    ]}
                                                >
                                                    {subcategory === selectedSubcategory ? (
                                                        <LinearGradient
                                                            colors={['#A855F7', '#EC4899']}
                                                            start={{ x: 0, y: 0 }}
                                                            end={{ x: 1, y: 0 }}
                                                            style={styles.chipGradient}
                                                        >
                                                            <Text style={styles.selectedChipText}>{subcategory}</Text>
                                                        </LinearGradient>
                                                    ) : (
                                                        <Text style={styles.categoryChipText}>{subcategory}</Text>
                                                    )}
                                                </TouchableOpacity>
                                            </MotiView>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </MotiView>

                        <View style={styles.actionButtons}>
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
                                    <View style={styles.buttonContent}>
                                        <Ionicons name="save-outline" size={24} color="#fff" />
                                        <Text style={styles.saveButtonText}>Save</Text>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={handleDeleteItem}
                            >
                                <View style={styles.buttonContent}>
                                    <Ionicons name="trash-outline" size={24} color="#fff" />
                                    <Text style={styles.deleteButtonText}>Delete</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
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
        backgroundColor: 'rgba(0, 0, 0, 0.97)',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000000',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000000',
        padding: 20,
    },
    errorText: {
        color: '#fff',
        fontSize: 18,
        marginBottom: 20,
    },
    scrollView: {
        flex: 1,
    },
    imageContainer: {
        width: '100%',
        aspectRatio: 1,
        marginBottom: 24,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: 'rgba(15, 15, 20, 0.95)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 16,
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.06)',
        backgroundColor: 'rgba(12, 12, 14, 0.96)',
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerLogo: {
        width: 120,
        height: 40,
    },
    headerButton: {
        marginRight: 0,
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
    detailsContainer: {
        padding: 24,
    },
    inputContainer: {
        marginBottom: 24,
    },
    label: {
        color: '#ffffff',
        fontSize: 17,
        fontWeight: '600',
        marginBottom: 12,
        letterSpacing: 0.1,
    },
    input: {
        backgroundColor: 'rgba(15, 15, 20, 0.95)',
        borderRadius: 16,
        padding: 16,
        color: '#ffffff',
        fontSize: 15,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
    },
    categoriesContainer: {
        flexDirection: 'row',
    },
    categoryChip: {
        borderRadius: 24,
        overflow: 'hidden',
        minWidth: 90,
        marginRight: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 6,
    },
    unselectedChip: {
        backgroundColor: 'rgba(15, 15, 20, 0.95)',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        alignItems: 'center',
    },
    chipGradient: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        alignItems: 'center',
    },
    categoryChipText: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 14,
        fontWeight: '500',
    },
    selectedChipText: {
        color: '#ffffff',
        fontWeight: '600',
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 16,
        marginTop: 32,
        paddingHorizontal: 4,
    },
    saveButton: {
        flex: 1,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: 'rgba(168, 85, 247, 0.5)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
    },
    deleteButton: {
        flex: 1,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 59, 48, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255, 59, 48, 0.2)',
        overflow: 'hidden',
    },
    buttonGradient: {
        width: '100%',
        height: 48,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 8,
    },
    saveButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    deleteButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
}); 