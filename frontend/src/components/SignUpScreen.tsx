import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, User, Heart, HandHeart, Shield } from "lucide-react";
import { useNavigate  } from "react-router-dom";
import { axiosInstance } from "./axios";

interface SignUpScreenProps {
  onBack: () => void;
}

type UserType = "elderly" | "caregiver" | "volunteer" | "admin" | null;

export default function SignUpScreen({ onBack}: SignUpScreenProps) {
  const [step, setStep] = useState<"role" | "details">("role");
  const [selectedRole, setSelectedRole] = useState<UserType>(null);
  const [error,setError] = useState(null);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone_number: "",
    password: "",
    confirmPassword: "",
  });
  const navigate = useNavigate();

  const userTypes = [
    {
      id: "elderly" as const,
      title: "Elderly User",
      description: "Get help and accessible routes",
      icon: User,
      color: "bg-primary/10 text-primary",
    },
    {
      id: "caregiver" as const,
      title: "Caregiver",
      description: "Care for your loved ones",
      icon: Heart,
      color: "bg-warning/10 text-warning",
    },
    {
      id: "volunteer" as const,
      title: "Volunteer",
      description: "Help others in your community",
      icon: HandHeart,
      color: "bg-success/10 text-success",
    },
    {
      id: "admin" as const,
      title: "Administrator",
      description: "Manage the platform",
      icon: Shield,
      color: "bg-secondary/10 text-secondary",
    },
  ];

  const handleRoleSelect = (role: UserType) => {
    setSelectedRole(role);
    setStep("details");
  };

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    if (!/\d/.test(password)) {
      errors.push("Password must contain at least one number");
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push("Password must contain at least one special character");
    }
    
    return errors;
  };

  const handlePasswordChange = (password: string) => {
    setFormData({ ...formData, password });
    if (password.length > 0) {
      const errors = validatePassword(password);
      setPasswordErrors(errors);
    } else {
      setPasswordErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validate password on submit
        const passwordValidationErrors = validatePassword(formData.password);
        if (passwordValidationErrors.length > 0) {
          setError("Please fix the password requirements below.");
          setPasswordErrors(passwordValidationErrors);
          return;
        }

        // Check password confirmation
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match.");
          return;
        }

        try{
          // Logic for checking with backend to sign up
          const response = await axiosInstance.post("/auth/signup",
          {
            name: formData.fullName,
            email: formData.email,
            password: formData.password,
            role: selectedRole,
            phone_number: formData.phone_number
          },
          { withCredentials: true}
          );
          console.log("Sigup response:", response.data);
    
          // CHANGE TO REDIRECT TO HOME SCREEN ONCE IT IS DONE
          navigate('/login');
        } catch (err: any) {
          console.error("Signup failed:", err);
          
          // Handle password validation errors from backend
          if (err.response?.data?.passwordErrors) {
            setPasswordErrors(err.response.data.passwordErrors);
            setError(err.response.data.message || "Password does not meet requirements");
          } else {
            setError(err.response?.data?.message || "Failed to signup, Please try again.");
          }
        }
      };
  if (step === "role") {
    return (
      <div className="min-h-screen bg-background px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Choose Account Type</h1>
        </div>

        <p className="text-muted-foreground mb-8 text-lg">
          Select the type of account that best describes you:
        </p>

        <div className="space-y-4">
          {userTypes.map((type) => (
            <Card
              key={type.id}
              className="p-6 cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/50"
              onClick={() => handleRoleSelect(type.id)}
            >
              <div className="flex items-center gap-4">
                <div className={`rounded-full p-4 ${type.color}`}>
                  <type.icon className="h-8 w-8" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-card-foreground mb-1">
                    {type.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {type.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const selectedUserType = userTypes.find(type => type.id === selectedRole);

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => setStep("role")}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
      </div>

      {selectedUserType && (
        <div className="mb-8">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className={`rounded-full p-3 ${selectedUserType.color}`}>
                <selectedUserType.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">
                  {selectedUserType.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedUserType.description}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-lg font-medium">
            Full Name
          </Label>
          <Input
            id="fullName"
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className="h-14 text-lg"
            placeholder="Enter your full name"
            required
          />
        </div>

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
          <Label htmlFor="phone_number" className="text-lg font-medium">
            Phone number
          </Label>
          <Input
            id="phone_number"
            type="tel"
            value={formData.phone_number}
            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
            className="h-14 text-lg"
            placeholder="Enter your phone number"
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
            onChange={(e) => handlePasswordChange(e.target.value)}
            className="h-14 text-lg"
            placeholder="Create a secure password"
            required
          />
          {passwordErrors.length > 0 && (
            <div className="mt-2 space-y-1">
              {passwordErrors.map((error, index) => (
                <p key={index} className="text-red-500 text-sm flex items-center gap-2">
                  <span className="text-red-500">•</span>
                  {error}
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-lg font-medium">
            Confirm Password
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className="h-14 text-lg"
            placeholder="Re-enter your password"
            required
          />
          {formData.password !== formData.confirmPassword && formData.confirmPassword !== "" && (
            <p className="text-red-500 text-sm">Passwords do not match.</p>
          )}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        )}

        <Button type="submit" size="xl" className="w-full mt-8">
          Create Account
        </Button>
      </form>
    </div>
  );
}