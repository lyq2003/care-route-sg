import { useState, useEffect, useRef } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Navigation, 
  Clock, 
  MapPin, 
  Bus, 
  Train, 
  Car, 
  Bike,
  CheckCircle,
  AlertCircle,
  Volume2,
  VolumeX,
  RotateCcw,
  Locate
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "./axios";

interface RouteStep {
  instruction: string;
  distance?: string;
  duration?: string;
  travelMode: string;
}

interface RouteTrackingProps {
  selectedRoute: {
    from: {lat: number; lng: number;},
    to: {lat: number; lng: number;}
  };
  from: string;
  to: string;
  onBack: () => void;
  onRouteCompleted?: (route: any) => void;
  onNavigationStarted?: (route: any) => void;
}
export default function VolunteerRoute({selectedRoute, from, to, onBack}: RouteTrackingProps) {
  const navigate = useNavigate();
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [routeSteps, setRouteSteps] = useState<RouteStep[]>([]);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  const [notifications, setNotifications] = useState<Array<{id: string, message: string, type: 'info' | 'success' | 'warning' | 'error', timestamp: Date}>>([]);
  const mapRef = useRef<google.maps.Map | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const destinationMarkerRef = useRef<google.maps.Marker | null>(null);
  const originMarkerRef = useRef<google.maps.Marker | null>(null);
  const userLocationMarkerRef = useRef<google.maps.Marker | null>(null);

  // Load Google Maps API
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
      if (!apiKey) return;
      
      try {
        setOptions({ key: apiKey, v: "weekly", libraries: ["places", "geometry"] });
        await importLibrary("places");
        await importLibrary("geometry");
        if (cancelled) return;
        setGoogleLoaded(true);
      } catch (err) {
        console.error("Failed to load Google Maps API", err);
      }
    };
    init();
    return () => { cancelled = true; };
  }, []);

  // Get route directions when Google Maps loads
  useEffect(() => {
    if (!googleLoaded || !from || !to) return;

    const getDirections = async () => {
      const google = (window as any).google as typeof window.google;
      const directionsService = new google.maps.DirectionsService();

      try {
        const result = await directionsService.route({
          origin: from,
          destination: to,
          travelMode: google.maps.TravelMode.TRANSIT,
          provideRouteAlternatives: false
        });

        setDirections(result);
        
        // Process route steps
        if (result.routes[0]?.legs[0]?.steps) {
          const steps = result.routes[0].legs[0].steps.map((step, index) => ({
            instruction: step.instructions.replace(/<[^>]*>/g, ""),
            distance: step.distance?.text,
            duration: step.duration?.text,
            travelMode: step.travel_mode,
            icon: getStepIcon(step.travel_mode, step.instructions)
          }));
          setRouteSteps(steps);
        }
      } catch (error) {
        console.error("Error getting directions:", error);
      }
    };

    getDirections();
  }, [googleLoaded, from, to]);

  // Request geolocation permission and start tracking
  useEffect(() => {
    if (!isNavigating) return;

    const requestLocationPermission = async () => {
      if (!navigator.geolocation) {
        addNotification('Geolocation is not supported by this browser', 'error');
        return;
      }

      try {
        if (navigator.permissions) {
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          setLocationPermission(permission.state);
          
          permission.onchange = () => {
            setLocationPermission(permission.state);
          };
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation({ lat: latitude, lng: longitude });
            setLocationPermission('granted');
          },
          (error) => {
            console.error('Geolocation error:', error);
            setLocationPermission('denied');
            addNotification(`Location error: ${error.message}`, 'error');
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          }
        );

        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation({ lat: latitude, lng: longitude });
          },
          (error) => {
            console.error('Watch position error:', error);
            addNotification(`Location tracking error: ${error.message}`, 'warning');
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 30000
          }
        );

        watchIdRef.current = watchId;

      } catch (error) {
        console.error('Permission request error:', error);
      }
    };

    requestLocationPermission();

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isNavigating]);

  // Have the route blue lines
  useEffect(() => {
    if (!mapRef.current || !directions || !googleLoaded) return;

    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({ map: mapRef.current });

    directionsService.route(
      {
        origin: directions.routes[0]?.legs[0]?.start_location,
        destination: directions.routes[0]?.legs[0]?.end_location,
        travelMode: google.maps.TravelMode.TRANSIT,
      },
      (result, status) => {
        if (status === "OK") directionsRenderer.setDirections(result);
        else console.error("Route failed:", status);
      }
    );

    return () => directionsRenderer.setMap(null);
  }, [directions, googleLoaded]); 
  
  // Create origin marker
  useEffect(() => {
    if (!mapRef.current || !directions || !googleLoaded) return;

    const google = (window as any).google as typeof window.google;
    const origin = directions.routes[0]?.legs[0]?.start_location;
    if (!origin) return;

    if (originMarkerRef.current) {
      originMarkerRef.current.setMap(null);
    }

    originMarkerRef.current = new google.maps.Marker({
      position: origin,
      map: mapRef.current,
      title: 'Starting Point',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
            <path fill="#ef4444" d="M16 0C7.163 0 0 7.163 0 16c0 11.089 16 24 16 24s16-12.911 16-24c0-8.837-7.163-16-16-16z"/>
            <circle cx="16" cy="16" r="4" fill="#ffffff"/>
          </svg>
        `),
        scaledSize: new google.maps.Size(32, 40),
        anchor: new google.maps.Point(16, 40)
      },
      zIndex: 999
    });

    return () => {
      if (originMarkerRef.current) {
        originMarkerRef.current.setMap(null);
      }
    };
  }, [directions, googleLoaded]);

  // Create destination marker
  useEffect(() => {
    if (!mapRef.current || !directions || !googleLoaded) return;

    const google = (window as any).google as typeof window.google;
    const destination = directions.routes[0]?.legs[0]?.end_location;
    if (!destination) return;

    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.setMap(null);
    }

    destinationMarkerRef.current = new google.maps.Marker({
      position: destination,
      map: mapRef.current,
      title: 'Destination',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
            <path fill="#10b981" d="M16 0C7.163 0 0 7.163 0 16c0 11.089 16 24 16 24s16-12.911 16-24c0-8.837-7.163-16-16-16z"/>
            <circle cx="16" cy="16" r="4" fill="#ffffff"/>
          </svg>
        `),
        scaledSize: new google.maps.Size(32, 40),
        anchor: new google.maps.Point(16, 40)
      },
      zIndex: 1000
    });

    return () => {
      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.setMap(null);
      }
    };
  }, [directions, googleLoaded]);

  // Create user location marker
  useEffect(() => {
    if (!mapRef.current || !googleLoaded || !isNavigating) {
      if (!isNavigating && userLocationMarkerRef.current) {
        userLocationMarkerRef.current.setMap(null);
        userLocationMarkerRef.current = null;
      }
      return;
    }

    const google = (window as any).google as typeof window.google;

    if (!userLocationMarkerRef.current) {
      const initialPosition = userLocation || { lat: 1.3521, lng: 103.8198 };
      
      userLocationMarkerRef.current = new google.maps.Marker({
        position: initialPosition,
        map: mapRef.current,
        title: 'Your Current Location',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 15,
          fillColor: '#3b82f6',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        },
        zIndex: 1001,
        optimized: false,
        visible: true
      });
    }
  }, [googleLoaded, isNavigating, userLocation]);

  // Update user location marker position
  useEffect(() => {
    if (userLocationMarkerRef.current && userLocation) {
      userLocationMarkerRef.current.setPosition(userLocation);
    }
  }, [userLocation]);

  const addNotification = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const id = Date.now().toString();
    const notification = {
      id,
      message,
      type,
      timestamp: new Date()
    };
    
    setNotifications(prev => [notification, ...prev.slice(0, 4)]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getStepIcon = (travelMode: google.maps.TravelMode, instructions: string) => {
    const instructionText = instructions.toLowerCase();
    
    if (travelMode === google.maps.TravelMode.TRANSIT) {
      if (instructionText.includes('bus')) return Bus;
      if (instructionText.includes('mrt') || instructionText.includes('train')) return Train;
      return <Bus className="h-4 w-4" />;
    }
    if (travelMode === google.maps.TravelMode.WALKING) return Navigation;
    return <Navigation className="h-4 w-4" />;
  };

  const startNavigation = () => {
    setIsNavigating(true);
    addNotification('Navigation started!', 'success');
    
    if (voiceEnabled) {
      speakInstruction(routeSteps[currentStep]?.instruction || "Starting navigation");
    }
  };

  const stopNavigation = () => {
    setIsNavigating(false);
  };

  const nextStep = () => {
    if (currentStep < routeSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      const nextInstruction = routeSteps[currentStep + 1]?.instruction || "Navigation complete";
      addNotification(`Next: ${nextInstruction}`, 'info');
      
      if (voiceEnabled) {
        speakInstruction(nextInstruction);
      }
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      if (voiceEnabled) {
        speakInstruction(routeSteps[currentStep - 1]?.instruction || "Starting navigation");
      }
    }
  };

  const speakInstruction = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  };

  const relocateToCurrentLocation = () => {
    if (!mapRef.current || !userLocation) {
      addNotification("No current location available", 'warning');
      return;
    }

    mapRef.current.setCenter(userLocation);
    mapRef.current.setZoom(17);
    addNotification("Map centered on your location", 'success');
  };

  const completeRoute = async () => {
    try {

      addNotification('Route completed successfully!', 'success');
      
      if (voiceEnabled) {
        speakInstruction("Route completed successfully!");
      }
      
      setTimeout(() => {
        onBack();
      }, 2000);
      
    } catch (error) {
      console.error('Error saving route:', error);
      onBack();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Route Navigation</h1>
            </div>
          </div>
          <Button
            variant={voiceEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => setVoiceEnabled(!voiceEnabled)}
          >
            {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Map Section */}
        <div className="flex-1 relative">
          {googleLoaded && (
            <div
              ref={(el) => {
                if (el && !mapRef.current) {
                  const google = (window as any).google as typeof window.google;
                  mapRef.current = new google.maps.Map(el, {
                    center: { lat: 1.3521, lng: 103.8198 },
                    zoom: 13,
                    styles: [
                      {
                        featureType: "poi",
                        elementType: "labels",
                        stylers: [{ visibility: "off" }]
                      }
                    ]
                  });

                  if (directions) {
                    directionsRendererRef.current = new google.maps.DirectionsRenderer({
                      map: mapRef.current,
                      suppressMarkers: true,
                      polylineOptions: {
                        strokeColor: "#3b82f6",
                        strokeWeight: 4
                      }
                    });
                    directionsRendererRef.current.setDirections(directions);
                  }
                }
              }}
              className="w-full h-full"
            />
          )}
          
          {/* Navigation Status Overlay */}
          {isNavigating && (
            <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm rounded-lg p-4 shadow-lg z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Navigating</span>
              </div>
              <div className="text-xs text-muted-foreground mb-2">
                Step {currentStep + 1} of {routeSteps.length}
              </div>
              
              {/* Location Status */}
              <div className="flex items-center gap-2 text-xs mb-3">
                {locationPermission === 'granted' && userLocation ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-600">Location tracking active</span>
                  </>
                ) : locationPermission === 'denied' ? (
                  <>
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-red-600">Location denied</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-600">Requesting location...</span>
                  </>
                )}
              </div>

              {/* Map Legend */}
              <div className="border-t border-border pt-3 space-y-1">
                <div className="text-xs font-medium text-muted-foreground mb-2">Map Legend:</div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white"></div>
                  <span>Your location</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <svg width="12" height="15" viewBox="0 0 12 15" className="flex-shrink-0">
                    <path fill="#ef4444" d="M6 0C2.7 0 0 2.7 0 6c0 4.2 6 9 6 9s6-4.8 6-9c0-3.3-2.7-6-6-6z"/>
                    <circle cx="6" cy="6" r="1.5" fill="#fff"/>
                  </svg>
                  <span>Starting point</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <svg width="12" height="15" viewBox="0 0 12 15" className="flex-shrink-0">
                    <path fill="#10b981" d="M6 0C2.7 0 0 2.7 0 6c0 4.2 6 9 6 9s6-4.8 6-9c0-3.3-2.7-6-6-6z"/>
                    <circle cx="6" cy="6" r="1.5" fill="#fff"/>
                  </svg>
                  <span>Destination</span>
                </div>
              </div>
            </div>
          )}

          {/* Relocate Button */}
          {userLocation && (
            <div className="absolute bottom-4 right-4 z-20">
              <Button
                onClick={relocateToCurrentLocation}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg h-14 w-14 rounded-full"
                title="Show my current location"
              >
                <Locate className="h-6 w-6" />
              </Button>
            </div>
          )}
        </div>

        {/* Route Details Sidebar */}
        <div className="w-96 bg-card border-l border-border overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Route Summary */}

            {/* Navigation Controls */}
            <Card className="p-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">Navigation</h4>
                <div className="space-y-2">
                  {!isNavigating ? (
                    <Button onClick={startNavigation} className="w-full">
                      <Navigation className="h-4 w-4 mr-2" />
                      Start Navigation
                    </Button>
                  ) : (
                    <Button onClick={stopNavigation} variant="destructive" className="w-full">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Stop Navigation
                    </Button>
                  )}
                  <Button 
                    onClick={completeRoute} 
                    variant="default" 
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete Route
                  </Button>
                </div>
              </div>
            </Card>

            {/* Current Step */}
            {routeSteps.length > 0 && routeSteps[currentStep] && (
              <Card className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-foreground">Current Step</h4>
                    <span className="text-sm text-muted-foreground">
                      {currentStep + 1} of {routeSteps.length}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <p className="text-sm text-foreground">
                          {routeSteps[currentStep].instruction}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {routeSteps[currentStep].distance && (
                            <span>{routeSteps[currentStep].distance}</span>
                          )}
                          {routeSteps[currentStep].duration && (
                            <span>{routeSteps[currentStep].duration}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={previousStep}
                        disabled={currentStep === 0}
                        className="flex-1"
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={nextStep}
                        disabled={currentStep === routeSteps.length - 1}
                        className="flex-1"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* All Steps */}
            <Card className="p-4">
              <h4 className="font-semibold text-foreground mb-3">Route Steps</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {routeSteps.map((step, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 p-2 rounded-lg transition-colors cursor-pointer ${
                      index === currentStep 
                        ? 'bg-primary/10 border border-primary' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setCurrentStep(index)}
                  >
                    <div className={`rounded-full p-1 mt-1 ${
                      index === currentStep 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{step.instruction}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        {step.distance && <span>{step.distance}</span>}
                        {step.duration && <span>{step.duration}</span>}
                      </div>
                    </div>
                    {index === currentStep && (
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-1" />
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Notification Overlay */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-center gap-3 p-3 rounded-lg shadow-lg backdrop-blur-sm border max-w-sm ${
              notification.type === 'success' 
                ? 'bg-green-500/90 text-white border-green-400' 
                : notification.type === 'error'
                ? 'bg-red-500/90 text-white border-red-400'
                : notification.type === 'warning'
                ? 'bg-yellow-500/90 text-white border-yellow-400'
                : 'bg-blue-500/90 text-white border-blue-400'
            }`}
          >
            <div className="flex-1">
              <p className="text-sm font-medium">{notification.message}</p>
              <p className="text-xs opacity-80">
                {notification.timestamp.toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="text-white/80 hover:text-white transition-colors"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
