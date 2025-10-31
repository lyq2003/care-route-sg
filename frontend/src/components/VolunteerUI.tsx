import { useState, useEffect, useRef, useCallback} from "react";
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
  Menu,
  Check,
  Navigation,
  Shield
} from "lucide-react";
import { axiosInstance } from "./axios";
import { useNavigate } from "react-router-dom";
import useLocation from "../features/location/locationTracking";
import {getProfile, getUserProfile} from "@/features/profile/getProfile";
import AcceptedRequest from "../features/volunteer/VolunteerAcceptedRequest";
import CompletedRequest from "@/features/volunteer/VolunteerFinishedRequest";
import VolunteerProfile from "@/features/volunteer/VolunteerProfile";
import VolunteerRoute from "./VolunteerRoute";

// Max number of posts to be fetched every call
const LIMIT=10;

export default function VolunteerUI() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isAvailable, setIsAvailable] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset,setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [helpRequests, setHelpRequests] = useState([]);
  const [volunteerData, setVolunteerData] = useState({
    name: "Unknown Volunteer",
    phoneNumber: null,
    isVerified: false,
    totalHelped: 0,
    averageRating: 0,
    reviewCount: 0
  });
  const [selectedRoute, setSelectedRoute] = useState<{ from: any; to: any } | null>(null);

  // getting user info from getProfile
  const {profile} = getProfile();
  // this is the data from user_profile
  const {userProfile}= getUserProfile();
  
useEffect(() => {
  console.log("userProfile is:", userProfile);

  // Defensive checks
  if (!userProfile || !userProfile.data || !userProfile.data.profile) {
    console.log("Profile not ready yet");
    return;
  }

  console.log("user data is:", userProfile.data.profile);

  const p = userProfile.data.profile;
  setVolunteerData({
    name: p.username || "Unknown Volunteer",
    phoneNumber: p.phone_number ?? "Unknown number",
    isVerified: p.isVerified ?? false,
    totalHelped: p.requests || 0,
    averageRating: p.rating || 0,
    reviewCount: p.review_count || 0
  });
}, [userProfile]);


  // Sending location to fetch posts based on nearest location

  const observer = useRef<IntersectionObserver | null>(null);
  // getting user live location from useLocation
  const { location, error: locationError } = useLocation();

  // infinite scrolling setup
  const lastPostElementRef = useCallback(
    (node: Element | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      // guard for environments without IntersectionObserver (SSR / old browsers)
      if (typeof IntersectionObserver === "undefined") return;

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setLoading(true);
          setOffset((prevOffset) => prevOffset + LIMIT);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  const fetchedOffsets = useRef(new Set());
  // fetch posts when offset or location changes

  useEffect(() =>{
    if(!location) return;
    if (fetchedOffsets.current.has(offset)) return;

    fetchedOffsets.current.add(offset);
    setLoading(true);

    const fetchRequests = async (latitude,longitude) =>{
      try {
        const response = await axiosInstance.get(
          "/volunteer/getPendingPosts", 
          {params: {
            latitude,  
            longitude, 
            limit: LIMIT,
            offset,
          },
          withCredentials: true,
        });

        const newRequests = response.data.data || []; 
        
        setHelpRequests((prevRequests) => {
          const existingIds = new Set(prevRequests.map((r) => r.id)); // Set of existing request IDs
          const filteredNew = newRequests.filter((r) => !existingIds.has(r.id)); // Remove duplicates
          return [...prevRequests, ...filteredNew]; // Append the new unique requests to the existing ones
        });

        // Determine if there are more requests to load
        setHasMore(newRequests.length === LIMIT);
      } catch (error) {
        console.error("Error to fetch help requests:", error);
      }
      setLoading(false);
    };
    fetchRequests(location.latitude,location.longitude);
  },[offset,location]);


  // Signout button
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

  
  const handleAcceptRequest =async (requestId: number, elderlyId) => {
      try{
        const response = await axiosInstance.put("/volunteer/acceptRequest",
          {params: {
              requestId,
              elderlyId,
            },
            withCredentials: true
          }
         )
        if (response.data.success) {
          setActiveTab("Accepted_request");
      } else {
        console.error("Failed to accept the request:", response.data.message);
        alert("Failed to accept the request. Please try again.");
      }
    } catch (error) {
      console.error("Error accepting request:", error);
      alert("Error accepting request. Please try again.");
    }
  };

  // todo
  const handleViewRoute = (latitude: number, longitude: number) => {
    if (!location) {
      alert("Unable to get your current location.");
      return;
    }

    setSelectedRoute({
      from: { lat: location.latitude, lng: location.longitude },
      to: { lat: latitude, lng: longitude },
    });

    setActiveTab("route");
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive text-destructive-foreground";
      case "medium":
        return "bg-warning text-warning-foreground";
      case "low":
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
              
              <Button 
              variant="secondary" size="lg" 
              className="w-full bg-primary/20 hover:bg-primary/30 text-foreground"
              onClick={() => navigate("/request_filter")}>
                View All Requests
              </Button>

              <div className="space-y-4">
                {helpRequests.map((request, index) => (
                  <Card key={request.id} className="p-6 space-y-4" ref={helpRequests.length === index + 1 ? lastPostElementRef : null}>
                    <h4 className="text-lg font-semibold text-foreground">{request.title}</h4>
                    
                    <div className="flex gap-2">
                      <Badge className={getPriorityColor(request.urgency)}>
                        {request.urgency} Priority
                      </Badge>
                    </div>

                    <p className="text-foreground">{request.description}</p>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{request.address}</span>
                        <span className="ml-2">Distance: {Math.round(request.distance_meters)}m</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>{request.username}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">Required Skills:</p>
                      <div className="flex flex-wrap gap-2">
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button 
                        onClick={() => handleAcceptRequest(request.id, request.requesterid)}
                        className="flex-1 bg-success hover:bg-success/90"
                      >
                        <Check className="h-5 w-5 mr-2" />
                        Accept Request
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handleViewRoute(request.latitude, request.longitude)}
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

      case "Accepted_request":
        return <AcceptedRequest setActiveTab={setActiveTab}
                setSelectedRoute={setSelectedRoute}/>;
      
      case "Completed_request":
        return <CompletedRequest setActiveTab={setActiveTab}/>;

      case "profile":
        return <VolunteerProfile />;

      case "route":
        console.log(selectedRoute);
        if (!selectedRoute) return null;

        return (
          <VolunteerRoute
            selectedRoute={selectedRoute}
            from={selectedRoute.from}
            to={selectedRoute.to}
            onBack={() => setActiveTab("dashboard")}
          />
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
            { id: "Accepted_request", icon: HelpCircle, label: "Accepted request" },
            { id: "Completed_request", icon: HelpCircle, label: "Completed request"},
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
             activeTab === "Accepted_request" ? "Help Center" : 
             "Profile & Settings"}
          </h2>
        </div>
        {renderTabContent()}
      </div>
    </div>
  );
}
