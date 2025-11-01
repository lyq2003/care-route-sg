import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import useLocation from "./locationTracking";

function ElderlyLocationUpdater() {
  const { location } = useLocation();
  const { authUser, socket } = useAuthStore();

  console.log("ELderly location updater is working", authUser.name, socket,location);
  useEffect(() => {
    if (socket?.connected && authUser?.id && location) {
      socket.emit("update_location", {
        elderlyId: authUser.id,
        elderlyName: authUser.name,
        latitude: location.latitude,
        longitude: location.longitude,
      });
      console.log("Emitted location update:", location);
    }
  }, [location, socket?.connected]);

  return null; // invisible component
}

export default ElderlyLocationUpdater;
