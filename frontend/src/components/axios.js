import axios from "axios";

/**
 * Backend API base URL from environment variables
 * Falls back to localhost:5173 if not set
 */
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5173';

/**
 * Constructed base URL for API endpoints
 * Ensures /api suffix is present
 */
const baseURL = backendUrl.endsWith('/api') ? backendUrl : `${backendUrl}/api`;

console.log('🔧 Axios configuration:', { backendUrl, baseURL });

/**
 * Axios instance for API requests
 * 
 * Pre-configured with:
 * - Base URL for all API endpoints
 * - Credentials (cookies) included in requests for session management
 * 
 * All API calls should use this instance instead of axios directly.
 * 
 * @type {AxiosInstance}
 * @example
 * ```tsx
 * import { axiosInstance } from './axios';
 * const response = await axiosInstance.get('/users/profile');
 * ```
 */
export const axiosInstance = axios.create({
    baseURL: baseURL,
    withCredentials: true,
})