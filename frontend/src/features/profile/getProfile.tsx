import { useState, useEffect } from "react";
import { axiosInstance } from "../../components/axios";

export const getProfile = () => {
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

// get profile from user_profile as it contains non meta details
export const getUserProfile = ()=>{
    const [userProfile, setProfile] = useState(null);

    const fetchProfile = async () =>{
        try{
            const response = await axiosInstance.get(
                "/profile/getId",
                {withCredentials: true},
            );
            setProfile(response)
        } catch(error){
            console.error("Failed to fetch user_profile data", error);
        }
    }

    useEffect(() =>{
        fetchProfile();
    }, []);
    return {userProfile};
}
