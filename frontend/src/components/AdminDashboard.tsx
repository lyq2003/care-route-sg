import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Shield, 
  Users, 
  HelpCircle, 
  Flag, 
  MessageSquare,
  Search,
  Phone,
  Mail,
  Calendar,
  Eye,
  Ban,
  UserX,
  Edit,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  MapPin,
  User,
  Menu
} from "lucide-react";

type UserRole = "Elderly" | "Volunteer" | "Caregiver" | "Admin";
type UserStatus = "Active" | "Suspended" | "Banned";
type RequestStatus = "Pending" | "In Progress" | "Completed" | "Cancelled";
type ReportStatus = "Pending" | "In Progress" | "Resolved" | "Rejected";
type UrgencyLevel = "Low" | "Medium" | "High";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  joinedDate: string;
}

interface HelpRequest {
  id: string;
  elderlyName: string;
  location: string;
  description: string;
  status: RequestStatus;
  urgency: UrgencyLevel;
  volunteer?: string;
  timestamp: string;
}

interface Report {
  id: string;
  reporterName: string;
  reportedUser: string;
  reportedRole: UserRole;
  reason: string;
  status: ReportStatus;
  timestamp: string;
  evidence?: string;
}

interface Review {
  id: string;
  reviewerName: string;
  revieweeName: string;
  rating: number;
  comment: string;
  timestamp: string;
  flagged: boolean;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<HelpRequest | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // Mock data
  const stats = {
    totalUsers: 4,
    activeUsers: 4,
    pendingReports: 0,
    totalRequests: 8
  };

  const users: User[] = [
    {
      id: "1",
      name: "Margaret Chen",
      email: "margaret@email.com",
      phone: "+65 9123 4567",
      role: "Elderly",
      status: "Active",
      joinedDate: "15/01/2024"
    },
    {
      id: "2",
      name: "David Chen",
      email: "david@email.com",
      phone: "+65 9234 5678",
      role: "Caregiver",
      status: "Active",
      joinedDate: "16/01/2024"
    },
    {
      id: "3",
      name: "Sarah Volunteer",
      email: "sarah@email.com",
      phone: "+65 9345 6789",
      role: "Volunteer",
      status: "Active",
      joinedDate: "10/01/2024"
    },
    {
      id: "4",
      name: "Li Wei",
      email: "liwei@email.com",
      phone: "+65 9456 7890",
      role: "Volunteer",
      status: "Active",
      joinedDate: "12/01/2024"
    }
  ];

  const helpRequests: HelpRequest[] = [
    {
      id: "1",
      elderlyName: "Margaret Chen",
      location: "Orchard Road MRT Station",
      description: "Need help carrying heavy groceries to taxi stand. I have 3 bags of groceries and cannot lift them.",
      status: "Completed",
      urgency: "Medium",
      volunteer: "Sarah Volunteer",
      timestamp: "25/08/2024, 14:30:00"
    },
    {
      id: "2",
      elderlyName: "Margaret Chen",
      location: "Bugis Junction Level 2",
      description: "Assistance needed to navigate to clinic appointment. Need help finding the right escalator and lifts.",
      status: "In Progress",
      urgency: "High",
      volunteer: "Sarah Volunteer",
      timestamp: "30/09/2024, 10:15:00"
    }
  ];

  const reports: Report[] = [];

  const reviews: Review[] = [];

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSuspendUser = (userId: string) => {
    console.log("Suspending user:", userId);
    // Implementation would update user status
  };

  const handleBanUser = (userId: string) => {
    console.log("Banning user:", userId);
    // Implementation would permanently ban user
  };

  const handleReassignVolunteer = (requestId: string) => {
    console.log("Reassigning volunteer for request:", requestId);
    // Implementation would open volunteer selection
  };

  const handleResolveReport = (reportId: string, action: "ban" | "reject") => {
    console.log(`${action === "ban" ? "Banning" : "Rejecting"} report:`, reportId);
    // Implementation would update report status and potentially ban user
  };

