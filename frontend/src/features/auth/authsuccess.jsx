import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useContext,useState } from 'react';
import { AuthContext } from './authContext';
import { useAuthStore } from '../../store/useAuthStore';

function AuthSuccess(){
    const navigate = useNavigate();
    const { setUser } = useContext(AuthContext);
    const [searchParams] = useSearchParams();
    const isNewUser=searchParams.get('newUser') === 'true';
    const role=searchParams.get('role');
    const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
    const [isReady,setIsReady] = useState(false);

    useEffect(() => {
      fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/profile`, {
        credentials: 'include', // sends the cookie automatically
      })
      .then(res => {
        console.log('AuthSuccess: Response status:', res.status);
        if (!res.ok) throw new Error('Not authenticated');
        return res.json();
      })
      .then((userData) => {
        console.log('AuthSuccess: User data received:', userData);
        // update user state in authcontext with fetched user data
        setUser(userData);
        checkAuth(); 
      })
      .catch((error) => {
        // If token invalid or no token, redirect to login page
        console.log('AuthSuccess: Error:', error);
        setUser(null);
        navigate('/login', { replace: true });
      });
  }, [navigate, setUser,isNewUser,checkAuth]);

  useEffect(() =>{

    console.log('AuthSuccess: Checking state...');
    console.log('authUser:', authUser);
    console.log('isCheckingAuth:', isCheckingAuth);

    if (!isCheckingAuth && authUser){
      console.log('AuthSuccess: authUser:', authUser);


      setIsReady(true);
    }
  }, [authUser, isCheckingAuth]);

  useEffect(() =>{
    if(isReady){
        console.log({ authUser })

        // Change the /roles after the page is created?
        // Use a small delay to ensure state is updated before navigation
        setTimeout(() => {
            console.log('AuthSuccess: Navigating based on role:', role);
            if(isNewUser){
              navigate('/roles', {replace:true});
            }
            else if(role === 'elderly'){
              navigate('/elderly_dashboard', {replace: true});
            }
            else if(role === 'admin'){
              navigate('/admin_dashboard', {replace: true});
            }
            else if(role === 'volunteer'){
              navigate('/volunteer_dashboard', {replace: true});
            }
            else if(role === 'caregiver'){
              navigate('/caregiver_dashboard', {replace: true});
            }
            else{
              navigate('/roles', { replace: true });
            }
        }, 100);
    }
  },[isReady, authUser, isNewUser, navigate])
  
    
    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '200px' 
        }}>
            <div>
                <p>Processing authentication...</p>
                <p>Please wait...</p>
            </div>
        </div>
    );
}
export default AuthSuccess;