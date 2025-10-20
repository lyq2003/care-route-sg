import { create } from "zustand";
import {persist} from 'zustand/middleware';
import { toast } from "react-toastify";
import { useAuthStore } from "./useAuthStore";
import { axiosInstance } from "../components/axios";

export const useNotificationStore = create((set,get)=>({
    notifications: [],

    initNotificationListener: () => {
    const { socket } = useAuthStore.getState();

    if (!socket) return;

    if (!socket?.connected) return; // Prevent binding if not connected

    socket.on("notify", (data) => {
      console.log("New notification:", data);
      toast.info(data.message, { position: "top-right", autoClose: 4000 });

      set((state) => ({
        notifications: [
          { ...data, createdAt: new Date(), isRead: false },
          ...state.notifications,
        ],
      }));
    });
  },

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
    })),
}));
