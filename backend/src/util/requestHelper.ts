import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

const SPOTIFY_API_BASE_URL = "https://api.spotify.com/v1";

export const spotifyApiClient: AxiosInstance = axios.create({
  baseURL: SPOTIFY_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const spotifyGet = async <T>(
  url: string,
  accessToken: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await spotifyApiClient.get<T>(url, {
    ...config,
    headers: {
      ...config?.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data;
};

export const spotifyPost = async <T>(
  url: string,
  accessToken: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await spotifyApiClient.post<T>(url, data, {
    ...config,
    headers: {
      ...config?.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data;
};

export const spotifyPut = async <T>(
  url: string,
  accessToken: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await spotifyApiClient.put<T>(url, data, {
    ...config,
    headers: {
      ...config?.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data;
};

export const spotifyDelete = async <T>(
  url: string,
  accessToken: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await spotifyApiClient.delete<T>(url, {
    ...config,
    headers: {
      ...config?.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data;
};
