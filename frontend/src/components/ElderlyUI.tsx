import { useState,useEffect, useRef } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Home, 
  HelpCircle, 
  MapPin, 
  Star, 
  User, 
  Volume2, 
  LogOut,
  Pin,
  Phone,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Camera,
  Copy,
  Share,
  Bus,
  Train,
  Navigation,
  Mail,
  Edit3,
  Eye,
  Ear,
  Heart,
  Brain,
  Accessibility
} from "lucide-react";
import { useNavigate  } from "react-router-dom";
import { axiosInstance } from "./axios";

export default function ElderlyUI() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("home");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [helpFormData, setHelpFormData] = useState({
    location: "",
    description: "",
    urgency: ""
  });
  const [showVolunteerMatch, setShowVolunteerMatch] = useState(false);
  const [routeFormData, setRouteFormData] = useState({
    from: "",
    to: ""
  });
	const [showRouteResults, setShowRouteResults] = useState(false);
	const [routeResults, setRouteResults] = useState<any[]>([]);
	const [googleLoaded, setGoogleLoaded] = useState(false);
	const fromInputRef = useRef<HTMLInputElement | null>(null);
	const toInputRef = useRef<HTMLInputElement | null>(null);

  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    language: "English",
    voiceAssistance: false,
    accessibilityNeeds: {
      wheelchair: false,
      visual: false,
      hearing: false,
      mobility: true,
      cognitive: false
    }
  });

  const stats = {
    totalRequests: 12,
    completed: 10,
    rating: 4.8,
    caregiversLinked: 2
  };

  const recentActivity = [
    {
      id: 1,
      type: "help_request",
      description: "Assistance with grocery shopping",
      status: "completed",
      time: "2 hours ago",
      volunteer: "Li Wei"
    },
    {
      id: 2,
      type: "route",
      description: "Route to Singapore General Hospital",
      status: "completed",
      time: "1 day ago"
    },
    {
      id: 3,
      type: "help_request",
      description: "Help with MRT navigation",
      status: "active",
      time: "3 days ago",
      volunteer: "Sarah Tan"
    }
  ];

  const caregiverPin = "284751";

  const handleHelpSubmit = () => {
    if (helpFormData.location && helpFormData.description && helpFormData.urgency) {
      setShowVolunteerMatch(true);
    }
  };
  useEffect(() =>{
    const fetchProfile = async()=>{
      try{
        const response = await axiosInstance.get('/profile/getId',
          { withCredentials: true }
        );
        const data = response.data.profile; 

        setProfileData({
          fullName: data.username || "",
          email: data.email || "",
          language: data.language || "English",  // Default to "English" if not available
          voiceAssistance: data.voiceAssistance || false,
          accessibilityNeeds: {
            wheelchair: data.accessibilityNeeds?.wheelchair || false,
            visual: data.accessibilityNeeds?.visual || false,
            hearing: data.accessibilityNeeds?.hearing || false,
            mobility: data.accessibilityNeeds?.mobility || true,  // Default to true if not available
            cognitive: data.accessibilityNeeds?.cognitive || false
          }
        });
      } catch (error) {
        console.error("Error fetching profile data:", error);
      }
    };
    fetchProfile();
    }, []);
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

  // to do soon enough
  const onRequestHelp = () =>{

    navigate('/request_help');
    
    
  }

	const onSmartRoutes = ()=>{
		setActiveTab("routes");
	}

  
	const handleRouteSearch = async () => {
		if (!routeFormData.from || !routeFormData.to) return;
		if (!googleLoaded || !(window as any).google) {
			setRouteResults(defaultRouteResults);
			setShowRouteResults(true);
			return;
		}

		const google = (window as any).google as typeof window.google;
		const directionsService = new google.maps.DirectionsService();
		try {
			const response = await directionsService.route({
				origin: routeFormData.from,
				destination: routeFormData.to,
				travelMode: google.maps.TravelMode.TRANSIT,
				provideRouteAlternatives: true
			});
			const parsed = (response.routes || []).map((r, idx) => {
				const leg = r.legs?.[0];
				const durationText = leg?.duration?.text || "";
				const summary = r.summary || leg?.steps?.map(s => s.instructions).join(" → ") || "Route";
				return {
					id: idx + 1,
					mode: "Transit",
					route: summary.replace(/<[^>]*>/g, ""),
					accessibility: "Public transport options may vary",
					time: durationText,
					icon: Train
				};
			});
			setRouteResults(parsed);
			setShowRouteResults(true);
		} catch (err) {
			console.error("Directions error", err);
			setShowRouteResults(true);
		}
	};

	// Load Google Maps JS API and attach Places Autocomplete to inputs
	useEffect(() => {
		let cancelled = false;
		const init = async () => {
			const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
			if (!apiKey) return;
			try {
				setOptions({ key: apiKey, v: "weekly", libraries: ["places"] });
				await importLibrary("places");
				if (cancelled) return;
				setGoogleLoaded(true);
				const google = (window as any).google as typeof window.google;
				if (fromInputRef.current) {
					const ac = new google.maps.places.Autocomplete(fromInputRef.current, {
						fields: ["formatted_address", "geometry", "place_id"],
					});
					ac.addListener("place_changed", () => {
						const place = ac.getPlace();
						console.log("[SmartRoute] From selected:", place?.formatted_address, place);
						setRouteFormData(prev => ({ ...prev, from: place.formatted_address || prev.from }));
					});
				}
				if (toInputRef.current) {
					const ac = new google.maps.places.Autocomplete(toInputRef.current, {
						fields: ["formatted_address", "geometry", "place_id"],
					});
					ac.addListener("place_changed", () => {
						const place = ac.getPlace();
						console.log("[SmartRoute] To selected:", place?.formatted_address, place);
						setRouteFormData(prev => ({ ...prev, to: place.formatted_address || prev.to }));
					});
				}
			} catch (err) {
				console.error("Failed to load Google Maps API", err);
			}
		};
		init();
		return () => { cancelled = true; };
	}, []);

  const volunteerData = {
    name: "Li Wei",
    phone: "+65 9876 5432",
    eta: "12 minutes",
    status: "On the way"
  };

  const defaultRouteResults = [
    {
      id: 1,
      mode: "Bus",
      route: "Bus 106 → Orchard MRT",
      accessibility: "Wheelchair accessible, covered walkway",
      time: "15 minutes",
      icon: Bus
    },
    {
      id: 2,
      mode: "MRT",
      route: "North-South Line to City Hall",
      accessibility: "Lift available, step-free access",
      time: "22 minutes",
      icon: Train
    },
    {
      id: 3,
      mode: "Walk",
      route: "Covered walkway via Wisma Atria",
      accessibility: "Covered, no stairs, rest points available",
      time: "8 minutes",
      icon: Navigation
    }
  ];

  const reviews = [
    {
      id: 1,
      volunteer: "Sarah Tan",
      date: "Nov 10, 2024",
      rating: 5,
      comment: "Very helpful with grocery shopping. Patient and kind."
    }
  ];

  const languages = ["English", "Mandarin", "Malay", "Tamil"];
  const accessibilityOptions = [
    { key: "wheelchair", label: "Wheelchair user", icon: Accessibility },
    { key: "visual", label: "Visual impairment", icon: Eye },
    { key: "hearing", label: "Hearing impairment", icon: Ear },
    { key: "mobility", label: "Mobility assistance", icon: Heart },
    { key: "cognitive", label: "Cognitive assistance", icon: Brain }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <div className="space-y-6">
            {/* Greeting and Controls */}
            <div className="bg-card rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 rounded-full p-3">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-card-foreground">
                      Welcome, {profileData.fullName}
                    </h2>
                    <p className="text-muted-foreground">How can we help you today?</p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant={voiceEnabled ? "success" : "outline"}
                  size="sm"
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className="flex-1"
                >
                  <Volume2 className="h-5 w-5" />
                  Voice {voiceEnabled ? "On" : "Off"}
                </Button>
                
                <Button variant="outline" size="sm" className="flex-1">
                  <Pin className="h-5 w-5" />
                  PIN: {caregiverPin}
                </Button>
                
                <Button variant="ghost" size="sm" onClick={onSignOut}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 text-center">
                <div className="text-3xl font-bold text-primary mb-1">
                  {stats.totalRequests}
                </div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
              </Card>
              
              <Card className="p-4 text-center">
                <div className="text-3xl font-bold text-success mb-1">
                  {stats.completed}
                </div>
                <p className="text-sm text-muted-foreground">Completed</p>
              </Card>
              
              <Card className="p-4 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="text-3xl font-bold text-warning">
                    {stats.rating}
                  </span>
                  <Star className="h-5 w-5 text-warning fill-current" />
                </div>
                <p className="text-sm text-muted-foreground">Rating</p>
              </Card>
              
              <Card className="p-4 text-center">
                <div className="text-3xl font-bold text-secondary mb-1">
                  {stats.caregiversLinked}
                </div>
                <p className="text-sm text-muted-foreground">Caregivers</p>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">Quick Actions</h3>
              
              <Button 
                onClick={onRequestHelp}
                variant="destructive"
                size="xl"
                className="w-full"
              >
                <HelpCircle className="h-6 w-6" />
                Request Help Now
              </Button>
              
              <Button 
                onClick={onSmartRoutes}
                variant="secondary"
                size="xl"
                className="w-full"
              >
                <MapPin className="h-6 w-6" />
                Plan Smart Route
              </Button>
            </div>

            {/* Recent Activity */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">Recent Activity</h3>
              
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <Card key={activity.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-card-foreground mb-1">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {activity.time}
                        </div>
                        {activity.volunteer && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Volunteer: {activity.volunteer}
                          </p>
                        )}
                      </div>
                      
                      <Badge 
                        variant={activity.status === "completed" ? "default" : 
                               activity.status === "active" ? "secondary" : "outline"}
                        className={
                          activity.status === "completed" ? "bg-success text-success-foreground" :
                          activity.status === "active" ? "bg-warning text-warning-foreground" :
                          ""
                        }
                      >
                        {activity.status === "completed" && <CheckCircle className="h-3 w-3 mr-1" />}
                        {activity.status === "active" && <AlertCircle className="h-3 w-3 mr-1" />}
                        {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                      </Badge>
                    </div>
                    
                    {activity.status === "active" && activity.volunteer && (
                      <div className="flex gap-2 mt-3">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Phone className="h-4 w-4" />
                          Call
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <MessageSquare className="h-4 w-4" />
                          Message
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          </div>
        );

      case "help":
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">Get Help</h2>
              <p className="text-lg text-muted-foreground">
                Request assistance from volunteers in your area
              </p>
            </div>

            {!showVolunteerMatch ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-lg font-medium">
                    Where do you need help?
                  </Label>
                  <Input
                    id="location"
                    value={helpFormData.location}
                    onChange={(e) => setHelpFormData({ ...helpFormData, location: e.target.value })}
                    className="h-14 text-lg"
                    placeholder="e.g., Orchard Road MRT"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-lg font-medium">
                    Describe what help you need
                  </Label>
                  <Textarea
                    id="description"
                    value={helpFormData.description}
                    onChange={(e) => setHelpFormData({ ...helpFormData, description: e.target.value })}
                    className="min-h-24 text-lg"
                    placeholder="Describe what help you need in detail..."
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-lg font-medium">Urgency Level</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: "low", label: "Low", variant: "outline" as const, color: "border-success text-success" },
                      { value: "medium", label: "Medium", variant: "outline" as const, color: "border-warning text-warning" },
                      { value: "high", label: "High", variant: "outline" as const, color: "border-destructive text-destructive" }
                    ].map((urgency) => (
                      <Button
                        key={urgency.value}
                        variant={helpFormData.urgency === urgency.value ? "default" : urgency.variant}
                        className={helpFormData.urgency === urgency.value ? "" : urgency.color}
                        onClick={() => setHelpFormData({ ...helpFormData, urgency: urgency.value })}
                      >
                        {urgency.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button variant="outline" size="lg" className="w-full">
                  <Camera className="h-5 w-5" />
                  Add Photo (Optional)
                </Button>

                <Button onClick={handleHelpSubmit} size="xl" className="w-full mt-8">
                  Submit Help Request
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <Card className="p-6 bg-success/5 border-success">
                  <div className="text-center mb-4">
                    <CheckCircle className="h-12 w-12 text-success mx-auto mb-2" />
                    <h3 className="text-2xl font-bold text-success">Volunteer Matched!</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Volunteer:</span>
                      <span className="text-lg">{volunteerData.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Phone:</span>
                      <Button variant="link" className="p-0 h-auto">
                        {volunteerData.phone}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">ETA:</span>
                      <span className="text-lg text-warning">{volunteerData.eta}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Status:</span>
                      <Badge variant="secondary" className="bg-warning text-warning-foreground">
                        {volunteerData.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button variant="outline" className="flex-1">
                      <Phone className="h-5 w-5" />
                      Call
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <MessageSquare className="h-5 w-5" />
                      Message
                    </Button>
                  </div>

                  <Button variant="secondary" size="lg" className="w-full mt-4">
                    Review Volunteer
                  </Button>
                </Card>

                <Button 
                  variant="outline" 
                  onClick={() => setShowVolunteerMatch(false)}
                  className="w-full"
                >
                  Request New Help
                </Button>
              </div>
            )}
          </div>
        );

      case "routes":
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">Smart Routes</h2>
              <p className="text-lg text-muted-foreground">
                Find accessible routes across Singapore
              </p>
            </div>

            {!showRouteResults ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="from" className="text-lg font-medium">
                    From
                  </Label>
                  <Input
                    id="from"
                    value={routeFormData.from}
                    onChange={(e) => setRouteFormData({ ...routeFormData, from: e.target.value })}
                    className="h-14 text-lg"
                    placeholder="Current location or address"
                    ref={fromInputRef}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="to" className="text-lg font-medium">
                    To
                  </Label>
                  <Input
                    id="to"
                    value={routeFormData.to}
                    onChange={(e) => setRouteFormData({ ...routeFormData, to: e.target.value })}
                    className="h-14 text-lg"
                    placeholder="Destination address"
                    ref={toInputRef}
                  />
                </div>

                <Button onClick={handleRouteSearch} size="xl" className="w-full mt-8">
                  <MapPin className="h-6 w-6" />
                  Find Accessible Routes
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-foreground">Route Options</h3>
                
                <div className="space-y-4">
                  {routeResults.map((route) => {
                    const Icon = route.icon;
                    return (
                      <Card key={route.id} className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="bg-primary/10 rounded-full p-3">
                            <Icon className="h-8 w-8 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-xl font-semibold text-foreground">{route.mode}</h4>
                              <span className="text-lg font-medium text-primary">{route.time}</span>
                            </div>
                            <p className="text-lg text-foreground mb-2">{route.route}</p>
                            <p className="text-muted-foreground">{route.accessibility}</p>
                          </div>
                        </div>
                        
                        <Button variant="outline" size="lg" className="w-full mt-4">
                          Select This Route
                        </Button>
                      </Card>
                    );
                  })}
                </div>

                <Button 
                  variant="outline" 
                  onClick={() => setShowRouteResults(false)}
                  className="w-full"
                >
                  Search New Route
                </Button>
              </div>
            )}
          </div>
        );

      case "reviews":
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">My Reviews</h2>
              <p className="text-lg text-muted-foreground">
                Reviews you've written for volunteers
              </p>
            </div>

            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Card key={review.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-xl font-semibold text-foreground">{review.volunteer}</h4>
                        <p className="text-muted-foreground">{review.date}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-5 w-5 ${i < review.rating ? 'text-warning fill-current' : 'text-muted-foreground'}`} 
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-foreground">{review.comment}</p>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Star className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-xl text-muted-foreground">No reviews yet</p>
                <p className="text-muted-foreground mt-2">
                  Complete help requests to leave reviews for volunteers
                </p>
              </div>
            )}
          </div>
        );

      case "profile":
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">Profile Settings</h2>
              <p className="text-lg text-muted-foreground">
                Manage your account and preferences
              </p>
            </div>

            {/* Personal Information */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">Personal Information</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-lg font-medium">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    value={profileData.fullName}
                    onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                    className="h-12 text-lg"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-lg font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="h-12 text-lg"
                  />
                </div>
              </div>
            </Card>

            {/* Linking PIN */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">Caregiver Linking PIN</h3>
              <div className="bg-muted/50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-mono font-bold text-primary">{caregiverPin}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <p className="text-muted-foreground">
                Share this PIN with your caregivers to link your accounts
              </p>
            </Card>

            {/* Accessibility & Preferences */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">Accessibility & Preferences</h3>
              
              <div className="space-y-6">
                {/* Language Preference */}
                <div className="space-y-3">
                  <Label className="text-lg font-medium">Language Preference</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {languages.map((lang) => (
                      <Button
                        key={lang}
                        variant={profileData.language === lang ? "default" : "outline"}
                        onClick={() => setProfileData({ ...profileData, language: lang })}
                      >
                        {lang}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Voice Assistance */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-lg font-medium">Voice Assistance</Label>
                    <p className="text-muted-foreground">Enable voice commands and audio feedback</p>
                  </div>
                  <Switch
                    checked={profileData.voiceAssistance}
                    onCheckedChange={(checked) => setProfileData({ ...profileData, voiceAssistance: checked })}
                  />
                </div>

                {/* Accessibility Needs */}
                <div className="space-y-3">
                  <Label className="text-lg font-medium">Accessibility Needs</Label>
                  <div className="space-y-3">
                    {accessibilityOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <Card
                          key={option.key}
                          className={`p-4 cursor-pointer transition-all border-2 ${
                            profileData.accessibilityNeeds[option.key as keyof typeof profileData.accessibilityNeeds]
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                          onClick={() => setProfileData({
                            ...profileData,
                            accessibilityNeeds: {
                              ...profileData.accessibilityNeeds,
                              [option.key]: !profileData.accessibilityNeeds[option.key as keyof typeof profileData.accessibilityNeeds]
                            }
                          })}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="h-6 w-6 text-primary" />
                            <span className="text-lg font-medium">{option.label}</span>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>

            <Button size="xl" className="w-full">
              <Edit3 className="h-6 w-6" />
              Save Settings
            </Button>
          </div>
        );
      
      default:
        return (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} - Coming Soon
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <div className="px-6 py-8 pb-24">
        {renderTabContent()}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg">
        <div className="flex justify-around py-3">
          {[
            { id: "home", icon: Home, label: "Home" },
            { id: "help", icon: HelpCircle, label: "Get Help" },
            { id: "routes", icon: MapPin, label: "Smart Routes" },
            { id: "reviews", icon: Star, label: "My Reviews" },
            { id: "profile", icon: User, label: "Profile" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-6 w-6" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}