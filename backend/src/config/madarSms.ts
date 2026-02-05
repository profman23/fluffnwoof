import axios, { AxiosInstance } from 'axios';

const MADAR_BASE_URL = 'https://app.mobile.net.sa/api/v1';
const MADAR_API_TOKEN = process.env.MADAR_API_TOKEN || '';
const MADAR_SENDER_NAME = process.env.MADAR_SENDER_NAME || 'FluffnWoof';

export const madarClient: AxiosInstance = axios.create({
  baseURL: MADAR_BASE_URL,
  headers: {
    Authorization: `Bearer ${MADAR_API_TOKEN}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

export const madarConfig = {
  baseUrl: MADAR_BASE_URL,
  senderName: MADAR_SENDER_NAME,
  apiToken: MADAR_API_TOKEN,
};
