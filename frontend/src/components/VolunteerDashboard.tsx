import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Activity,
  HelpCircle, 
  User, 
  Star,
  LogOut,
  MapPin,
  Clock,
  Menu,
  Check,
  Navigation,
  Shield
} from "lucide-react";
import { axiosInstance } from "./axios";
import useLocation from "../features/location/locationTracking";

export default function VolunteerDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isAvailable, setIsAvailable] = useState(true);
  const [volunteerData] = useState({
    name: "Sarah Volunteer",
    isVerified: true,
    totalHelped: 42,
    averageRating: 4.8,
    reviewCount: 38
  });

  const helpRequests = [
    {
      id: 1,
      title: "Help needed at Orchard Road MRT Station",
      priority: "MEDIUM",
      matchPercentage: 95,
      description: "Need help carrying heavy groceries to taxi stand",
      distance: "0.8 km away",
      timeEstimate: "20 minutes",
      requester: "Margaret Chen",
      requiredSkills: ["Physical assistance", "Mobility support"]
    },
    {
      id: 2,
      title: "Assistance with MRT navigation",
      priority: "LOW",
      matchPercentage: 88,
      description: "Need help navigating from Raffles Place to Marina Bay",
      distance: "1.2 km away",
      timeEstimate: "15 minutes",
      requester: "David Lim",
      requiredSkills: ["Navigation help", "Mobility support"]
    },
    {
      id: 3,
      title: "Emergency grocery shopping help",
      priority: "HIGH",
      matchPercentage: 92,
      description: "Urgent help needed for grocery shopping and delivery",
      distance: "0.5 km away",
      timeEstimate: "30 minutes",
      requester: "Alice Wong",
      requiredSkills: ["Shopping assistance", "Physical assistance"]
    }
  ];
  const sendLocationToBackend = async (latitude,longitude) =>{
      try {
      const response = await axiosInstance.get(
        "/volunteer/getPendingPosts", 
        {params: {
          latitude,  
          longitude, 
        },
        withCredentials: true,
    });
      console.log("Location sent to backend:", response.data);
    } catch (error) {
      console.error("Error sending location to backend:", error);
    }
  };

  const { location, error } = useLocation(sendLocationToBackend);

  const onSignOut = async () => {
        try{
          await axiosInstance.post(`/auth/logout`, {} ,{
            withCredentials: true,
          });
          window.location.href = '/login'; // Force full refresh
          } catch(err){
            console.error('Logout failed:', err);
            alert('Logout failed. Please try again.');
          }
      }

  const handleAcceptRequest = (requestId: number) => {
    console.log("Accepting request:", requestId);
  };

  const handleViewRoute = (requestId: number) => {
    console.log("Viewing route for request:", requestId);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-destructive text-destructive-foreground";
      case "MEDIUM":
        return "bg-warning text-warning-foreground";
      case "LOW":
        return "bg-success text-success-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="space-y-4">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-muted rounded-full p-3">
                      <Check className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <span className="text-lg font-medium text-muted-foreground">Total Helped</span>
                  </div>
                  <span className="text-3xl font-bold text-primary">{volunteerData.totalHelped}</span>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-muted rounded-full p-3">
                      <Star className="h-6 w-6 text-warning fill-current" />
                    </div>
                    <span className="text-lg font-medium text-muted-foreground">Average Rating</span>
                  </div>
                  <span className="text-3xl font-bold text-foreground">{volunteerData.averageRating}/5.0</span>
                </div>
              </Card>
            </div>

            {/* Help Requests Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-foreground">Nearby Help Requests</h3>
              
              <Button variant="secondary" size="lg" className="w-full bg-primary/20 hover:bg-primary/30 text-foreground">
                View All Requests
              </Button>

              <div className="space-y-4">
                {helpRequests.map((request) => (
                  <Card key={request.id} className="p-6 space-y-4">
                    <h4 className="text-lg font-semibold text-foreground">{request.title}</h4>
                    
                    <div className="flex gap-2">
                      <Badge className={getPriorityColor(request.priority)}>
                        {request.priority} Priority
                      </Badge>
                      <Badge className="bg-success text-success-foreground">
                        {request.matchPercentage}% Match
                      </Badge>
                    </div>

                    <p className="text-foreground">{request.description}</p>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{request.distance}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{request.timeEstimate}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>{request.requester}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">Required Skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {request.requiredSkills.map((skill, index) => (
                          <Badge key={index} variant="outline" className="bg-muted">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button 
                        onClick={() => handleAcceptRequest(request.id)}
                        className="flex-1 bg-success hover:bg-success/90"
                      >
                        <Check className="h-5 w-5 mr-2" />
                        Accept Request
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handleViewRoute(request.id)}
                        className="flex-1 text-primary border-primary/50"
                      >
                        <Navigation className="h-5 w-5 mr-2" />
                        View Route
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        );

      case "help":
        return (
          <div className="text-center py-12">
            <HelpCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl text-muted-foreground">Help Center - Coming Soon</p>
          </div>
        );

      case "profile":
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">Profile & Settings</h2>
              <p className="text-lg text-muted-foreground">Manage your volunteer account</p>
            </div>

            <Card className="p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">Basic Information</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                  <div className="text-lg text-foreground">{volunteerData.name}</div>
                </div>
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-header-bg px-6 py-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Welcome, {volunteerData.name}
              </h1>
              {volunteerData.isVerified && (
                <Badge className="bg-verified text-verified-foreground mb-2">
                  <Shield className="h-3 w-3 mr-1" />
                  Verified Volunteer
                </Badge>
              )}
              <p className="text-muted-foreground">
                Volunteer • {volunteerData.reviewCount} reviews
              </p>
            </div>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </div>

          {/* Availability Toggle */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isAvailable ? 'bg-success' : 'bg-muted-foreground'}`} />
                <span className="font-medium text-foreground">
                  {isAvailable ? "Available" : "Offline"}
                </span>
              </div>
              <Button
                onClick={() => setIsAvailable(!isAvailable)}
                variant={isAvailable ? "destructive" : "default"}
                size="sm"
                className={!isAvailable ? "bg-success hover:bg-success/90" : ""}
              >
                {isAvailable ? "Go Offline" : "Go Online"}
              </Button>
            </div>
          </Card>

          {/* Sign Out */}
          <Button 
            variant="ghost" 
            className="w-full justify-center gap-2"
            onClick={onSignOut}
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="sticky top-0 bg-background border-b border-border shadow-sm z-10">
        <div className="flex">
          {[
            { id: "dashboard", icon: Activity, label: "Dashboard" },
            { id: "help", icon: HelpCircle, label: "Help" },
            { id: "profile", icon: User, label: "Profile" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            {activeTab === "dashboard" ? "Volunteer Dashboard" : 
             activeTab === "help" ? "Help Center" : 
             "Profile & Settings"}
          </h2>
        </div>
        {renderTabContent()}
      </div>
    </div>
  );
}
