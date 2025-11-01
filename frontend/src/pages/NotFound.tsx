import { useLocation } from "react-router-dom";
import { useEffect } from "react";

/**
 * 404 Not Found Page Component
 * 
 * Displays when user navigates to a non-existent route.
 * Logs the attempted route path for debugging.
 * 
 * @component
 * @returns {JSX.Element} 404 error page with link to home
 */
const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-gray-600">Oops! Page not found</p>
        <a href="/" className="text-blue-500 underline hover:text-blue-700">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
