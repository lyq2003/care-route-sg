import axios from "axios";

// Get the backend URL, defaulting to localhost:5173 if not set
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5173';
const baseURL = backendUrl.endsWith('/api') ? backendUrl : `${backendUrl}/api`;

console.log('🔧 Axios configuration:', { backendUrl, baseURL });

export const axiosInstance = axios.create({
    baseURL: baseURL,
    withCredentials: true,
})