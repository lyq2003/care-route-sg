import { useState } from "react";
import WelcomeScreen from "@/components/MainUI";
import SignInScreen from "@/components/SignInScreen";
import SignUpScreen from "@/components/SignUpScreen";
import ElderlyUI from "@/components/ElderlyUI";
import RequestHelpScreen from "@/components/RequestHelpScreen";
import { useToast } from "@/hooks/use-toast";

/**
 * Available screen states for navigation
 */
type Screen = "welcome" | "signin" | "signup" | "dashboard" | "request-help";

/**
 * User object structure
 */
interface User {
  /** User's full name */
  name: string;
  /** User type/role */
  userType: string;
  /** User's phone number */
  phone: string;
}

/**
 * Index/Home Page Component
 * 
 * Main entry point that manages screen navigation and user state.
 * This is a simplified version - the actual app uses React Router.
 * Handles:
 * - Screen state management (welcome, signin, signup, dashboard, request-help)
 * - User authentication state
 * - Navigation between screens
 * - Mock authentication for demo purposes
 * 
 * @component
 * @returns {JSX.Element} Current screen based on state
 */
const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>("welcome");
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  const handleSignIn = (phone: string, password: string) => {
    // Simulate sign in - in real app, this would call an API
    const mockUser = {
      name: "Margaret Chen",
      userType: "elderly",
      phone: phone,
    };
    setUser(mockUser);
    setCurrentScreen("dashboard");
    toast({
      title: "Welcome back!",
      description: "You have successfully signed in.",
    });
  };

  const handleSignUp = (userType: string, userData: any) => {
    // Simulate sign up - in real app, this would call an API
    const newUser = {
      name: userData.fullName,
      userType: userType,
      phone: userData.phone,
    };
    setUser(newUser);
    setCurrentScreen("dashboard");
    toast({
      title: "Account created!",
      description: "Welcome to CareRoute. Your account has been set up successfully.",
    });
  };

  const handleSignOut = () => {
    setUser(null);
    setCurrentScreen("welcome");
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case "welcome":
        return (
          <WelcomeScreen 
            onGetStarted={() => setCurrentScreen("signin")} 
          />
        );
      
      case "signin":
        return (
          <SignInScreen 
            onBack={() => setCurrentScreen("welcome")}
            onSignIn={handleSignIn}
            onGoToSignUp={() => setCurrentScreen("signup")}
          />
        );
      
      case "signup":
        return (
          <SignUpScreen 
            onBack={() => setCurrentScreen("signin")}
            onSignUpComplete={handleSignUp}
          />
        );
      
      case "dashboard":
        return user ? (
          <ElderlyUI 
            user={user}
            onRequestHelp={() => setCurrentScreen("request-help")}
            onSmartRoutes={() => toast({ title: "Smart Routes", description: "Coming soon!" })}
            onSignOut={handleSignOut}
          />
        ) : null;
      
      case "request-help":
        return (
          <RequestHelpScreen 
            onBack={() => setCurrentScreen("dashboard")}
          />
        );
      
      default:
        return <WelcomeScreen onGetStarted={() => setCurrentScreen("signin")} />;
    }
  };

  return <div className="min-h-screen">{renderScreen()}</div>;
};

export default Index;
