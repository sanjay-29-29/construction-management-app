import { Preferences } from '@capacitor/preferences';
import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import applyCaseConverter from 'axios-case-converter';

const client = (() => {
  return axios.create({
    baseURL: import.meta.env.VITE_BASE_URL,
    headers: {
      Accept: 'application/json, text/plain, */*',
    },
  });
})();

applyCaseConverter(client);

client.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const { value } = await Preferences.get({ key: 'token' });
    if (value) {
      config.headers.Authorization = `Token ${value}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

export { client };