  const handleRemoveReview = (reviewId: string) => {
    console.log("Removing review:", reviewId);
    // Implementation would delete review
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "Elderly": return "bg-accent text-accent-foreground";
      case "Volunteer": return "bg-success text-success-foreground";
      case "Caregiver": return "bg-warning text-warning-foreground";
      case "Admin": return "bg-destructive text-destructive-foreground";
    }
  };

  const getStatusBadgeColor = (status: UserStatus | RequestStatus | ReportStatus) => {
    switch (status) {
      case "Active":
      case "Completed":
      case "Resolved":
        return "bg-success text-success-foreground";
      case "Pending":
        return "bg-info text-info-foreground";
      case "In Progress":
        return "bg-warning text-warning-foreground";
      case "Suspended":
      case "Cancelled":
      case "Rejected":
        return "bg-muted text-muted-foreground";
      case "Banned":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getUrgencyBadgeColor = (urgency: UrgencyLevel) => {
    switch (urgency) {
      case "Low": return "bg-info text-info-foreground";
      case "Medium": return "bg-warning text-warning-foreground";
      case "High": return "bg-destructive text-destructive-foreground";
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground mb-6">System Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-8 text-center shadow-sm border-border/50">
          <Users className="w-10 h-10 mx-auto mb-3 text-info" />
          <div className="text-5xl font-bold text-foreground mb-2">{stats.totalUsers}</div>
          <div className="text-sm text-muted-foreground">Total Users</div>
        </Card>

        <Card className="p-8 text-center shadow-sm border-border/50">
          <CheckCircle className="w-10 h-10 mx-auto mb-3 text-success" />
          <div className="text-5xl font-bold text-foreground mb-2">{stats.activeUsers}</div>
          <div className="text-sm text-muted-foreground">Active Users</div>
        </Card>

        <Card className="p-8 text-center shadow-sm border-border/50">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 text-warning" />
          <div className="text-5xl font-bold text-foreground mb-2">{stats.pendingReports}</div>
          <div className="text-sm text-muted-foreground">Pending Reports</div>
        </Card>

        <Card className="p-8 text-center shadow-sm border-border/50">
          <HelpCircle className="w-10 h-10 mx-auto mb-3 text-primary" />
          <div className="text-5xl font-bold text-foreground mb-2">{stats.totalRequests}</div>
          <div className="text-sm text-muted-foreground">Total Requests</div>
        </Card>
      </div>
    </div>
  );

  const renderUserManagement = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground mb-6">User Management</h2>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-4">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="p-6 shadow-sm border-border/50">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <User className="w-6 h-6 text-muted-foreground" />
              </div>
              
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">{user.name}</h3>
                  <div className="flex gap-2">
                    <Badge className={getRoleBadgeColor(user.role)}>{user.role}</Badge>
                    <Badge className={getStatusBadgeColor(user.status)}>{user.status}</Badge>
                  </div>
                </div>
                
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {user.phone}
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {user.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Joined: {user.joinedDate}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedUser(user)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleSuspendUser(user.id)}
                  >
                    <UserX className="w-4 h-4 mr-2" />
                    Suspend
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderRequestOversight = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground mb-6">Request Oversight</h2>
      
      <Card className="p-6 shadow-sm border-border/50">
        <h3 className="text-base font-semibold text-foreground mb-4">All Help Requests</h3>
        
        <div className="space-y-4">
          {helpRequests.map((request) => (
            <Card key={request.id} className="p-5 bg-muted/50 shadow-sm border-border/50">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-foreground">{request.elderlyName}</h4>
                    <Badge className={getUrgencyBadgeColor(request.urgency)}>
                      {request.urgency} Priority
                    </Badge>
                  </div>
                  <Badge className={getStatusBadgeColor(request.status)}>
                    {request.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {request.location}
                </div>

                <p className="text-sm text-foreground">{request.description}</p>

                {request.volunteer && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="w-4 h-4" />
                    Volunteer: {request.volunteer}
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {request.timestamp}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedRequest(request)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                  {request.status === "Pending" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReassignVolunteer(request.id)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Reassign Volunteer
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderReportManagement = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground mb-6">Report Management</h2>
      
      <Card className="p-6 shadow-sm border-border/50">
        <h3 className="text-base font-semibold text-foreground mb-4">Pending Reports</h3>
        
        {reports.length === 0 ? (
          <div className="text-center py-12">
            <Flag className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">No pending reports to review.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <Card key={report.id} className="p-5 bg-muted/50 shadow-sm border-border/50">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground">
                        Report against {report.reportedUser}
                      </h4>
                      <Badge className={getRoleBadgeColor(report.reportedRole)}>
                        {report.reportedRole}
                      </Badge>
                    </div>
                    <Badge className={getStatusBadgeColor(report.status)}>
                      {report.status}
                    </Badge>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Reported by: {report.reporterName}
                  </div>

                  <p className="text-sm text-foreground">{report.reason}</p>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {report.timestamp}
                  </div>

                  {report.status === "Pending" && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedReport(report)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Review Report
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleResolveReport(report.id, "ban")}
                      >
                        <Ban className="w-4 h-4 mr-2" />
                        Ban User
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResolveReport(report.id, "reject")}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject Report
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );

  const renderReviewModeration = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground mb-6">Review Moderation</h2>
      
      <Card className="p-6 shadow-sm border-border/50">
        <h3 className="text-base font-semibold text-foreground mb-4">Flagged Reviews</h3>
        
        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">No flagged reviews to moderate.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id} className="p-5 bg-muted/50 shadow-sm border-border/50">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground">
                        {review.reviewerName} → {review.revieweeName}
                      </h4>
                      <div className="flex items-center gap-1 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={i < review.rating ? "text-warning" : "text-muted"}>★</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-foreground">{review.comment}</p>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {review.timestamp}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleRemoveReview(review.id)}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Remove Review
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-card border-b border-border p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">System Administration & Management</p>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {activeTab === "overview" && renderOverview()}
        {activeTab === "users" && renderUserManagement()}
        {activeTab === "requests" && renderRequestOversight()}
        {activeTab === "reports" && renderReportManagement()}
        {activeTab === "reviews" && renderReviewModeration()}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg">
        <div className="max-w-4xl mx-auto flex justify-around items-center py-3">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              activeTab === "overview"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Shield className="w-6 h-6" />
            <span className="text-xs">Overview</span>
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              activeTab === "users"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="w-6 h-6" />
            <span className="text-xs">Users</span>
          </button>

          <button
            onClick={() => setActiveTab("requests")}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              activeTab === "requests"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <HelpCircle className="w-6 h-6" />
            <span className="text-xs">Requests</span>
          </button>

          <button
            onClick={() => setActiveTab("reports")}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              activeTab === "reports"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Flag className="w-6 h-6" />
            <span className="text-xs">Reports</span>
          </button>

          <button
            onClick={() => setActiveTab("reviews")}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              activeTab === "reviews"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageSquare className="w-6 h-6" />
            <span className="text-xs">Reviews</span>
          </button>
        </div>
      </div>
    </div>
  );
}
