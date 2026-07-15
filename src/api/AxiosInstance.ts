import axios from 'axios';
import { API_TIMEOUT, BASE_URL } from '../constants/AppConfig';

const axiosInstance = axios.create({
  baseURL:BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default axiosInstance;