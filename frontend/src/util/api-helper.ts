import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { QueryClient } from '@tanstack/react-query';
import { API_BASE_URL, SPOTIFY_API_BASE_URL } from './constants';
import { getAccessToken } from './auth';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const spotifyApiClient: AxiosInstance = axios.create({
  baseURL: SPOTIFY_API_BASE_URL,
});

spotifyApiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const get = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  const response = await apiClient.get<T>(url, config);
  return response.data;
};

export const post = async <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> => {
  const response = await apiClient.post<T>(url, data, config);
  return response.data;
};

export const spotifyGet = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  const response = await spotifyApiClient.get<T>(url, config);
  return response.data;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
