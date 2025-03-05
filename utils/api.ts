import axios, {
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { config } from "./config";

// Create an Axios instance
const api = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});
console.log("api", config.apiBaseUrl);
// Add a request interceptor to include the token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await AsyncStorage.getItem("token"); // Retrieve token from AsyncStorage
      if (token) {
        (
          config.headers as Record<string, string>
        ).Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      console.error("Error retrieving token:", error);
      return config;
    }
  },
  (error: AxiosError) => Promise.reject(error) // Handle request errors
);

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
  (response: AxiosResponse) => response, // If the response is successful, just return it
  async (error: AxiosError) => {
    if (error.response && error.response.status === 401) {
      console.error("Unauthorized access - redirecting to login");
      try {
        await AsyncStorage.removeItem("token");
        router.replace("/login");
      } catch (storageError) {
        console.error("Error removing token:", storageError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
