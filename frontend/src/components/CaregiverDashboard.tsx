import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Users, Calendar, Bell, Plus, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CaregiverDashboard() {
  const navigate = useNavigate();

  const stats = [
    { title: "Linked Elderly", value: "3", icon: Users, color: "text-primary" },
    { title: "Pending Requests", value: "2", icon: Bell, color: "text-warning" },
    { title: "This Week Activities", value: "12", icon: Activity, color: "text-success" },
    { title: "Upcoming Appointments", value: "4", icon: Calendar, color: "text-secondary" },
  ];

  const recentActivities = [
    { user: "John Smith", activity: "Medication reminder completed", time: "2 hours ago" },
    { user: "Mary Johnson", activity: "Doctor appointment scheduled", time: "5 hours ago" },
    { user: "Robert Brown", activity: "Health check-in completed", time: "1 day ago" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your caregiving activities</p>
        </div>
        <Button onClick={() => navigate("/caregiver/link-elderly")} className="gap-2">
          <Plus className="h-4 w-4" />
          Link New Elderly
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activities
          </CardTitle>
          <CardDescription>Latest updates from your linked elderly users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0">
                <div className="rounded-full bg-primary/10 p-2">
                  <Heart className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-card-foreground">{activity.user}</p>
                  <p className="text-sm text-muted-foreground">{activity.activity}</p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <Button variant="outline" onClick={() => navigate("/caregiver/linked-elderly")} className="justify-start">
            <Users className="mr-2 h-4 w-4" />
            View All Linked Users
          </Button>
          <Button variant="outline" onClick={() => navigate("/caregiver/reports")} className="justify-start">
            <Calendar className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
          <Button variant="outline" onClick={() => navigate("/caregiver/profile")} className="justify-start">
            <Activity className="mr-2 h-4 w-4" />
            Update Profile
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
