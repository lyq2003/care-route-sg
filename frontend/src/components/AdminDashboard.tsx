import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
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
  UserX,
  Edit,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  MapPin,
  User,
  Menu,
  RotateCcw,
  UserCheck
} from "lucide-react";
import { axiosInstance as axios } from "./axios";

type UserRole = "elderly" | "volunteer" | "caregiver" | "admin";
type UserStatus = "active" | "suspended" | "deactivated";
type RequestStatus = "Pending" | "In Progress" | "Completed" | "Cancelled";
type ReportStatus = "Pending" | "In Progress" | "Resolved" | "Rejected";
type UrgencyLevel = "Low" | "Medium" | "High";

interface User {
  userid: string;
  fullname: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  profilePicture?: string;
  online?: boolean;
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
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<HelpRequest | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    deactivatedUsers: 0,
    pendingReports: 0,
    totalRequests: 0
  });
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reasonText, setReasonText] = useState("");
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [actionType, setActionType] = useState<'suspend' | 'deactivate' | null>(null);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [suspensionDuration, setSuspensionDuration] = useState<7 | 30 | 90>(7);

  // Fetch dashboard stats
  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/admin/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive"
      });
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/users', {
        params: {
          page: 1,
          limit: 50
        }
      });
      if (response.data.success) {
        setUsers(response.data.data.users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, []);

  // Mock data for requests and reports (since we're focusing on user management)
  const helpRequests: HelpRequest[] = [];
  const reports: Report[] = [];
  const reviews: Review[] = [];

  const filteredUsers = users.filter(user =>
    user.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle user actions
  const openReasonModal = (action: 'suspend' | 'deactivate', userId: string) => {
    setActionType(action);
    setTargetUserId(userId);
    setReasonText("");
    setShowReasonModal(true);
  };

  const handleSuspendUser = async () => {
    if (!targetUserId || !reasonText.trim()) return;
    
    setActionLoading(targetUserId);
    try {
      const response = await axios.post(`/api/admin/users/${targetUserId}/suspend`, {
        reason: reasonText.trim(),
        duration: suspensionDuration // Add suspension duration to API call
      });
      
      if (response.data.success) {
        await fetchUsers(); // Refresh user list
        await fetchStats(); // Refresh stats
        setShowReasonModal(false);
        setReasonText("");
        setSuspensionDuration(7); // Reset to default
        toast({
          title: "Success",
          description: `User suspended for ${suspensionDuration} days`,
        });
      }
    } catch (error: any) {
      console.error('Failed to suspend user:', error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to suspend user. Please try again.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  /*
   * USER MANAGEMENT ACTIONS - TWO CONTEXTS:
   * 
   * 1. DIRECT USER MANAGEMENT (Admin Dashboard):
   *    SUSPEND: Temporary disciplinary action (reversible)
   *      - Scope: elderly, volunteer, caregiver users only
   *      - Use case: Policy violations, temporary punishment
   *    
   *    DEACTIVATE: Account closure (reversible)
   *      - Scope: elderly, volunteer, caregiver users only  
   *      - Use case: Account closure, inactivity
   *    
   *    REACTIVATE: Restore suspended or deactivated account
   *      - Scope: elderly, volunteer, caregiver users only
   * 
   * 2. REPORT RESOLUTION (Report Dashboard):
   *    DEACTIVATE: Ban equivalent action (reversible but treated as permanent)
   *      - Scope: elderly, volunteer users only (NOT caregiver)
   *      - Use case: Abuse reports, serious violations
   *      - Note: Same API endpoint as direct deactivate, but stricter role restrictions
   *    
   *    REJECT: Dismiss report with no action taken
   */

  const handleDeactivateUser = async () => {
    if (!targetUserId || !reasonText.trim()) return;
    
    setActionLoading(targetUserId);
    try {
      const response = await axios.post(`/api/admin/users/${targetUserId}/deactivate`, {
        reason: reasonText.trim()
      });
      
      if (response.data.success) {
        await fetchUsers(); // Refresh user list
        await fetchStats(); // Refresh stats
        setShowReasonModal(false);
        setReasonText("");
        toast({
          title: "Success",
          description: "User deactivated successfully",
        });
      }
    } catch (error: any) {
      console.error('Failed to deactivate user:', error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to deactivate user. Please try again.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivateUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      const response = await axios.post(`/api/admin/users/${userId}/reactivate`);
      
      if (response.data.success) {
        await fetchUsers(); // Refresh user list
        await fetchStats(); // Refresh stats
        toast({
          title: "Success",
          description: "User reactivated successfully",
        });
      }
    } catch (error: any) {
      console.error('Failed to reactivate user:', error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to reactivate user. Please try again.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReassignVolunteer = (requestId: string) => {
    console.log("Reassigning volunteer for request:", requestId);
    // Implementation would open volunteer selection
  };

  const handleResolveReport = (reportId: string, action: "deactivate" | "reject") => {
    console.log(`${action === "deactivate" ? "Deactivating user for" : "Rejecting"} report:`, reportId);
    // REPORT RESOLUTION LOGIC:
    // - "deactivate" = ban equivalent (only for elderly and volunteer users in reports)
    // - "reject" = no action taken, report dismissed
    // Note: This is different from direct user management where suspend/deactivate applies to elderly, volunteer, caregiver
  };

  const handleRemoveReview = (reviewId: string) => {
    console.log("Removing review:", reviewId);
    // Implementation would delete review
  };

  const getRoleStyles = (role: UserRole) => {
    switch(role) {
      case "elderly": return "bg-accent text-accent-foreground";
      case "volunteer": return "bg-success text-success-foreground";
      case "caregiver": return "bg-warning text-warning-foreground";
      case "admin": return "bg-destructive text-destructive-foreground";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const getStatusBadgeColor = (status: UserStatus | RequestStatus | ReportStatus) => {
    switch (status) {
      case "active":
      case "Completed":
      case "Resolved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "Pending":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "In Progress":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "suspended":
      case "Cancelled":
      case "Rejected":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      case "deactivated":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 text-center shadow-sm border-border/50">
          <Users className="w-8 h-8 mx-auto mb-3 text-blue-600" />
          <div className="text-3xl font-bold text-foreground mb-1">{stats.totalUsers}</div>
          <div className="text-sm text-muted-foreground">Total Users</div>
        </Card>

        <Card className="p-6 text-center shadow-sm border-border/50">
          <CheckCircle className="w-8 h-8 mx-auto mb-3 text-green-600" />
          <div className="text-3xl font-bold text-foreground mb-1">{stats.activeUsers}</div>
          <div className="text-sm text-muted-foreground">Active Users</div>
        </Card>

        <Card className="p-6 text-center shadow-sm border-border/50">
          <UserX className="w-8 h-8 mx-auto mb-3 text-yellow-600" />
          <div className="text-3xl font-bold text-foreground mb-1">{stats.suspendedUsers}</div>
          <div className="text-sm text-muted-foreground">Suspended Users</div>
        </Card>

        <Card className="p-6 text-center shadow-sm border-border/50">
          <AlertCircle className="w-8 h-8 mx-auto mb-3 text-orange-600" />
          <div className="text-3xl font-bold text-foreground mb-1">{stats.deactivatedUsers}</div>
          <div className="text-sm text-muted-foreground">Deactivated Users</div>
        </Card>

        <Card className="p-6 text-center shadow-sm border-border/50">
          <Flag className="w-8 h-8 mx-auto mb-3 text-purple-600" />
          <div className="text-3xl font-bold text-foreground mb-1">{stats.pendingReports}</div>
          <div className="text-sm text-muted-foreground">Pending Reports</div>
        </Card>

        <Card className="p-6 text-center shadow-sm border-border/50">
          <HelpCircle className="w-8 h-8 mx-auto mb-3 text-indigo-600" />
          <div className="text-3xl font-bold text-foreground mb-1">{stats.totalRequests}</div>
          <div className="text-sm text-muted-foreground">Total Requests</div>
        </Card>
      </div>
      
      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            variant="outline" 
            className="p-4 h-auto flex flex-col gap-2"
            onClick={() => setActiveTab("users")}
          >
            <Users className="w-6 h-6" />
            <span>Manage Users</span>
            <span className="text-xs text-muted-foreground">{stats.totalUsers} total users</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="p-4 h-auto flex flex-col gap-2"
            onClick={() => setActiveTab("reports")}
          >
            <Flag className="w-6 h-6" />
            <span>Review Reports</span>
            <span className="text-xs text-muted-foreground">{stats.pendingReports} pending</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="p-4 h-auto flex flex-col gap-2"
            onClick={() => setActiveTab("requests")}
          >
            <HelpCircle className="w-6 h-6" />
            <span>Monitor Requests</span>
            <span className="text-xs text-muted-foreground">{stats.totalRequests} total</span>
          </Button>
        </div>
      </Card>
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
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading users...</p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <Card key={user.userid} className="p-6 shadow-sm border-border/50">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-6 h-6 text-muted-foreground" />
                </div>
                
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">{user.fullname}</h3>
                    <div className="flex gap-2">
                      <Badge className={getRoleStyles(user.role)}>{user.role}</Badge>
                      <Badge className={getStatusBadgeColor(user.status)}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </Badge>
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
                      Joined: {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                    {user.online && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Online
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedUser(user)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    
                    {user.status === "active" && (
                      <>
                        {/* SUSPEND: Temporary disciplinary action - elderly, volunteer, caregiver only */}
                        {(user.role === "elderly" || user.role === "volunteer" || user.role === "caregiver") && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-yellow-600 hover:text-yellow-700"
                            onClick={() => openReasonModal('suspend', user.userid)}
                            disabled={actionLoading === user.userid}
                          >
                            <UserX className="w-4 h-4 mr-2" />
                            {actionLoading === user.userid ? 'Processing...' : 'Suspend'}
                          </Button>
                        )}
                        
                        {/* DEACTIVATE: Account closure/ban equivalent - elderly, volunteer, caregiver only */}
                        {user.role !== "admin" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-orange-600 hover:text-orange-700"
                            onClick={() => openReasonModal('deactivate', user.userid)}
                            disabled={actionLoading === user.userid}
                          >
                            <UserX className="w-4 h-4 mr-2" />
                            {actionLoading === user.userid ? 'Processing...' : 'Deactivate'}
                          </Button>
                        )}
                      </>
                    )}
                    
                    {/* REACTIVATE: Restore suspended or deactivated accounts - any non-admin user */}
                    {(user.status === "suspended" || user.status === "deactivated") && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600 hover:text-green-700"
                        onClick={() => handleReactivateUser(user.userid)}
                        disabled={actionLoading === user.userid}
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        {actionLoading === user.userid ? 'Processing...' : 'Reactivate'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
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
                      <Badge className={getRoleStyles(report.reportedRole)}>
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
                        onClick={() => handleResolveReport(report.id, "deactivate")}
                      >
                        <UserX className="w-4 h-4 mr-2" />
                        Deactivate User
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

      {/* Reason Modal */}
      {showReasonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">
              {actionType === 'suspend' ? 'Suspend User' : 'Deactivate User'}
            </h3>
            
            {/* Suspension Duration Selection */}
            {actionType === 'suspend' && (
              <div className="mb-4">
                <Label className="text-sm font-medium mb-3 block">Suspension Duration:</Label>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <input
                      type="radio"
                      id="duration-7"
                      name="duration"
                      value="7"
                      checked={suspensionDuration === 7}
                      onChange={(e) => setSuspensionDuration(parseInt(e.target.value) as 7 | 30 | 90)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label htmlFor="duration-7" className="font-medium cursor-pointer">7 days (short)</Label>
                      <p className="text-xs text-muted-foreground">For minor or first-time misconduct</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <input
                      type="radio"
                      id="duration-30"
                      name="duration"
                      value="30"
                      checked={suspensionDuration === 30}
                      onChange={(e) => setSuspensionDuration(parseInt(e.target.value) as 7 | 30 | 90)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label htmlFor="duration-30" className="font-medium cursor-pointer">30 days (medium)</Label>
                      <p className="text-xs text-muted-foreground">For moderate or repeated misconduct</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <input
                      type="radio"
                      id="duration-90"
                      name="duration"
                      value="90"
                      checked={suspensionDuration === 90}
                      onChange={(e) => setSuspensionDuration(parseInt(e.target.value) as 7 | 30 | 90)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label htmlFor="duration-90" className="font-medium cursor-pointer">90 days (long)</Label>
                      <p className="text-xs text-muted-foreground">For serious misconduct that does not yet warrant permanent action</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <p className="text-sm text-muted-foreground mb-4">
              Please provide a reason for this action (minimum 10 characters):
            </p>
            <Textarea
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              placeholder={`Enter reason for ${actionType}...`}
              className="mb-4"
              rows={3}
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowReasonModal(false);
                  setReasonText("");
                  setSuspensionDuration(7); // Reset to default
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={actionType === 'suspend' ? handleSuspendUser : handleDeactivateUser}
                disabled={reasonText.trim().length < 10 || actionLoading !== null}
                className={actionType === 'suspend' ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-orange-600 hover:bg-orange-700'}
              >
                {actionLoading ? 'Processing...' : (actionType === 'suspend' ? `Suspend User (${suspensionDuration} days)` : 'Deactivate User')}
              </Button>
            </div>
          </Card>
        </div>
      )}

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
