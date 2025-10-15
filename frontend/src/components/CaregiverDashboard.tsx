import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Heart, 
  MapPin, 
  User, 
  Menu, 
  Bell, 
  LogOut,
  Clock,
  Eye,
  Phone,
  Mail as MailIcon,
  MessageSquare,
  Settings,
  Smartphone,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { axiosInstance as axios } from "./axios";

type TabType = "overview" | "live" | "profile";

interface ElderlyUser {
  userid: string;
  fullname: string;
  phone: string;
  email: string;
  status: string;
  online: boolean;
  mobilityPreference?: string;
  createdAt: string;
  updatedAt: string;
}

interface CaregiverInfo {
  userid: string;
  fullname: string;
  phone: string;
  email: string;
  linkedElderly?: ElderlyUser[];
}

interface ActivityItem {
  id: string;
  description: string;
  location: string;
  volunteer?: string;
  timestamp: string;
  status: string;
}

export default function CaregiverDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [caregiverInfo, setCaregiverInfo] = useState<CaregiverInfo | null>(null);
  const [elderlyUser, setElderlyUser] = useState<ElderlyUser | null>(null);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [pinInput, setPinInput] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch caregiver profile and linked elderly on component mount
  useEffect(() => {
    fetchCaregiverData();
  }, []);

  const fetchCaregiverData = async () => {
    try {
      setLoading(true);
      
      // Get caregiver profile and linked elderly
      const response = await axios.get('/caregiver/me');
      const data = response.data;
      
      if (data.linkedElderly && data.linkedElderly.length > 0) {
        setElderlyUser(data.linkedElderly[0]); // Assuming one linked elderly for now
        
        // Fetch recent activities for the linked elderly
        await fetchRecentActivities(data.linkedElderly[0].userid);
      }
      
      // Get caregiver's own profile info
      const profileResponse = await axios.get('/users/me');
      setCaregiverInfo(profileResponse.data);
      
    } catch (error) {
      console.error('Error fetching caregiver data:', error);
      toast({
        title: "Error",
        description: "Failed to load caregiver data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivities = async (elderlyUserId: string) => {
    try {
      const response = await axios.get(`/caregiver/history/${elderlyUserId}`);
      setRecentActivities(response.data.activities || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const handleLinkByPIN = async () => {
    if (!pinInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter a PIN",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLinking(true);
      const response = await axios.post('/caregiver/link', {
        pin: pinInput.trim()
      });

      toast({
        title: "Success",
        description: "Successfully linked to elderly user",
        variant: "default"
      });

      setPinInput("");
      // Refresh data
      await fetchCaregiverData();
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to link with PIN",
        variant: "destructive"
      });
    } finally {
      setIsLinking(false);
    }
  };

  const handleUpdateProfile = async (updates: Partial<CaregiverInfo>) => {
    try {
      await axios.patch('/caregiver/me', updates);
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
        variant: "default"
      });
      
      // Refresh data
      await fetchCaregiverData();
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to update profile",
        variant: "destructive"
      });
    }
  };

  const handleSkipForTesting = () => {
    // Mock elderly user data for testing
    const mockElderlyUser: ElderlyUser = {
      userid: "mock-elderly-123",
      fullname: "Margaret Chen (Test User)",
      phone: "+65 9123 4567",
      email: "margaret.test@email.com",
      status: "active",
      online: true,
      mobilityPreference: "wheelchair accessible routes",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Mock recent activities for testing
    const mockActivities: ActivityItem[] = [
      {
        id: "1",
        description: "Requested help with groceries at Orchard Road",
        location: "Orchard Road MRT Station",
        volunteer: "Sarah Volunteer",
        timestamp: "2024-08-26 16:30",
        status: "Active"
      },
      {
        id: "2",
        description: "Planned accessible route to Raffles Hospital",
        location: "From Home to Raffles Hospital",
        timestamp: "2024-08-26 14:15",
        status: "Completed"
      },
      {
        id: "3",
        description: "Assistance with ticket machine",
        location: "City Hall MRT Station",
        volunteer: "John Helper",
        timestamp: "2024-08-25 18:45",
        status: "Completed"
      }
    ];

    // Set mock data and show testing notification
    setElderlyUser(mockElderlyUser);
    setRecentActivities(mockActivities);
    
    toast({
      title: "Testing Mode Activated",
      description: "Dashboard loaded with mock data. PIN linking stage skipped for testing purposes.",
      variant: "default"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading caregiver dashboard...</span>
        </div>
      </div>
    );
  }

  // If no elderly user is linked, show linking interface
  if (!elderlyUser) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-accent p-6 text-center">
          <h1 className="text-3xl font-bold mb-2">Caregiver Dashboard</h1>
          <p className="text-muted-foreground">Link to an elderly user to start monitoring</p>
        </header>

        <main className="max-w-4xl mx-auto p-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Link to Elderly User</h2>
            <p className="text-muted-foreground mb-4">
              Enter the PIN provided by the elderly user to establish a connection.
            </p>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="pin">Elderly User PIN</Label>
                <Input 
                  id="pin"
                  placeholder="Enter 6-digit PIN"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  maxLength={6}
                  className="mt-2"
                />
              </div>
              
              <Button 
                onClick={handleLinkByPIN}
                disabled={isLinking}
                className="w-full"
              >
                {isLinking ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Linking...
                  </>
                ) : (
                  "Link Account"
                )}
              </Button>

              {/* Testing Mode Button */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    For Testing Only
                  </span>
                </div>
              </div>

              <Button 
                onClick={handleSkipForTesting}
                variant="outline"
                className="w-full border-dashed border-2 border-warning text-warning hover:bg-warning/10"
              >
                Skip PIN Linking (Test Mode)
              </Button>

              <div className="text-center text-xs text-muted-foreground">
                ⚠️ Test mode will load mock elderly user data
              </div>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  const currentActivity = {
    description: "Requested help with groceries at Orchard Road",
    status: "Live",
    location: "Orchard Road MRT Station",
    volunteer: "Sarah Volunteer",
    timestamp: "2024-08-26 16:30"
  };

  const locationHistory = [
    {
      id: 1,
      location: "Orchard Road MRT Station",
      status: "Current location",
      time: "16:30"
    },
    {
      id: 2,
      location: "ION Orchard Mall",
      status: "Previous location",
      time: "15:45"
    },
    {
      id: 3,
      location: "Home",
      status: "Starting point",
      time: "14:00"
    }
  ];

  const navigationTabs = [
    { id: "overview" as TabType, label: "Overview", icon: Heart },
    { id: "live" as TabType, label: "Live", icon: MapPin },
    { id: "profile" as TabType, label: "Profile", icon: User }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Care Overview</h1>

      {/* Health Status */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Heart className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Health Status</h2>
        </div>
        <div className="p-4 bg-success/10 border-2 border-success rounded-lg">
          <p className="text-lg font-medium text-success">{elderlyUser.status === 'active' ? 'Good' : elderlyUser.status}</p>
        </div>
      </Card>

      {/* Current Location */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <MapPin className="h-5 w-5 text-success" />
          <h2 className="text-xl font-semibold">Current Location</h2>
        </div>
        <p className="text-lg mb-2">Location tracking available</p>
        <p className="text-sm text-muted-foreground">Last updated: {new Date(elderlyUser.updatedAt).toLocaleString()}</p>
      </Card>

      {/* Last Active */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Last Active</h2>
        </div>
        <p className="text-lg mb-2">{new Date(elderlyUser.updatedAt).toLocaleString()}</p>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-success" />
          <span className="text-sm text-success">{elderlyUser.online ? 'Online' : 'Offline'}</span>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {recentActivities.map((activity) => (
            <Card key={activity.id} className="p-4 bg-background">
              <div className="flex items-start gap-3 mb-2">
                <Heart className="h-5 w-5 text-muted-foreground mt-1" />
                <div className="flex-1">
                  <p className="font-medium mb-2">{activity.description}</p>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{activity.location}</span>
                    </div>
                    {activity.volunteer && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>Volunteer: {activity.volunteer}</span>
                      </div>
                    )}
                    <p>{activity.timestamp}</p>
                  </div>
                  <div className="mt-3">
                    {activity.status === "Active" ? (
                      <div className="flex gap-2">
                        <Badge variant="default" className="bg-accent text-accent-foreground">
                          {activity.status}
                        </Badge>
                        <Button 
                          size="sm" 
                          className="bg-info text-info-foreground"
                          onClick={() => setActiveTab("live")}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Track Live
                        </Button>
                      </div>
                    ) : (
                      <Badge variant="default" className="bg-success text-success-foreground">
                        {activity.status}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Emergency Contact */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Emergency Contact</h2>
        
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Phone className="h-5 w-5 text-info" />
              <div>
                <p className="font-medium">Phone</p>
                <p className="text-sm">{elderlyUser.phone}</p>
              </div>
            </div>
            <Button className="w-full bg-primary text-primary-foreground">
              <Phone className="h-4 w-4 mr-2" />
              Call Now
            </Button>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <MailIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm">{elderlyUser.email}</p>
              </div>
            </div>
            <Button className="w-full bg-secondary text-secondary-foreground">
              <MailIcon className="h-4 w-4 mr-2" />
              Send Email
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderLive = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Live Tracking</h1>

      {/* Current Activity */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Current Activity</h2>
        
        <Card className="p-4 bg-info/10 border-2 border-info">
          <div className="flex items-start gap-3 mb-3">
            <Heart className="h-5 w-5 text-muted-foreground mt-1" />
            <div className="flex-1">
              <p className="font-medium mb-2">{currentActivity.description}</p>
              <Badge className="bg-info text-info-foreground mb-3">
                {currentActivity.status}
              </Badge>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <MapPin className="h-4 w-4" />
                <span>{currentActivity.location}</span>
              </div>

              <Card className="p-4 bg-background mb-3">
                <p className="font-medium mb-2">Volunteer Assigned</p>
                <p className="text-sm mb-3">{currentActivity.volunteer}</p>
                <div className="flex flex-col gap-2">
                  <Button className="w-full bg-primary text-primary-foreground">
                    <Phone className="h-4 w-4 mr-2" />
                    Call
                  </Button>
                  <Button className="w-full bg-secondary text-secondary-foreground">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                </div>
              </Card>

              <div className="p-4 bg-success/10 border border-success rounded-lg">
                <div className="flex items-start gap-2">
                  <Bell className="h-4 w-4 text-success mt-0.5" />
                  <p className="text-sm text-success">
                    You will receive real-time updates via SMS and email as the situation progresses.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </Card>

      {/* Location History */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Location History</h2>
        
        <div className="space-y-3">
          {locationHistory.map((item) => (
            <Card key={item.id} className="p-4 bg-muted">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{item.location}</p>
                  <p className="text-sm text-muted-foreground">{item.status}</p>
                </div>
                <p className="text-sm font-medium">{item.time}</p>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Profile Management</h1>

      {/* My Information */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">My Information</h2>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="caregiver-name">Full Name</Label>
            <Input 
              id="caregiver-name"
              defaultValue={caregiverInfo?.fullname || ''}
              className="mt-2"
            />
          </div>
          
          <div>
            <Label htmlFor="caregiver-phone">Phone Number</Label>
            <Input 
              id="caregiver-phone"
              defaultValue={caregiverInfo.phone}
              className="mt-2"
            />
          </div>
          
          <div>
            <Label htmlFor="caregiver-email">Email Address</Label>
            <Input 
              id="caregiver-email"
              type="email"
              defaultValue={caregiverInfo.email}
              className="mt-2"
            />
          </div>
        </div>
      </Card>

      {/* Elderly User Information */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Elderly User Information</h2>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="elderly-name">Full Name</Label>
            <Input 
              id="elderly-name"
              defaultValue={elderlyUser.fullname}
              className="mt-2"
            />
          </div>
          
          <div>
            <Label htmlFor="elderly-phone">Phone Number</Label>
            <Input 
              id="elderly-phone"
              defaultValue={elderlyUser.phone}
              className="mt-2"
            />
          </div>
          
          <div>
            <Label htmlFor="elderly-email">Email Address</Label>
            <Input 
              id="elderly-email"
              type="email"
              defaultValue={elderlyUser.email}
              className="mt-2"
            />
          </div>
        </div>
      </Card>

      {/* Mobility Preferences */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Mobility Preferences</h2>
        
        <div className="space-y-3">
          {elderlyUser.mobilityPreference ? (
            <Card className="p-4 bg-muted">
              <p>{elderlyUser.mobilityPreference}</p>
            </Card>
          ) : (
            <p className="text-muted-foreground">No mobility preferences set</p>
          )}
        </div>
      </Card>

      {/* Notification Settings */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Notification Settings</h2>
        
        <div className="space-y-4">
          <Card className="p-4 bg-muted">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive updates via text message</p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>
          </Card>

          <Card className="p-4 bg-muted">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <MailIcon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive detailed updates via email</p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>
          </Card>

          <Card className="p-4 bg-muted">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Emergency Alerts</p>
                  <p className="text-sm text-muted-foreground">
                    Immediate notifications for urgent situations
                  </p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>
          </Card>
        </div>
      </Card>

      {/* Save Button */}
      <Button 
        className="w-full bg-primary text-primary-foreground"
        onClick={() => {
          // Get form values and update profile
          const formData = {
            fullname: (document.getElementById('caregiver-name') as HTMLInputElement)?.value,
            phone: (document.getElementById('caregiver-phone') as HTMLInputElement)?.value,
            email: (document.getElementById('caregiver-email') as HTMLInputElement)?.value,
          };
          handleUpdateProfile(formData);
        }}
      >
        <Settings className="h-4 w-4 mr-2" />
        Save All Changes
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-accent p-6 text-center relative">
        <h1 className="text-3xl font-bold mb-2">Caregiver Dashboard</h1>
        <p className="text-muted-foreground">Monitoring: {elderlyUser.fullname}</p>
        
        {/* Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="absolute top-6 right-6 p-2 border-2 border-border rounded-xl bg-card hover:bg-muted transition-colors"
          aria-label="Menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Dropdown Menu */}
        {menuOpen && (
          <Card className="absolute top-20 right-6 p-4 w-64 z-50 space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start bg-secondary text-secondary-foreground"
              onClick={() => setMenuOpen(false)}
            >
              <Bell className="h-4 w-4 mr-2" />
              Alerts
            </Button>
          </Card>
        )}
      </header>

      {/* Navigation Tabs */}
      <div className="flex gap-3 p-4 max-w-4xl mx-auto">
        {navigationTabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          
          return (
            <Button
              key={tab.id}
              variant={active ? "default" : "outline"}
              className={`flex-1 justify-start gap-2 ${
                active 
                  ? "bg-accent text-accent-foreground border-2 border-accent" 
                  : "bg-card text-foreground border-2 border-border hover:bg-muted"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4">
        {activeTab === "overview" && renderOverview()}
        {activeTab === "live" && renderLive()}
        {activeTab === "profile" && renderProfile()}
      </main>
    </div>
  );
}