import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, AlertTriangle, Clock, Upload, Phone, MessageSquare } from "lucide-react";
import { axiosInstance as axios } from "./axios";
import { useNavigate  } from "react-router-dom";
import useLocation from "../features/location/locationTracking";




export default function RequestHelpScreen() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"form" | "submitted" | "matched">("form");
  const [formData, setFormData] = useState({
    location: "",
    description: "",
    urgency: "medium" as "low" | "medium" | "high"
  });

  const onBack = () => {
    navigate(`/elderly_dashboard`);
  }

  const [image, setImage] = useState<File | null>(null);

  const handleBack = () => {
    navigate(-1); 
  };
  // getting user live location from useLocation
  const { location, error: locationError } = useLocation();
  
  const [matchedVolunteer] = useState({
    name: "Sarah Tan",
    phone: "+65 9876 5432",
    eta: "15 minutes",
    rating: 4.9,
  });

  const urgencyLevels = [
    {
      id: "low",
      label: "Low",
      description: "Can wait 30+ minutes",
      color: "bg-success text-success-foreground"
    },
    {
      id: "medium",
      label: "Medium",
      description: "Need help within 15-30 minutes",
      color: "bg-warning text-warning-foreground"
    },
    {
      id: "high",
      label: "High",
      description: "Need immediate assistance",
      color: "bg-destructive text-destructive-foreground"
    },
  ];


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // TODO: validate location -> use case 2.2 EX 2

    const submitFormData = new FormData();

    var token = localStorage.getItem("auth-storage");

    var tokenJSON = JSON.parse(token);

    var userID = tokenJSON.state.authUser.id;

    submitFormData.append("location", formData.location);
    submitFormData.append("description", formData.description);
    submitFormData.append("urgency", formData.urgency);
    submitFormData.append("image", null);
    submitFormData.append("userID", userID);
    submitFormData.append("longitude", location.longitude);
    submitFormData.append("latitude", location.latitude);

    if (image) {
      submitFormData.append("image", image);
    }

    try {
      const response = await axios.post("/elderly/requestHelp",
        submitFormData, {
        withCredentials: true, headers: {
          'Content-Type': 'multipart/form-data'
        }
      });


      console.log(response);
      

      if (response.status == 200) {
        setStep("submitted");

        // TODO: make matching dynamic and not hardcoded to simulate

        // Simulate matching process
        setTimeout(() => {
          setStep("matched");
        }, 3000);
      }
    } catch (error: any) {
      // TODO: handle error -> use case 2.2 EX 1
    } finally {

    }


    /* if (formData.location && formData.description) {
      setStep("submitted");
      // Simulate matching process
      setTimeout(() => {
        setStep("matched");
      }, 3000);
    } */


  };

  if (step === "submitted") {
    return (
      <div className="min-h-screen bg-background px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Finding Help</h1>
        </div>

        <div className="text-center py-12">
          <div className="bg-primary/10 rounded-full p-8 w-fit mx-auto mb-6 animate-pulse">
            <Clock className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Looking for a volunteer...
          </h2>
          <p className="text-lg text-muted-foreground">
            We're matching you with the best available helper in your area.
          </p>
        </div>
      </div>
    );
  }

  if (step === "matched") {
    return (
      <div className="min-h-screen bg-background px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Help is Coming!</h1>
        </div>

        <div className="space-y-6">
          <Card className="p-6 bg-success/5 border-success/20">
            <div className="text-center mb-6">
              <div className="bg-success/10 rounded-full p-6 w-fit mx-auto mb-4">
                <Phone className="h-8 w-8 text-success" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Volunteer Matched!
              </h2>
              <p className="text-muted-foreground">
                A caring volunteer is on their way to help you.
              </p>
            </div>

            <div className="bg-card rounded-xl p-4 mb-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 rounded-full p-3">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-card-foreground mb-1">
                    {matchedVolunteer.name}
                  </h3>
                  <p className="text-muted-foreground mb-2">
                    Phone: {matchedVolunteer.phone}
                  </p>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="bg-warning/10 text-warning">
                      ETA: {matchedVolunteer.eta}
                    </Badge>
                    <Badge variant="outline" className="bg-success/10 text-success">
                      ⭐ {matchedVolunteer.rating}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="success" size="lg" className="flex-1">
                <Phone className="h-5 w-5" />
                Call Volunteer
              </Button>
              <Button variant="outline" size="lg" className="flex-1">
                <MessageSquare className="h-5 w-5" />
                Send Message
              </Button>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold text-card-foreground mb-2">Your Request</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Location:</span>
                <span className="text-card-foreground">{formData.location}</span>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">Description:</span>
                <span className="text-card-foreground">{formData.description}</span>
              </div>
            </div>
          </Card>

          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => setStep("form")}
          >
            Cancel Request
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Request Help</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="location" className="text-lg font-medium">
            Your Location
          </Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="location"
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="h-14 text-lg pl-12"
              placeholder="Enter your current location"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-lg font-medium">
            What do you need help with?
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="min-h-24 text-lg resize-none"
            placeholder="Describe what kind of assistance you need..."
            required
          />
        </div>

        <div className="space-y-4">
          <Label className="text-lg font-medium">How urgent is this?</Label>
          <div className="space-y-3">
            {urgencyLevels.map((level) => (
              <Card
                key={level.id}
                className={`p-4 cursor-pointer transition-all duration-200 border-2 ${formData.urgency === level.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
                  }`}
                onClick={() => setFormData({ ...formData, urgency: level.id as any })}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className={level.color}>
                      {level.label}
                    </Badge>
                    <span className="text-card-foreground font-medium">
                      {level.description}
                    </span>
                  </div>
                  {formData.urgency === level.id && (
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-background rounded-full" />
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-lg font-medium">Add Photo (Optional)</Label>
          <Input
            id="image"
            type="file"
            onChange={handleFileChange}
          />
        </div>

        <Button type="submit" size="xl" className="w-full mt-8">
          Submit Help Request
        </Button>
      </form>
    </div>
  );
}