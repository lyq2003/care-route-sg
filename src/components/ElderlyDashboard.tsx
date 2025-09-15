import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  AlertCircle
} from "lucide-react";

interface User {
  name: string;
  userType: string;
}

interface ElderlyDashboardProps {
  user: User;
  onRequestHelp: () => void;
  onSmartRoutes: () => void;
  onSignOut: () => void;
}

export default function ElderlyDashboard({ user, onRequestHelp, onSmartRoutes, onSignOut }: ElderlyDashboardProps) {
  const [activeTab, setActiveTab] = useState("home");
  const [voiceEnabled, setVoiceEnabled] = useState(false);

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

  const caregiverPin = "2847";

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
                      Welcome, {user.name}
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
            { id: "routes", icon: MapPin, label: "Routes" },
            { id: "reviews", icon: Star, label: "Reviews" },
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