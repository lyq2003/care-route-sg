const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, MapPin, User, Heart, HandHeart, Shield } from "lucide-react";
import { useNavigate  } from "react-router-dom";
import { axiosInstance } from "./axios";

export default function SignInScreen() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [error,setError] = useState(null);

  const onBack = () => {
    navigate(`/WelcomeScreen`);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try{
      // Logic for checking with backend to see if password is correct
      const response = await axiosInstance.post("/auth/login",
      {
        email: formData.email,
        password: formData.password,
      },
      { withCredentials: true }
      );

      // Handle the redirect response
      if (response.data.redirectUrl) {
          navigate(response.data.redirectUrl);
      } else {
        // Fallback if no redirectUrl is provided
        navigate('/error');
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      setError(err.response?.data?.message || "Failed to login, Please try again.");
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/api/auth/google`;
  };

  const onGoToSignUp = () =>{
    navigate('/signup');
  }

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
  };

  const roleOptions = [
    { id: "elderly", label: "Elderly User", icon: User, description: "I need help with navigation and assistance" },
    { id: "caregiver", label: "Caregiver", icon: Heart, description: "I care for elderly family members" },
    { id: "volunteer", label: "Volunteer", icon: HandHeart, description: "I want to help elderly users" },
    { id: "admin", label: "Administrator", icon: Shield, description: "I manage the platform" },
  ];

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="flex items-center gap-4 mb-12">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="bg-primary rounded-full p-2">
            <MapPin className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">CareRoute</h1>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h2>
        <p className="text-lg text-muted-foreground">
          Sign in to continue your accessible journey
        </p>
      </div>

      {!showRoleSelector ? (
        <>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-lg font-medium">
                Email 
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-14 text-lg"
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-lg font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="h-14 text-lg"
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            <Button type="submit" size="xl" className="w-full mt-8">
              Sign In
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
            
            <Button variant="outline" size="lg" onClick={handleGoogleLogin} className="w-full mt-4 bg-white text-gray-700 border-gray-300 hover:bg-gray-50">
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-muted-foreground mb-4">Don't have an account?</p>
            <Button variant="outline" size="lg" onClick={onGoToSignUp} className="w-full">
              Create New Account
            </Button>
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-foreground mb-2">Choose Your Role</h3>
            <p className="text-muted-foreground">Select how you'll be using CareRoute</p>
          </div>
          
          <div className="space-y-4">
            {roleOptions.map((role) => {
              const Icon = role.icon;
              return (
                <Card 
                  key={role.id}
                  className={`p-6 cursor-pointer transition-all border-2 ${
                    selectedRole === role.id 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => handleRoleSelect(role.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 rounded-full p-3">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold text-foreground">{role.label}</h4>
                      <p className="text-muted-foreground">{role.description}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
          
          <Button 
            variant="outline" 
            size="lg" 
            onClick={() => setShowRoleSelector(false)}
            className="w-full"
          >
            Back to Sign In
          </Button>
        </div>
      )}
    </div>
  );
}