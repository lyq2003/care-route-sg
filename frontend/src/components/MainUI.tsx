import { Button } from "@/components/ui/button";
import { Heart, MapPin, Users, Shield } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";
import { useNavigate  } from "react-router-dom";

/**
 * Welcome Screen Component
 * 
 * Landing page that introduces users to CareRoute. Displays:
 * - Application branding and tagline
 * - Hero image showcasing the platform
 * - Feature highlights (Smart Routes, Helper Network, Care Support, Safety)
 * - Call-to-action button to get started
 * 
 * @component
 * @returns {JSX.Element} Welcome screen with feature highlights and CTA
 */
export default function WelcomeScreen() {
  const navigate = useNavigate();
  const onGetStarted = () =>{
      navigate('/login');
  }
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-6 pt-12 pb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="bg-primary rounded-full p-3">
            <MapPin className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-foreground">CareRoute</h1>
        </div>
        <p className="text-xl text-muted-foreground font-medium">
          Your Accessible Journey, Together
        </p>
      </div>

      {/* Hero Image */}
      <div className="px-6 mb-8">
        <div className="rounded-2xl overflow-hidden shadow-lg">
          <img 
            src={heroImage} 
            alt="Elderly person with caregiver on Singapore street"
            className="w-full h-64 object-cover"
          />
        </div>
      </div>

      {/* Description */}
      <div className="px-6 mb-12">
        <p className="text-lg text-foreground leading-relaxed text-center mb-8">
          Navigate Singapore with confidence. Get real-time accessible routes, 
          connect with caring volunteers, and stay connected with your loved ones.
        </p>

        {/* Feature highlights */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card rounded-xl p-4 shadow-md text-center">
            <div className="bg-primary/10 rounded-full p-3 w-fit mx-auto mb-3">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-medium text-card-foreground">Smart Routes</p>
          </div>
          
          <div className="bg-card rounded-xl p-4 shadow-md text-center">
            <div className="bg-success/10 rounded-full p-3 w-fit mx-auto mb-3">
              <Users className="h-6 w-6 text-success" />
            </div>
            <p className="text-sm font-medium text-card-foreground">Helper Network</p>
          </div>
          
          <div className="bg-card rounded-xl p-4 shadow-md text-center">
            <div className="bg-warning/10 rounded-full p-3 w-fit mx-auto mb-3">
              <Heart className="h-6 w-6 text-warning" />
            </div>
            <p className="text-sm font-medium text-card-foreground">Care Support</p>
          </div>
          
          <div className="bg-card rounded-xl p-4 shadow-md text-center">
            <div className="bg-secondary/10 rounded-full p-3 w-fit mx-auto mb-3">
              <Shield className="h-6 w-6 text-secondary" />
            </div>
            <p className="text-sm font-medium text-card-foreground">Safe & Secure</p>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <div className="px-6 pb-8">
        <Button 
          onClick={onGetStarted}
          size="xl"
          className="w-full"
        >
          Get Started Today
        </Button>
      </div>
    </div>
  );
}