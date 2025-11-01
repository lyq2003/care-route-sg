import { useState, useEffect } from "react";
import { axiosInstance } from "../../components/axios";

const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);

  const fetchLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });
        },
        (err) => {
          setError(err.message);
        },
        {
          maximumAge: 1000 * 60 * 5, // use cached GPS data up to 5 mins old
        }
      );
    } else {
      setError("Geolocation not supported");
    }
  };

  useEffect(() => {
    // Fetch the location immediately when the component mounts
    fetchLocation();

    // Set an interval to fetch the location every minute (60,000 ms)
    const intervalId = setInterval(fetchLocation, 60000);

    // Cleanup the interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  return { location, error };
};

export default useLocation;


