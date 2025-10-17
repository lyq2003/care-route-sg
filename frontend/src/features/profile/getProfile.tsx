import { useState, useEffect } from "react";
import { axiosInstance } from "../../components/axios";

const getProfile = () => {
    const [profile, setProfile] = useState(null);

    const fetchProfile = async () =>{
        try{
            const response = await axiosInstance.get(
                "/users/profile",
                {withCredentials: true},
            );
            setProfile(response)
        } catch(error){
            console.error("Failed to fetch user profile", error);
        }
    }

    useEffect(() =>{
        fetchProfile();
    }, []);
    return {profile};
};

export default getProfile;