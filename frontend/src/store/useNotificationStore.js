import { create } from "zustand";
import {persist} from 'zustand/middleware';
import { toast } from "react-toastify";
import { useAuthStore } from "./useAuthStore";
import { axiosInstance } from "../components/axios";

/**
 * Notification Store (Zustand)
 * 
 * Manages real-time notifications received via Socket.IO.
 * Handles:
 * - Notification list state
 * - Socket event listeners for notifications
 * - Mark notifications as read
 * - Display toast notifications
 * 
 * @namespace useNotificationStore
 * @example
 * ```tsx
 * const { notifications, initNotificationListener, markAllRead } = useNotificationStore();
 * ```
 */
export const useNotificationStore = create((set,get)=>({
    notifications: [],

    /**
     * Initialize Socket.IO listener for notifications
     * Sets up 'notify' event handler that:
     * - Displays toast notification
     * - Adds notification to state list
     * Only initializes if socket is connected
     * @returns {void}
     */
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

  /**
   * Mark all notifications as read
   * Updates all notifications in state to isRead: true
   * @returns {void}
   */
  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
    })),
}));
