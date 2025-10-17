import { createContext, useState, useEffect } from 'react';
import { axiosInstance } from '../../components/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children })=>{
    const [user, setUser] = useState(null); // Stores user data or null if not authenticated
    const [loading, setLoading] = useState(true); // Add loading state
    const [initialized,setInitialized] = useState(false);

    // Function to check auth status
    const checkAuthStatus = async () => {
        setLoading(true);
        try {
            console.log('AuthContext: Checking authentication status...');
            const res = await axiosInstance.get("/users/profile", { credentials: 'include' });
            if (res.status ===200) {
                const data = await res.data;
                console.log('AuthContext: User authenticated:', data);
                setUser(data);
            } else {
                console.log('AuthContext: User not authenticated');
                setUser(null);
            }
        } catch (error) {
            console.log('AuthContext: Auth check failed:', error);
            setUser(null);
        } finally {
            setLoading(false);
            setInitialized(true);
        }
    };
    // Ensure auth check happen immediately on page load
    useEffect(() => {
        checkAuthStatus();
    }, []);

    return (
      <AuthContext.Provider value={{ user, setUser, loading, checkAuthStatus, initialized }}>
        {children}
      </AuthContext.Provider>
    );
};