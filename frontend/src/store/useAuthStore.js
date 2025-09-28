import { create } from "zustand";
import {persist} from 'zustand/middleware';
import { axiosInstance } from "../components/axios";

export const useAuthStore = create(persist(
    (set,get) =>({
        authUser:null,
        isCheckingAuth: true,

        checkAuth: async () => {
            try {
            const res = await axiosInstance.get("/users/profile");
            console.log('checkAuth: Response from /profile:', res.data);

            // Only set authUser if we have valid user data
            if (res.data && res.data.id) {
                set({ authUser: res.data });
                console.log('checkAuth: authUser set:', get().authUser);
            } else {
                console.log('checkAuth: Invalid user data received');
                set({ authUser: null });
            }
            } catch (error) {
            console.log("Error in checkAuth:", error);
            set({ authUser: null });
            } finally {
            set({ isCheckingAuth: false });
            }
        },

        logout: async () => {
            try {
            await axiosInstance.post("/auth/logout");
            set({ authUser: null });
            } catch (error) {
                toast.error(error.response.data.message);
            }
        },}),
        {
        name:'auth-storage',
        partialize:(state)=>({authUser:state.authUser}),
    }
));