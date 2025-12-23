import axios from 'axios';

//-------------------------------------
//  Axios Instance
//-----------------------------------
const API_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8000';

// Create axios instance with credentials
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for cookie-based auth
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 10000,
});

export default axiosInstance;
