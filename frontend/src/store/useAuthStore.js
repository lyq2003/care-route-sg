import { create } from "zustand";
import {persist} from 'zustand/middleware';
import { axiosInstance } from "../components/axios";
const BASE_URL = import.meta.env.VITE_BACKEND_URL; // Make sure BASE_URL is properly defined.

export const useAuthStore = create(persist(
    (set,get) =>({
        authUser:null,
        isCheckingAuth: true,

        checkAuth: async () => {
            try {
            const res = await axiosInstance.get("/profile");
            
            console.log('checkAuth: Response from /profile:', res.data);
            // Only set authUser and connect socket if we have valid user data
            if (res.data && res.data.user && res.data.user.id) {
                set({ authUser: res.data });
                get().connectSocket();
                console.log('checkAuth: authUser set:', get().authUser);
            } else {
                console.log('checkAuth: Invalid user data received');
                set({ authUser: null });
                get().disconnectSocket();
            }
            } catch (error) {
            console.log("Error in checkAuth:", error);
            set({ authUser: null });
            get().disconnectSocket();
            } finally {
            set({ isCheckingAuth: false });
            }
        },

        logout: async () => {
            try {
            await axiosInstance.post("/auth/logout");
            set({ authUser: null });
            get().disconnectSocket();
            } catch (error) {
            toast.error(error.response.data.message);
            }
        },}),
        {
        name:'auth-storage',
        partialize:(state)=>({authUser:state.authUser}),
    }
));