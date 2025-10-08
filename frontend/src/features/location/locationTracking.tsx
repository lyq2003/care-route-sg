import { useState, useEffect } from "react";
import { axiosInstance } from "../../components/axios";

const useLocation = (sendToBackend) => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);

  const fetchLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });

          // send the location to the backend
          if (sendToBackend) {
            sendToBackend(latitude, longitude);
          }
        },
        (err) => {
          setError(err.message);
        }
      );
    } else {
      setError("Geolocation not supported");
    }
  };

  useEffect(() => {
    // Fetch the location immediately when the component mounts
    fetchLocation();

    // Set an interval to fetch the location every 5 minutes (300,000 ms)
    const intervalId = setInterval(fetchLocation, 300000);

    // Cleanup the interval on component unmount
    return () => clearInterval(intervalId);
  }, [sendToBackend]);

  return { location, error };
};

export default useLocation;


