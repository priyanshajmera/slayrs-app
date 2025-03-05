export interface WardrobeItem {
  id: number;
  image_url: string;
  category: string;
  description: string;
  tags: string;
  subcategory: string;
}

export interface OutfitItem {
  clothId: {
    image_url: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface FormData {
  email: string;
  password: string;
}

export interface GenerateFormData {
  occasion: string;
  weather: string;
  style: string;
  fit: string;
  timeOfDay: string;
  layering: boolean;
  description: string;
}

export interface Category {
  name: string;
  subcategories: string[];
}

export interface Feature {
  title: string;
  description: string;
  icon: any; // Lucide icon component type
  link: string;
  color: string;
}

export interface UploadFormData {
  image: string | null;
  category: string;
  subcategory: string;
  itemName: string;
}

declare global {
  namespace ReactNavigation {
    interface RootParamList {
      "/ootd": { outfit: OutfitItem[] };
    }
  }
} 