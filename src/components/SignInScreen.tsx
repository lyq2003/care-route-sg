import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, MapPin } from "lucide-react";

interface SignInScreenProps {
  onBack: () => void;
  onSignIn: (phone: string, password: string) => void;
  onGoToSignUp: () => void;
}

export default function SignInScreen({ onBack, onSignIn, onGoToSignUp }: SignInScreenProps) {
  const [formData, setFormData] = useState({
    phone: "",
    password: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.phone && formData.password) {
      onSignIn(formData.phone, formData.password);
    }
  };

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

      <form onSubmit={handleSubmit} className="space-y-6">
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
            placeholder="Enter your password"
            required
          />
        </div>

        <Button type="submit" size="xl" className="w-full mt-8">
          Sign In
        </Button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-muted-foreground mb-4">Don't have an account?</p>
        <Button variant="outline" size="lg" onClick={onGoToSignUp} className="w-full">
          Create New Account
        </Button>
      </div>
    </div>
  );
}