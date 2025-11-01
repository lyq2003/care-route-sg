/**
 * Private Route Component
 * 
 * Route guard that protects routes requiring authentication.
 * 
 * Behavior:
 * - Shows loading state while checking authentication
 * - Redirects to /login if user is not authenticated
 * - Renders child routes if user is authenticated
 * 
 * Uses AuthContext to check authentication status.
 * 
 * @component
 * @returns {JSX.Element} Either <Outlet /> for authenticated users or <Navigate /> to login
 */
import { Navigate, Outlet } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './authContext';

const PrivateRoute = () => {
  const { user,loading,initialized } = useContext(AuthContext);

  console.log('PrivateRoute: user=', user, 'loading=', loading, 'initialized=', initialized);

  // Don't redirect until we've actually checked authentication status
  if (!initialized || loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '200px' 
      }}>
        <p>Loading...</p>
      </div>
    );
  }
  
  if (!user) {
    console.log('PrivateRoute: No user found, redirecting to login');
    // If the user is not authenticated, redirect to login page
    return <Navigate to="/login" replace />;
  }

  console.log('PrivateRoute: User authenticated, allowing access');
  // If authenticated, render the protected route
  return <Outlet />;
};

export default PrivateRoute;
