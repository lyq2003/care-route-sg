import { useState, useEffect, useRef } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';
import {
  Home,
  HelpCircle,
  MapPin,
  Star,
  User,
  LogOut,
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
  Accessibility,
  Car,
  Bike,
  Flag
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "./axios";
import RouteTracking from "./RouteTracking";

export default function ElderlyUI() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { t, i18n } = useTranslation()
  const [activeTab, setActiveTab] = useState("home");

  const handleSetActiveTab = (newTab) => {
    setActiveTab(newTab);

    if (newTab == "help") {
      navigate('/request_help');

    }

  };

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
  const [linkingPin, setLinkingPin] = useState(0);
  const [showRouteResults, setShowRouteResults] = useState(false);
  const [routeResults, setRouteResults] = useState<any[]>([]);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const fromInputRef = useRef<HTMLInputElement | null>(null);
  const toInputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const [fromPredictions, setFromPredictions] = useState<Array<{ description: string; place_id: string }>>([]);
  const [toPredictions, setToPredictions] = useState<Array<{ description: string; place_id: string }>>([]);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [showRouteTracking, setShowRouteTracking] = useState(false);
  const [routeHistory, setRouteHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([/* 
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
      time: "1 day ago",
      mode: "MRT + Bus",
      duration: "25 mins",
      accessibility: "Wheelchair accessible"
    },
    {
      id: 3,
      type: "help_request",
      description: "Help with MRT navigation",
      status: "active",
      time: "3 days ago",
      volunteer: "Sarah Tan"
    } */
  ]);

  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    language: "English",
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


  //const caregiverPin = "284751";

  const languages = [
    { code: "en", name: "English" },
    { code: "zh", name: "Mandarin" },
    { code: "ms", name: "Malay" },
    { code: "ta", name: "Tamil" }
  ];

  const handleHelpSubmit = () => {
    if (helpFormData.location && helpFormData.description && helpFormData.urgency) {
      setShowVolunteerMatch(true);
    }
  };
  useEffect(() => {

    const fetchProfile = async () => {
      try {
        const response = await axiosInstance.get('/profile/getId',
          { withCredentials: true }
        );


        const data = response.data.profile;

        // Determine current language code
        let currentLanguageCode = 'en'; // Default to English
        let currentLanguageName = 'English';

        if (data.language_preference) {
          // User has a stored language preference (language code)
          currentLanguageCode = data.language_preference;
          const langObj = languages.find(lang => lang.code === data.language_preference);
          currentLanguageName = langObj ? langObj.name : 'English';
        } else if (data.language) {
          // Backward compatibility: user has old language name stored
          const langObj = languages.find(lang => lang.name === data.language);
          if (langObj) {
            currentLanguageCode = langObj.code;
            currentLanguageName = langObj.name;
          }
        }


        var userAssessibilityNeeds = data.user_accessibility_needs[0]


        setProfileData({
          fullName: data.username || "",
          email: data.email || "",
          language: currentLanguageName,
          accessibilityNeeds: {
            wheelchair: userAssessibilityNeeds.wheelchair,
            visual: userAssessibilityNeeds.visual,
            hearing: userAssessibilityNeeds.hearing,
            mobility: userAssessibilityNeeds.mobility,
            cognitive: userAssessibilityNeeds.cognitive
          }
        });





        // Set i18n language
        i18n.changeLanguage(currentLanguageCode);
      } catch (error) {
        console.error("Error fetching profile data:", error);
      }
    };
    fetchProfile();
  }, [i18n]);
  const onSignOut = async () => {
    try {
      await axiosInstance.post(`/auth/logout`, {}, {
        withCredentials: true,
      });
      window.location.href = '/login'; // Force full refresh
    } catch (err) {
      console.error('Logout failed:', err);
      alert(t('notifications.logoutFailed'));
    }
  }

  // to do soon enough
  const onRequestHelp = () => {

    navigate('/request_help');


  }

  const onSmartRoutes = () => {
    setActiveTab("routes");
  }

  const fetchRouteHistory = async () => {
    console.log('🔄 fetchRouteHistory called');
    setLoadingHistory(true);
    try {
      console.log('📡 Making API call to /elderly/route-history');
      const response = await axiosInstance.get('/elderly/route-history');
      console.log('✅ API response received:', response.data);
      const history = response.data.history || [];
      console.log('📊 Route history data:', history);
      setRouteHistory(history);

      // Update recent activity with route history data
      console.log('🔄 Updating recent activity with route history');
      updateRecentActivityFromRouteHistory(history);
    } catch (error) {
      console.error('❌ Error fetching route history:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoadingHistory(false);
    }
  };


  const formatDate = (dateString) => {
    const options: Intl.DateTimeFormatOptions = {
      /* weekday: "long", */
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString(undefined, options)
  }


  const fetchLinkingPin = async () => {
    console.log("Fetching linking pin");

    try {
      const response = await axiosInstance.get('/elderly/linking-pin');

      console.log(response);

      var pin = response.data.pin;

      setLinkingPin(pin);



    } catch (error) {
      console.error('Error details:', error.response?.data);

    }

  }


  const fetchRecentActivity = async () => {
    console.log("fetchRecentActivity");

    try {

      var token = localStorage.getItem("auth-storage");

      var tokenJSON = JSON.parse(token);

      var elderlyID = tokenJSON.state.authUser.id;

      const response = await axiosInstance.get('/elderly/recentActivity/' + elderlyID);

      var data = response.data.data;

      console.log(data);


      var tempRecentActivityArr = [];

      for (let i = 0; i < data.length; i++) {

        var activityObj = {
          "id": data[i].id,
          "type": "help_request",
          "description": data[i].description,
          "status": data[i].help_request_status.statusName,
          "time": data[i].createdAt,
          "volunteer": data[i].help_request_assignedVolunteerId_fkey.username,
          "volunteerID": data[i].help_request_assignedVolunteerId_fkey.user_id,
          "phone_number": data[i].help_request_assignedVolunteerId_fkey.phone_number
        }

        tempRecentActivityArr.push(activityObj);

      }

      setRecentActivity(tempRecentActivityArr);

    } catch (error) {
      console.error('Error details:', error);

    }

  }

  const fetchReviews = async () => {
    console.log("fetchReviews");

    try {

      const response = await axiosInstance.get('/reviews/me/');

      var data = response.data.data;

      //console.log(data);




      var tempReviewsArr = [];

      for (let i = 0; i < data.length; i++) {

        var reviewObj = {
          "id": data[i].id,
          "volunteer": data[i].reviews_recipient_user_id_fkey1.username,
          "date": data[i].created_at,
          "rating": data[i].rating,
          "comment": data[i].text
        }

        tempReviewsArr.push(reviewObj);

      }


      setReviews(tempReviewsArr);

    } catch (error) {
      console.error('Error details:', error);

    }

  }

  const updateRecentActivityFromRouteHistory = (routeHistory) => {
    console.log('🔄 updateRecentActivityFromRouteHistory called with:', routeHistory);

    // Convert route history to recent activity format
    const routeActivities = routeHistory.map((route, index) => ({
      id: `route_${route.id}`,
      type: "route",
      description: `Route completed: ${route.from} → ${route.to}`,
      status: "completed",
      time: getTimeAgo(route.completedAt),
      mode: route.mode,
      duration: route.duration,
      accessibility: route.accessibility,
      isRecommended: route.isRecommended
    }));

    console.log('📋 Converted route activities:', routeActivities);

    // Keep existing non-route activities and add route activities
    setRecentActivity(prev => {
      console.log('📋 Previous recent activity:', prev);
      const nonRouteActivities = prev.filter(activity => activity.type !== "route");
      const newActivity = [...routeActivities, ...nonRouteActivities].slice(0, 10); // Limit to 10 most recent
      console.log('📋 New recent activity:', newActivity);
      return newActivity;
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;

    return date.toLocaleDateString();
  };

  const handleDeleteRoute = async (routeId: number) => {
    try {
      await axiosInstance.delete(`/api/elderly/route-history/${routeId}`);

      // Update local state
      setRouteHistory(prev => prev.filter(route => route.id !== routeId));

      // Update recent activity by removing the deleted route
      setRecentActivity(prev => prev.filter(activity => activity.id !== `route_${routeId}`));

      // Show success message
      toast({
        title: "Route Deleted",
        description: "Route has been removed from your history.",
      });
    } catch (error) {
      console.error('Error deleting route:', error);
      toast({
        title: "Error",
        description: "Failed to delete route. Please try again.",
        variant: "destructive",
      });
    }
  };

  const addRouteCompletionActivity = (route: any) => {
    console.log('Adding route completion activity:', route);

    // Add the new route completion activity immediately
    const newActivity = {
      id: `route_${Date.now()}`,
      type: "route",
      description: `Route completed: ${route.from} → ${route.to}`,
      status: "completed",
      time: "Just now",
      mode: route.mode,
      duration: route.duration,
      accessibility: route.accessibility,
      isRecommended: route.isRecommended
    };

    setRecentActivity(prev => {
      // Remove any existing active navigation for this route
      const filteredActivities = prev.filter(activity =>
        !(activity.type === "route" &&
          activity.status === "active" &&
          activity.description === `Navigating: ${route.from} → ${route.to}`)
      );

      // Add the new completion activity at the top
      return [newActivity, ...filteredActivities].slice(0, 10);
    });

    // Refresh route history to get the latest data from database
    fetchRouteHistory();
  };

  const addNavigationStartedActivity = (route: any) => {
    console.log('Adding navigation started activity:', route);

    const newActivity = {
      id: Date.now(), // Simple ID generation
      type: "route",
      description: `Navigating: ${route.from} → ${route.to}`,
      status: "active",
      time: "Just now",
      mode: route.mode,
      duration: route.duration,
      accessibility: route.accessibility,
      routeId: `${route.from}-${route.to}-${route.startedAt}`, // Unique identifier for this navigation
      from: route.from,
      to: route.to,
      selectedRoute: selectedRoute // Store the selected route for navigation
    };

    console.log('New navigation activity created:', newActivity);
    setRecentActivity(prev => [newActivity, ...prev.slice(0, 9)]); // Keep only 10 most recent
  };

  const handleActiveNavigationClick = (activity: any) => {
    console.log('Clicked on active navigation:', activity);

    // Set the route form data
    setRouteFormData({
      from: activity.from,
      to: activity.to
    });

    // Set the selected route if available
    if (activity.selectedRoute) {
      setSelectedRoute(activity.selectedRoute);
    } else {
      // Create a basic route object if not available
      const basicRoute = {
        id: 1,
        mode: activity.mode || "Transit",
        route: `${activity.from} to ${activity.to}`,
        accessibility: activity.accessibility || "Standard",
        time: activity.duration || "Unknown",
        icon: Bus, // Default icon
        durationMinutes: 0,
        accessibilityScore: 0,
        isRecommended: false
      };
      setSelectedRoute(basicRoute);
    }

    // Navigate to route tracking
    setShowRouteTracking(true);
  };

  const handleRouteSelection = (route: any) => {
    setSelectedRoute(route);
    setShowRouteTracking(true);
  };

  const clearSmartRouteForm = () => {
    // Clear smart route form
    setRouteFormData({
      from: "",
      to: ""
    });
    // Clear route results
    setRouteResults([]);
    setShowRouteResults(false);
    // Clear autocomplete predictions
    setFromPredictions([]);
    setToPredictions([]);
  };

  const handleBackFromTracking = () => {
    setShowRouteTracking(false);
    setSelectedRoute(null);
    // Clear smart route form
    clearSmartRouteForm();
    // Refresh route history when returning from route tracking
    fetchRouteHistory();
  };

  const logPredictions = (query: string, fieldLabel: string) => {
    if (!query || !query.trim()) return;
    const service = autocompleteServiceRef.current;
    if (!googleLoaded || !(window as any).google || !service) return;
    service.getPlacePredictions(
      { input: query, componentRestrictions: { country: "sg" } as any },
      (predictions: google.maps.places.AutocompletePrediction[] | null) => {
        const brief = (predictions || []).map(p => ({ description: p.description, place_id: p.place_id }));
        if (fieldLabel === "From") setFromPredictions(brief);
        if (fieldLabel === "To") setToPredictions(brief);
      }
    );
  };

  const getTransportMode = (route: google.maps.DirectionsRoute) => {
    const steps = route.legs?.[0]?.steps || [];
    const modes = new Set<string>();

    steps.forEach(step => {
      const travelMode = step.travel_mode;
      const instructions = step.instructions?.toLowerCase() || "";

      if (travelMode === google.maps.TravelMode.TRANSIT) {
        if (instructions.includes('bus') || instructions.includes('巴士')) {
          modes.add('Bus');
        } else if (instructions.includes('mrt') || instructions.includes('地铁') || instructions.includes('train')) {
          modes.add('MRT');
        } else if (instructions.includes('taxi') || instructions.includes('grab')) {
          modes.add('Taxi');
        } else {
          modes.add('Transit');
        }
      } else if (travelMode === google.maps.TravelMode.WALKING) {
        modes.add('Walk');
      } else if (travelMode === google.maps.TravelMode.DRIVING) {
        modes.add('Drive');
      } else if (travelMode === google.maps.TravelMode.BICYCLING) {
        modes.add('Bike');
      }
    });

    // Handle mixed modes
    const modeArray = Array.from(modes);
    if (modeArray.length > 1) {
      // If multiple modes, create a combined description
      const primaryModes = modeArray.filter(mode => mode !== 'Walk' && mode !== 'Transit');
      if (primaryModes.length > 0) {
        return primaryModes.join(' + ');
      }
      return modeArray.join(' + ');
    }

    // Return the primary mode
    if (modes.has('MRT')) return 'MRT';
    if (modes.has('Bus')) return 'Bus';
    if (modes.has('Transit')) return 'Transit';
    if (modes.has('Walk')) return 'Walk';
    if (modes.has('Drive')) return 'Drive';
    if (modes.has('Bike')) return 'Bike';
    if (modes.has('Taxi')) return 'Taxi';

    return 'Transit';
  };

  const calculateAccessibilityScore = (route: google.maps.DirectionsRoute) => {
    const steps = route.legs?.[0]?.steps || [];
    let score = 0;
    let accessibilityFeatures = [];

    steps.forEach(step => {
      const instructions = step.instructions?.toLowerCase() || "";
      const travelMode = step.travel_mode;

      // MRT gets highest score for accessibility
      if (travelMode === google.maps.TravelMode.TRANSIT &&
        (instructions.includes('mrt') || instructions.includes('地铁') || instructions.includes('train'))) {
        score += 10;
        accessibilityFeatures.push('Lift available');
      }

      // Bus gets good score
      if (travelMode === google.maps.TravelMode.TRANSIT &&
        (instructions.includes('bus') || instructions.includes('巴士'))) {
        score += 7;
        accessibilityFeatures.push('Wheelchair accessible');
      }

      // Walking gets lower score but check for accessibility features
      if (travelMode === google.maps.TravelMode.WALKING) {
        score += 3;
        if (instructions.includes('covered') || instructions.includes('walkway')) {
          score += 2;
          accessibilityFeatures.push('Covered walkway');
        }
        if (instructions.includes('lift') || instructions.includes('elevator')) {
          score += 3;
          accessibilityFeatures.push('Lift available');
        }
      }

      // Taxi/Drive gets medium score for door-to-door
      if (travelMode === google.maps.TravelMode.DRIVING ||
        (travelMode === google.maps.TravelMode.TRANSIT &&
          (instructions.includes('taxi') || instructions.includes('grab')))) {
        score += 8;
        accessibilityFeatures.push('Door-to-door service');
      }

      // Check for specific accessibility keywords
      if (instructions.includes('wheelchair') || instructions.includes('accessible')) {
        score += 5;
        accessibilityFeatures.push('Wheelchair friendly');
      }
      if (instructions.includes('step-free') || instructions.includes('no stairs')) {
        score += 4;
        accessibilityFeatures.push('Step-free access');
      }
      if (instructions.includes('rest') || instructions.includes('seating')) {
        score += 2;
        accessibilityFeatures.push('Rest points available');
      }
    });

    return { score, features: [...new Set(accessibilityFeatures)] };
  };

  const parseDurationToMinutes = (durationText: string) => {
    const match = durationText.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  const getModeIcon = (mode: string) => {
    // Handle mixed modes by returning the primary mode icon
    if (mode.includes(' + ')) {
      const primaryMode = mode.split(' + ')[0];
      return getModeIcon(primaryMode);
    }

    switch (mode) {
      case 'Bus': return Bus;
      case 'MRT': return Train;
      case 'Walk': return Navigation;
      case 'Drive': return Car;
      case 'Bike': return Bike;
      case 'Taxi': return Car;
      default: return Train;
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location services.",
        variant: "destructive"
      });
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });

        // Convert coordinates to address using Geocoding API
        if (googleLoaded && (window as any).google) {
          const google = (window as any).google as typeof window.google;
          const geocoder = new google.maps.Geocoder();

          try {
            const results = await geocoder.geocode({
              location: { lat: latitude, lng: longitude }
            });

            if (results.results && results.results.length > 0) {
              const address = results.results[0].formatted_address;
              setRouteFormData(prev => ({ ...prev, from: address }));
              toast({
                title: "Location set",
                description: "Current location has been set as starting point."
              });
            }
          } catch (error) {
            console.error('Geocoding error:', error);
            toast({
              title: "Error",
              description: "Could not convert location to address.",
              variant: "destructive"
            });
          }
        } else {
          // Fallback to coordinates if geocoding not available
          setRouteFormData(prev => ({ ...prev, from: `${latitude}, ${longitude}` }));
          toast({
            title: "Location set",
            description: "Using coordinates as location."
          });
        }

        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsGettingLocation(false);
        toast({
          title: "Location error",
          description: error.message || "Could not get your current location.",
          variant: "destructive"
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

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
        const detectedMode = getTransportMode(r);
        const modeIcon = getModeIcon(detectedMode);
        const accessibilityData = calculateAccessibilityScore(r);
        const durationMinutes = parseDurationToMinutes(durationText);

        // Generate accessibility info based on detected features
        let accessibility = accessibilityData.features.length > 0
          ? accessibilityData.features.join(", ")
          : "Public transport options may vary";

        // Add accessibility score for sorting
        const accessibilityScore = accessibilityData.score;

        return {
          id: idx + 1,
          mode: detectedMode,
          route: summary.replace(/<[^>]*>/g, ""),
          accessibility: accessibility,
          time: durationText,
          icon: modeIcon,
          durationMinutes: durationMinutes,
          accessibilityScore: accessibilityScore,
          isRecommended: false // Will be set after sorting
        };
      });

      // Sort routes by accessibility score (descending) then by time (ascending)
      const sortedRoutes = parsed.sort((a, b) => {
        // First priority: accessibility score (higher is better)
        if (b.accessibilityScore !== a.accessibilityScore) {
          return b.accessibilityScore - a.accessibilityScore;
        }
        // Second priority: duration (shorter is better)
        return a.durationMinutes - b.durationMinutes;
      });

      // Mark the top 2 routes as recommended
      sortedRoutes.forEach((route, index) => {
        if (index < 2) {
          route.isRecommended = true;
        }
      });

      setRouteResults(sortedRoutes);
      setShowRouteResults(true);
    } catch (err) {
      console.error("Directions error", err);
      setShowRouteResults(true);
    }
  };


  const handleAddReview = (helpRequestID, volunteerID) => {
    navigate('/add_review', {
      state: {
        helpRequestID: helpRequestID,
        volunteerID: volunteerID
      }
    });
  }

  // Load Google Maps JS API and attach Places Autocomplete to inputs
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
      if (!apiKey) {
        console.error("[Google Maps] No API key found");
        return;
      }
      try {
        setOptions({ key: apiKey, v: "weekly", libraries: ["places"] });
        await importLibrary("places");
        if (cancelled) return;
        setGoogleLoaded(true);
        const google = (window as any).google as typeof window.google;
        autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
        // Note: We're not using Google's native Autocomplete widget to avoid default styling
        // Instead, we use our custom dropdown with the AutocompleteService for suggestions
      } catch (err) {
        console.error("Failed to load Google Maps API", err);
      }
    };
    init();
    return () => { cancelled = true; };
  }, []);

  // Fetch route history on component mount
  useEffect(() => {
    fetchRouteHistory();
    fetchLinkingPin();
    fetchRecentActivity();
    fetchReviews();
  }, []);

  // Clean duplicates when recent activity updates (only once per update)
  useEffect(() => {
    if (recentActivity.length > 0) {
      removeDuplicateActivities();
    }
  }, [recentActivity.length]);

  // Debug recent activity changes
  useEffect(() => {
    console.log('Recent activity state changed:', recentActivity);
  }, [recentActivity]);

  // Function to remove duplicate activities
  const removeDuplicateActivities = () => {
    setRecentActivity(prev => {
      const unique = prev.filter((activity, index, self) =>
        index === self.findIndex(a =>
          a.type === activity.type &&
          a.description === activity.description &&
          a.time === activity.time
        )
      );
      return unique;
    });
  };


  const volunteerData = {
    name: "Li Wei",
    phone: "+65 9876 5432",
    eta: "12 minutes",
    status: "On the way"
  };

  const defaultRouteResults = [
    {
      id: 1,
      mode: "MRT",
      route: "North-South Line to City Hall",
      accessibility: "Lift available, step-free access",
      time: "22 minutes",
      icon: Train,
      durationMinutes: 22,
      accessibilityScore: 10,
      isRecommended: true
    },
    {
      id: 2,
      mode: "Bus",
      route: "Bus 106 → Orchard MRT",
      accessibility: "Wheelchair accessible, covered walkway",
      time: "15 minutes",
      icon: Bus,
      durationMinutes: 15,
      accessibilityScore: 7,
      isRecommended: true
    },
    {
      id: 3,
      mode: "Walk",
      route: "Covered walkway via Wisma Atria",
      accessibility: "Covered, no stairs, rest points available",
      time: "8 minutes",
      icon: Navigation,
      durationMinutes: 8,
      accessibilityScore: 5,
      isRecommended: false
    }
  ];


  const handleUserAccessibilityNeedChange = async (need, currentValue) => {

    // Update in backend
    try {

      const response = await axiosInstance.put('/userAccessibilityNeeds/update', {
        need: need,
        currentValue: currentValue
      }, { withCredentials: true });

      console.log(response);

      setProfileData({...profileData, accessibilityNeeds: {...profileData.accessibilityNeeds, [need]: !profileData.accessibilityNeeds[need]}})



    } catch (error) {
      console.error('Error details:', error);

    }



  }

  // Handle language change
  const handleLanguageChange = async (languageCode: string) => {
    try {
      // Get the language name for display
      const languageName = languages.find(lang => lang.code === languageCode)?.name || "English";

      // Change the i18n language first
      await i18n.changeLanguage(languageCode);

      // Update the profile data state
      setProfileData(prev => ({
        ...prev,
        language: languageName
      }));

      // Save to backend
      await axiosInstance.put('/elderly/profile/language', {
        language: languageCode
      }, { withCredentials: true });

      // Show success message in the NEW language (target language)
      const successMessages = {
        'en': `Language changed to ${languageName}`,
        'zh': `语言已更改为${languageName}`,
        'ms': `Bahasa ditukar kepada ${languageName}`,
        'ta': `மொழி ${languageName} ஆக மாற்றப்பட்டது`
      };

      const successTitles = {
        'en': 'Success',
        'zh': '成功',
        'ms': 'Berjaya',
        'ta': 'வெற்றி'
      };

      toast({
        title: successTitles[languageCode] || successTitles['en'],
        description: successMessages[languageCode] || successMessages['en'],
      });
    } catch (error) {
      console.error('Error updating language:', error);

      // Get error message in the target language (the one user tried to switch to)
      const errorMessages = {
        'en': 'Failed to update language preference',
        'zh': '更新语言偏好失败',
        'ms': 'Gagal mengemaskini keutamaan bahasa',
        'ta': 'மொழி விருப்பத்தை புதுப்பிக்க முடியவில்லை'
      };

      const errorTitles = {
        'en': 'Error',
        'zh': '错误',
        'ms': 'Ralat',
        'ta': 'பிழை'
      };

      toast({
        title: errorTitles[languageCode] || errorTitles['en'],
        description: errorMessages[languageCode] || errorMessages['en'],
        variant: "destructive"
      });
    }
  };
  const accessibilityOptions = [
    { key: "wheelchair", label: t('profile.wheelchairUser'), icon: Accessibility },
    { key: "visual", label: t('profile.visualImpairment'), icon: Eye },
    { key: "hearing", label: t('profile.hearingImpairment'), icon: Ear },
    { key: "mobility", label: t('profile.mobilityAssistance'), icon: Heart },
    { key: "cognitive", label: t('profile.cognitiveAssistance'), icon: Brain }
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
                      {t('home.welcome', { name: profileData.fullName })}
                    </h2>
                    <p className="text-muted-foreground">{t('home.howCanWeHelp')}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(linkingPin.toString());
                    toast({
                      title: t('notifications.pinCopied'),
                      description: t('notifications.pinCopiedDescription'),
                    });
                  }}
                  className="flex-1"
                >
                  <Copy className="h-5 w-5 mr-2" />
                  PIN: {linkingPin}
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
                <p className="text-sm text-muted-foreground">{t('home.totalRequests')}</p>
              </Card>

              <Card className="p-4 text-center">
                <div className="text-3xl font-bold text-success mb-1">
                  {stats.completed}
                </div>
                <p className="text-sm text-muted-foreground">{t('home.completed')}</p>
              </Card>

              <Card className="p-4 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="text-3xl font-bold text-warning">
                    {stats.rating}
                  </span>
                  <Star className="h-5 w-5 text-warning fill-current" />
                </div>
                <p className="text-sm text-muted-foreground">{t('home.rating')}</p>
              </Card>

              <Card className="p-4 text-center">
                <div className="text-3xl font-bold text-secondary mb-1">
                  {stats.caregiversLinked}
                </div>
                <p className="text-sm text-muted-foreground">{t('home.caregivers')}</p>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">{t('home.quickActions')}</h3>

              <Button
                onClick={onRequestHelp}
                variant="destructive"
                size="xl"
                className="w-full"
              >
                <HelpCircle className="h-6 w-6" />
                {t('home.requestHelpNow')}
              </Button>

              <Button
                onClick={onSmartRoutes}
                variant="secondary"
                size="xl"
                className="w-full"
              >
                <MapPin className="h-6 w-6" />
                {t('home.planSmartRoute')}
              </Button>
            </div>

            {/* Recent Routes */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-foreground">{t('home.recentRoutes')}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchRouteHistory}
                  disabled={loadingHistory}
                >
                  {loadingHistory ? t('common.loading') : t('common.refresh')}
                </Button>
              </div>

              {loadingHistory ? (
                <Card className="p-4 text-center">
                  <p className="text-muted-foreground">{t('home.loadingRouteHistory')}</p>
                </Card>
              ) : routeHistory.length > 0 ? (
                <div className="space-y-3">
                  {routeHistory.slice(0, 3).map((route) => (
                    <Card key={route.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span className="font-medium text-card-foreground">
                              {route.from} → {route.to}
                            </span>
                            {route.isRecommended && (
                              <Badge variant="default" className="text-xs">
                                Recommended
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {route.duration}
                            </span>
                            <span className="flex items-center gap-1">
                              <Bus className="h-3 w-3" />
                              {route.mode}
                            </span>
                            <span className="flex items-center gap-1">
                              <Accessibility className="h-3 w-3" />
                              {route.accessibility}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Completed {new Date(route.completedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setRouteFormData({
                                from: route.from,
                                to: route.to
                              });
                              setActiveTab("routes");
                            }}
                          >
                            Repeat
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteRoute(route.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-4 text-center">
                  <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No recent routes found</p>
                  <p className="text-sm text-muted-foreground">Complete a route to see it here</p>
                </Card>
              )}
            </div>

            {/* Recent Activity */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-foreground">Recent Activity</h3>
              </div>

              {recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <Card
                      key={activity.id}
                      className={`p-4 ${activity.type === "route" && activity.status === "active"
                        ? "cursor-pointer hover:bg-accent/50 transition-colors"
                        : ""
                        }`}
                      onClick={() => {
                        if (activity.type === "route" && activity.status === "active") {
                          handleActiveNavigationClick(activity);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {activity.type === "route" ? (
                              <MapPin className="h-4 w-4 text-primary" />
                            ) : (
                              <HelpCircle className="h-4 w-4 text-orange-500" />
                            )}
                            <p className="font-medium text-card-foreground">
                              {activity.description}
                            </p>
                            {activity.type === "route" && activity.status === "active" && (
                              <span className="text-xs text-primary font-medium">
                                (Click to continue)
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {formatDate(activity.time)}
                          </div>
                          {activity.type === "route" && activity.mode && (
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Bus className="h-3 w-3" />
                                {activity.mode}
                              </span>
                              {activity.duration && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {activity.duration}
                                </span>
                              )}
                              {activity.accessibility && (
                                <span className="flex items-center gap-1">
                                  <Accessibility className="h-3 w-3" />
                                  {activity.accessibility}
                                </span>
                              )}
                            </div>
                          )}
                          {activity.volunteer && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Volunteer: {activity.volunteer}
                            </p>
                          )}
                        </div>

                        <Badge
                          variant={activity.status === "completed" || activity.status === "Resolved" ? "default" :
                            activity.status === "active" || activity.status === "In Progress" ? "secondary" : "outline"}
                          className={
                            activity.status === "completed" || activity.status === "Resolved" ? "bg-success text-success-foreground" :
                              activity.status === "active" || activity.status === "In Progress" ? "bg-warning text-warning-foreground" :
                                ""
                          }
                        >
                          {(activity.status === "completed" || activity.status === "Resolved") && <CheckCircle className="h-3 w-3 mr-1" />}
                          {(activity.status === "active" || activity.status === "In Progress") && <AlertCircle className="h-3 w-3 mr-1" />}
                          {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                        </Badge>
                      </div>

                      {activity.status === "active" || activity.status === "In Progress" && activity.volunteer && (
                        <div className="flex gap-2 mt-3">
                          <p className="text-sm mt-1">
                            Phone Number: {activity.phone_number}
                          </p>

                        </div>
                      )}

                      {(activity.status === "Resolved" || activity.status === "completed") && (
                        <div className="flex gap-2 mt-3">
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => handleAddReview(activity.id, activity.volunteerID)}>
                            <Star className="h-4 w-4" />
                            Review
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Flag className="h-4 w-4" />
                            Report
                          </Button>


                        </div>
                      )}

                      {activity.type === "route" && activity.status === "active" && (
                        <div className="mt-3">
                          <Button
                            variant="default"
                            size="sm"
                            className="w-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleActiveNavigationClick(activity);
                            }}
                          >
                            <MapPin className="h-4 w-4 mr-2" />
                            Continue Navigation
                          </Button>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (

                <Card className="p-4 text-center">
                  <div className="text-center py-6">
                    <p className="text-xl text-muted-foreground">{t('home.noRecentActivity')}</p>
                  </div>
                </Card>

              )}







            </div>
          </div>
        );

      case "help":
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">{t('help.getHelp')}</h2>
              <p className="text-lg text-muted-foreground">
                {t('help.requestAssistance')}
              </p>
            </div>

            {!showVolunteerMatch ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-lg font-medium">
                    {t('help.whereNeedHelp')}
                  </Label>
                  <Input
                    id="location"
                    value={helpFormData.location}
                    onChange={(e) => setHelpFormData({ ...helpFormData, location: e.target.value })}
                    className="h-14 text-lg"
                    placeholder={t('help.locationPlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-lg font-medium">
                    {t('help.describeHelp')}
                  </Label>
                  <Textarea
                    id="description"
                    value={helpFormData.description}
                    onChange={(e) => setHelpFormData({ ...helpFormData, description: e.target.value })}
                    className="min-h-24 text-lg"
                    placeholder={t('help.describeHelpPlaceholder')}
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-lg font-medium">{t('help.urgencyLevel')}</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: "low", label: t('help.low'), variant: "outline" as const, color: "border-success text-success" },
                      { value: "medium", label: t('help.medium'), variant: "outline" as const, color: "border-warning text-warning" },
                      { value: "high", label: t('help.high'), variant: "outline" as const, color: "border-destructive text-destructive" }
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
                  {t('help.addPhoto')}
                </Button>

                <Button onClick={handleHelpSubmit} size="xl" className="w-full mt-8">
                  {t('help.submitHelpRequest')}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <Card className="p-6 bg-success/5 border-success">
                  <div className="text-center mb-4">
                    <CheckCircle className="h-12 w-12 text-success mx-auto mb-2" />
                    <h3 className="text-2xl font-bold text-success">{t('help.volunteerMatched')}</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{t('help.volunteer')}</span>
                      <span className="text-lg">{volunteerData.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{t('help.phone')}</span>
                      <Button variant="link" className="p-0 h-auto">
                        {volunteerData.phone}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{t('help.eta')}</span>
                      <span className="text-lg text-warning">{volunteerData.eta}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{t('help.status')}</span>
                      <Badge variant="secondary" className="bg-warning text-warning-foreground">
                        {t('help.onTheWay')}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button variant="outline" className="flex-1">
                      <Phone className="h-5 w-5" />
                      {t('help.call')}
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <MessageSquare className="h-5 w-5" />
                      {t('help.message')}
                    </Button>
                  </div>

                  <Button variant="secondary" size="lg" className="w-full mt-4">
                    {t('help.reviewVolunteer')}
                  </Button>
                </Card>

                <Button
                  variant="outline"
                  onClick={() => setShowVolunteerMatch(false)}
                  className="w-full"
                >
                  {t('help.requestNewHelp')}
                </Button>
              </div>
            )}
          </div>
        );

      case "routes":
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">{t('routes.smartRoutes')}</h2>
              <p className="text-lg text-muted-foreground">
                {t('routes.findAccessibleRoutes')}
              </p>
            </div>

            {!showRouteResults ? (
              <div className="space-y-6">
                <div className="space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="from" className="text-lg font-medium">
                      {t('routes.from')}
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleUseCurrentLocation}
                      disabled={isGettingLocation}
                      className="text-xs"
                    >
                      {isGettingLocation ? (
                        <>
                          <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
                          {t('routes.gettingLocation')}
                        </>
                      ) : (
                        <>
                          <Navigation className="h-3 w-3 mr-1" />
                          {t('routes.useCurrentLocation')}
                        </>
                      )}
                    </Button>
                  </div>
                  <Input
                    id="from"
                    value={routeFormData.from}
                    onChange={(e) => {
                      const v = e.target.value;
                      setRouteFormData({ ...routeFormData, from: v });
                      logPredictions(v, "From");
                    }}
                    className="h-14 text-lg"
                    placeholder={t('routes.currentLocationOrAddress')}
                    ref={fromInputRef}
                    data-google-autocomplete="true"
                  />
                  {fromPredictions.length > 0 && (
                    <div className="custom-autocomplete-dropdown absolute z-50 mt-1 w-full bg-card border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                      {fromPredictions.map(p => (
                        <button
                          key={p.place_id}
                          type="button"
                          className="w-full text-left px-4 py-3 hover:bg-accent hover:text-accent-foreground transition-colors border-b border-border last:border-b-0"
                          onClick={() => {
                            setRouteFormData(prev => ({ ...prev, from: p.description }));
                            setFromPredictions([]);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{p.description}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2 relative">
                  <Label htmlFor="to" className="text-lg font-medium">
                    {t('routes.to')}
                  </Label>
                  <Input
                    id="to"
                    value={routeFormData.to}
                    onChange={(e) => {
                      const v = e.target.value;
                      setRouteFormData({ ...routeFormData, to: v });
                      logPredictions(v, "To");
                    }}
                    className="h-14 text-lg"
                    placeholder={t('routes.destinationAddress')}
                    ref={toInputRef}
                    data-google-autocomplete="true"
                  />
                  {toPredictions.length > 0 && (
                    <div className="custom-autocomplete-dropdown absolute z-50 mt-1 w-full bg-card border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                      {toPredictions.map(p => (
                        <button
                          key={p.place_id}
                          type="button"
                          className="w-full text-left px-4 py-3 hover:bg-accent hover:text-accent-foreground transition-colors border-b border-border last:border-b-0"
                          onClick={() => {
                            setRouteFormData(prev => ({ ...prev, to: p.description }));
                            setToPredictions([]);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{p.description}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-8">
                  <Button onClick={handleRouteSearch} size="xl" className="flex-1">
                    <MapPin className="h-6 w-6" />
                    {t('routes.findAccessibleRoutesBtn')}
                  </Button>
                  <Button
                    onClick={clearSmartRouteForm}
                    variant="outline"
                    size="xl"
                    className="px-6"
                  >
                    {t('common.clear')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-foreground mb-2">{t('routes.routeOptions')}</h3>
                      <p className="text-muted-foreground">
                        {t('routes.routesSortedByAccessibility')}
                      </p>
                    </div>
                    <Button
                      onClick={clearSmartRouteForm}
                      variant="outline"
                      size="sm"
                      className="ml-4"
                    >
                      {t('routes.newRoute')}
                    </Button>
                  </div>
                </div>                <div className="space-y-4">
                  {routeResults.map((route, index) => {
                    const Icon = route.icon;
                    const isRecommended = route.isRecommended;
                    const isFirst = index === 0;

                    return (
                      <Card
                        key={route.id}
                        className={`p-6 transition-all ${isRecommended
                          ? 'border-2 border-primary bg-primary/5 shadow-lg'
                          : 'border border-border'
                          }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`rounded-full p-3 ${isRecommended
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-primary/10 text-primary'
                            }`}>
                            <Icon className="h-8 w-8" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <h4 className="text-xl font-semibold text-foreground">{route.mode}</h4>
                                {isRecommended && (
                                  <Badge variant="default" className="bg-primary text-primary-foreground">
                                    {isFirst ? t('routes.bestOption') : t('routes.recommended')}
                                  </Badge>
                                )}
                              </div>
                              <span className="text-lg font-medium text-primary">{route.time}</span>
                            </div>
                            <p className="text-lg text-foreground mb-2">{route.route}</p>
                            <div className="space-y-1">
                              <p className="text-muted-foreground">{route.accessibility}</p>
                              {isRecommended && (
                                <div className="flex items-center gap-1 text-sm text-primary">
                                  <Star className="h-4 w-4 fill-current" />
                                  <span>Elderly & wheelchair friendly</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <Button
                          variant={isRecommended ? "default" : "outline"}
                          size="lg"
                          className={`w-full mt-4 ${isRecommended
                            ? 'bg-primary hover:bg-primary/90'
                            : ''
                            }`}
                          onClick={() => handleRouteSelection(route)}
                        >
                          {isRecommended ? t('routes.selectBestRoute') : t('routes.selectThisRoute')}
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
                  {t('routes.searchNewRoute')}
                </Button>
              </div>
            )}
          </div>
        );

      case "reviews":
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">{t('reviews.myReviews')}</h2>
              <p className="text-lg text-muted-foreground">
                {t('reviews.reviewsWritten')}
              </p>
            </div>

            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Card key={review.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-xl font-semibold text-foreground">{review.volunteer}</h4>
                        <p className="text-muted-foreground">{formatDate(review.date)}</p>
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
                <p className="text-xl text-muted-foreground">{t('reviews.noReviews')}</p>
                <p className="text-muted-foreground mt-2">
                  {t('reviews.completeHelpRequests')}
                </p>
              </div>
            )}
          </div>
        );

      case "profile":
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">{t('profile.profileSettings')}</h2>
              <p className="text-lg text-muted-foreground">
                {t('profile.manageAccount')}
              </p>
            </div>

            {/* Personal Information */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">{t('profile.personalInformation')}</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-lg font-medium">
                    {t('profile.fullName')}
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
                    {t('profile.emailAddress')}
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
              <h3 className="text-xl font-semibold text-foreground mb-4">{t('profile.caregiverLinkingPin')}</h3>
              <div className="bg-muted/50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-mono font-bold text-primary">{linkingPin}</span>
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
                {t('profile.sharePinWithCaregivers')}
              </p>
            </Card>

            {/* Accessibility & Preferences */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">{t('profile.accessibilityPreferences')}</h3>

              <div className="space-y-6">
                {/* Language Preference */}
                <div className="space-y-3">
                  <Label className="text-lg font-medium">{t('profile.languagePreference')}</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {languages.map((lang) => (
                      <Button
                        key={lang.code}
                        variant={profileData.language === lang.name ? "default" : "outline"}
                        onClick={() => handleLanguageChange(lang.code)}
                      >
                        {lang.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Accessibility Needs */}
                {/* <div className="space-y-3">
                  <Label className="text-lg font-medium">{t('profile.accessibilityNeeds')}</Label>
                  <div className="space-y-3">
                    {accessibilityOptions.map((option) => {
                      const Icon = option.icon;

                      return (
                        <Card
                          key={option.key}
                          className={`p-4 cursor-pointer transition-all border-2 ${profileData.accessibilityNeeds[option.key]
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                            }`}
                          onClick={() => handleUserAccessibilityNeedChange(option.key)}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="h-6 w-6 text-primary" />
                            <span className="text-lg font-medium">{option.label}</span>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div> */}


                <div className="space-y-3">
                  <Label className="text-lg font-medium">{t('profile.accessibilityNeeds')}</Label>
                  <div className="grid grid-cols-1 gap-3">
                    {accessibilityOptions.map((option) => {
                      const Icon = option.icon;

                      return (
                        <Button
                          key={option.key}
                          variant={profileData.accessibilityNeeds[option.key] ? "default" : "outline"}
                          onClick={() => handleUserAccessibilityNeedChange(option.key, profileData.accessibilityNeeds[option.key])}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="h-6 w-6 text-primary" />
                            <span className="text-lg font-medium">{option.label}</span>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </div>


              </div>
            </Card>

            <Button size="xl" className="w-full">
              <Edit3 className="h-6 w-6" />
              {t('profile.saveSettings')}
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

  // Show route tracking page if a route is selected
  if (showRouteTracking && selectedRoute) {
    return (
      <RouteTracking
        selectedRoute={selectedRoute}
        from={routeFormData.from}
        to={routeFormData.to}
        onBack={handleBackFromTracking}
        onRouteCompleted={addRouteCompletionActivity}
        onNavigationStarted={addNavigationStartedActivity}
      />
    );
  }

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
            { id: "home", icon: Home, label: t('common.home') },
            { id: "help", icon: HelpCircle, label: t('common.help') },
            { id: "routes", icon: MapPin, label: t('common.routes') },
            { id: "reviews", icon: Star, label: t('common.reviews') },
            { id: "profile", icon: User, label: t('common.profile') },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleSetActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${activeTab === tab.id
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