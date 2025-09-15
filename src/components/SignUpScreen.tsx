import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, User, Heart, HandHeart, Shield } from "lucide-react";

interface SignUpScreenProps {
  onBack: () => void;
  onSignUpComplete: (userType: string, userData: any) => void;
}

type UserType = "elderly" | "caregiver" | "volunteer" | "admin" | null;

export default function SignUpScreen({ onBack, onSignUpComplete }: SignUpScreenProps) {
  const [step, setStep] = useState<"role" | "details">("role");
  const [selectedRole, setSelectedRole] = useState<UserType>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    password: "",
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole && formData.fullName && formData.phone && formData.password) {
      onSignUpComplete(selectedRole, formData);
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
            Phone Number
          </Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="h-14 text-lg"
            placeholder="+65 xxxx xxxx"
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
            placeholder="Create a secure password"
            required
          />
        </div>

        <Button type="submit" size="xl" className="w-full mt-8">
          Create Account
        </Button>
      </form>
    </div>
  );
}