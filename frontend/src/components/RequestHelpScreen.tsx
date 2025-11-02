import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, AlertTriangle, Clock, Upload, Phone, MessageSquare, CheckCircle } from "lucide-react";
import { axiosInstance as axios } from "./axios";
import { useNavigate } from "react-router-dom";
import useLocation from "../features/location/locationTracking";
import { useTranslation } from 'react-i18next';
import SubmitReviewModal from "../features/moderation/SubmitReviewModal";
import SubmitReportModal from "../features/moderation/SubmitReportModal";
import { useAuthStore } from "../store/useAuthStore";




export default function RequestHelpScreen() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation()

  const [step, setStep] = useState<"form" | "submitted" | "matched">("form");
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [formData, setFormData] = useState({
    location: "",
    description: "",
    urgency: "medium" as "low" | "medium" | "high"
  });


  const [matchedVolunteer, setMatchedVolunteer] = useState({
    id: "",
    name: "",
    phone: "",
    rating: 0,
    helpRequestId: ""
  });

  // Placeholder IDs for demo purposes
  /* const matchedVolunteerId = "demo-volunteer-001";
  const helpRequestId = "demo-help-001"; */

  const onBack = () => {
    navigate(`/elderly_dashboard`);
  }

  const [image, setImage] = useState<File | null>(null);

  const handleBack = () => {
    navigate(-1);
  };


  const handleNewRequest = () => {

    window.location.reload();

  }



  // WebSocket state
  const { socket } = useAuthStore();

  // WebSocket listeners for match with volunteer event
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (data: any) => {
      console.log('Received notification:', data);

      var metadata = data.metadata;

      var volunteerId = metadata.volunteerId;
      var volunteerName = metadata.volunteerName;
      var volunteerPhoneNumber = metadata.volunteerPhoneNumber;
      var volunteerRating = metadata.averageRating;
      var helpRequestId = metadata.helpRequestId

      setMatchedVolunteer({
        id: volunteerId,
        name: volunteerName,
        phone: volunteerPhoneNumber,
        rating: volunteerRating,
        helpRequestId: helpRequestId
      });

      setStep("matched");

    };


    // Add event listener for "notify" event emitted by acceptRequest in volunteerController when a volunteer accepts as help request 
    socket.on('notify', handleNotification);

    // Cleanup
    return () => {
      socket.off('notify', handleNotification);
    };
  }, [socket]);

  // getting user live location from useLocation
  const { location, error: locationError } = useLocation();

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
        /* setTimeout(() => {
          setStep("matched");
        }, 3000); */



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
      <div className="space-y-6">

        <div className="px-6 py-8 pb-24">
          <SubmitReviewModal
            isOpen={isReviewOpen}
            onClose={() => setIsReviewOpen(false)}
            recipientUserId={matchedVolunteer.id}
            helpRequestId={matchedVolunteer.helpRequestId}
          />

          <SubmitReportModal
            isOpen={isReportOpen}
            onClose={() => setIsReportOpen(false)}
            reportedUserId={matchedVolunteer.id}
            helpRequestId={matchedVolunteer.helpRequestId}
          />
        </div>

        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Help Found</h1>
        </div>

        <Card className="p-6 bg-success/5 border-success">
          <div className="text-center mb-4">
            <CheckCircle className="h-12 w-12 text-success mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-success">{t('help.volunteerMatched')}</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">{t('help.volunteer')}</span>
              <span className="text-lg">{matchedVolunteer.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">{t('help.phone')}</span>
              <Button variant="link" className="p-0 h-auto">
                {matchedVolunteer.phone}
              </Button>
            </div>
            {/* <div className="flex items-center justify-between">
              <span className="font-medium">{t('help.eta')}</span>
              <span className="text-lg text-warning">{matchedVolunteer.eta}</span>
            </div> */}
            <div className="flex items-center justify-between">
              <span className="font-medium">{t('help.status')}</span>
              <Badge variant="secondary" className="bg-warning text-warning-foreground">
                {t('help.onTheWay')}
              </Badge>
            </div>
          </div>

          {/* <div className="flex gap-3 mt-6">
            <Button variant="outline" className="flex-1">
              <Phone className="h-5 w-5" />
              {t('help.call')}
            </Button>
            <Button variant="outline" className="flex-1">
              <MessageSquare className="h-5 w-5" />
              {t('help.message')}
            </Button>
          </div> */}

          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setIsReviewOpen(true)}
            >
              Review Volunteer
            </Button>

            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => setIsReportOpen(true)}
            >
              Report Volunteer
            </Button>
          </div>
        </Card>

        <Button
          variant="outline"
          className="w-full"
          onClick={handleNewRequest}
        >
          {t('help.requestNewHelp')}
        </Button>
      </div>

    );
  }

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={onBack}>
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