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
  const [actionType, setActionType] = useState<'suspend' | 'deactivate' | 'reactivate' | null>(null);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [suspensionDuration, setSuspensionDuration] = useState<7 | 30 | 90>(7);
  const [reportActionType, setReportActionType] = useState<'suspend' | 'deactivate' | 'reject' | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [isReviewingReport, setIsReviewingReport] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);

  // Fetch dashboard stats by getting all users and calculating stats
  const fetchStats = async () => {
    try {
      // Fetch all users first
      const response = await axios.get('/users/');
      if (response.data) {
        const allUsers = response.data;
        
        // Calculate stats from the user data
        const totalUsers = allUsers.length;
        const activeUsers = allUsers.filter(user => 
          (user.status || 'active') === 'active'
        ).length;
        const suspendedUsers = allUsers.filter(user => 
          user.status === 'suspended'
        ).length;
        const deactivatedUsers = allUsers.filter(user => 
          user.status === 'deactivated'
        ).length;
        
        setStats({
          totalUsers,
          activeUsers,
          suspendedUsers,
          deactivatedUsers,
          pendingReports: 0, // Will be updated when we implement reports
          totalRequests: 0   // Will be updated when we implement requests
        });
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
      const response = await axios.get('/users/');
      if (response.data) {
        // Transform the user data to match our interface
        const transformedUsers = response.data.map(user => ({
          userid: user.id,
          fullname: user.name || user.email?.split('@')[0] || 'Unknown User',
          email: user.email,
          phone: user.phone || 'Not provided',
          role: user.role || 'elderly', // Default to elderly if no role
          status: user.status || 'active', // Default to active if no status
          createdAt: user.created_at || new Date().toISOString(),
          profilePicture: user.avatar,
          online: user.online || false
        }));
        setUsers(transformedUsers);
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

  // Mock data for requests and reports (enhanced for testing)
  const helpRequests: HelpRequest[] = [];
  
  const reports: Report[] = [
    {
      id: "rpt-001",
      reporterName: "Sarah Chen",
      reportedUser: "John Smith",
      reportedRole: "volunteer",
      reason: "Inappropriate behavior during help session. Volunteer made inappropriate comments and showed unprofessional conduct.",
      status: "Pending",
      timestamp: "2024-10-01 10:30 AM",
      evidence: "Screenshot of messages, witness testimony"
    },
    {
      id: "rpt-002",
      reporterName: "Mary Johnson",
      reportedUser: "David Lee",
      reportedRole: "elderly",
      reason: "Abusive language and threatening behavior towards volunteer. Multiple incidents reported.",
      status: "In Progress",
      timestamp: "2024-09-30 2:15 PM",
      evidence: "Chat logs, audio recording"
    },
    {
      id: "rpt-003",
      reporterName: "Admin System",
      reportedUser: "Alex Wong",
      reportedRole: "volunteer",
      reason: "No-show for scheduled help sessions multiple times without notice. Pattern of unreliability.",
      status: "Pending",
      timestamp: "2024-09-29 9:00 AM",
      evidence: "Schedule logs, missed appointment records"
    }
  ];
  
  const reviews: Review[] = [
    {
      id: "rev-001",
      reviewerName: "Margaret Chen",
      revieweeName: "David Wong (Volunteer)",
      rating: 1,
      comment: "This volunteer is absolutely terrible! He's a complete idiot and I hate his stupid face. David Wong lives at 123 Main Street and his phone number is 555-0123. Never use him!",
      timestamp: "2024-10-05 2:30 PM",
      flagged: true
    },
    {
      id: "rev-002", 
      reviewerName: "Anonymous User",
      revieweeName: "Sarah Lim (Elderly)",
      rating: 2,
      comment: "I don't like Sarah's political views. She supports the wrong party and talks about politics all the time instead of focusing on the help I need. Also, she's from the LGBT community which I disagree with.",
      timestamp: "2024-10-04 4:15 PM",
      flagged: true
    },
    {
      id: "rev-003",
      reviewerName: "Tom Johnson", 
      revieweeName: "Alice Tan (Volunteer)",
      rating: 1,
      comment: "Alice is a b**** and she smells bad. Her real name is Alice Tan Wei Ling and she works at ABC Company on Orchard Road. Total waste of time and she's ugly too.",
      timestamp: "2024-10-03 11:45 AM",
      flagged: true
    },
    {
      id: "rev-004",
      reviewerName: "Linda Wong",
      revieweeName: "James Lee (Volunteer)", 
      rating: 1,
      comment: "This has nothing to do with the help provided but I wanted to say that I hate the government and think all politicians are corrupt. James was fine but I'm using this review to complain about my neighbor's dog.",
      timestamp: "2024-10-02 9:20 AM",
      flagged: true
    },
    {
      id: "rev-005",
      reviewerName: "Robert Chen",
      revieweeName: "Mary Ng (Elderly)",
      rating: 1,
      comment: "Mary Ng is a horrible person. Her IC number is S1234567A and she lives at Blk 123 Ang Mo Kio Ave 3 #05-67. She has a criminal record and shouldn't be on this platform. Her daughter works at the bank downtown.",
      timestamp: "2024-10-01 6:00 PM", 
      flagged: true
    },
    {
      id: "rev-006",
      reviewerName: "Patricia Lim",
      revieweeName: "Steven Koh (Volunteer)",
      rating: 1,
      comment: "Steven didn't show up on time and was very rude to me. When I asked him to help with groceries, he told me it wasn't his job and left early. Very unprofessional behavior and poor attitude.",
      timestamp: "2024-09-30 3:45 PM",
      flagged: false
    }
  ];

  const filteredUsers = users.filter(user =>
    user.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate suspension time remaining
  const getSuspensionTimeRemaining = (user: User): string | null => {
    if (user.status !== 'suspended') return null;
    
    // In a real implementation, this would come from user.suspensionEndDate
    // For now, return a mock calculation based on user ID for demonstration
    const mockEndDates = {
      'user1': new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
      'user2': new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
      'user3': new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
    };
    
    const suspensionEndDate = mockEndDates[user.userid as keyof typeof mockEndDates] || 
                            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 days
    
    const now = new Date();
    const timeRemaining = suspensionEndDate.getTime() - now.getTime();
    
    if (timeRemaining <= 0) return "Expires soon";
    
    const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));
    return `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining`;
  };

  // Handle user actions
  const openReasonModal = (action: 'suspend' | 'deactivate' | 'reactivate', userId: string) => {
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
   * USER MANAGEMENT - STATUS OVERVIEW ONLY:
   * 
   * USER MANAGEMENT PAGE (Status Management):
   *    VIEW: See all users with role, status, and join date filters
   *    STATUS MONITORING: View Active, Suspended, Deactivated users
   *    SUSPENSION COUNTDOWN: Show days remaining for suspended users (auto-unsuspend when expires)
   *    REACTIVATION: Manual admin reactivation for deactivated accounts (appeals/admin decision)
   *    
   *    Scope: Only elderly and volunteer users can be suspended/deactivated
   *    Note: Caregiver accounts remain permanently active - no suspension/deactivation allowed
   *          When elderly is suspended/deactivated, caregivers receive notifications but remain active
   * 
   * REPORTS PAGE (Disciplinary Actions):
   *    REVIEW REPORTS: Admin reviews submitted reports against users
   *    REPORT STATUS: Pending -> In Progress -> Resolved/Rejected
   *    DISCIPLINARY ACTIONS: Suspend (auto-expires) or Deactivate (manual reactivation) based on report review
   *    SCOPE: Elderly and volunteer users only - caregivers cannot be subject to disciplinary actions
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

  const handleReactivateUser = async () => {
    if (!targetUserId || !reasonText.trim()) return;
    
    setActionLoading(targetUserId);
    try {
      const response = await axios.post(`/api/admin/users/${targetUserId}/reactivate`, {
        reason: reasonText.trim()
      });
      
      if (response.data.success) {
        await fetchUsers(); // Refresh user list
        await fetchStats(); // Refresh stats
        setShowReasonModal(false);
        setReasonText("");
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

  // Report management functions
  const handleStartReportReview = async (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    
    // Check if report is already in progress
    if (report?.status === "In Progress") {
      toast({
        title: "Report Already Under Review",
        description: "This report is currently being reviewed by another admin. View in read-only mode.",
        variant: "destructive"
      });
      setSelectedReport(report);
      setShowEvidenceModal(true);
      return;
    }

    setIsReviewingReport(true);
    try {
      // Set report status to "In Progress"
      const response = await axios.post(`/api/admin/reports/${reportId}/start-review`);
      
      if (response.data.success) {
        // Find and select the report
        if (report) {
          setSelectedReport(report);
          toast({
            title: "Report Review Started",
            description: "Report status updated to In Progress",
          });
        }
      }
    } catch (error: any) {
      console.error('Failed to start report review:', error);
      
      if (error.response?.status === 409) {
        toast({
          title: "Report Already Assigned",
          description: "Another admin has started reviewing this report",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: error.response?.data?.error || "Failed to start report review",
          variant: "destructive"
        });
      }
    } finally {
      setIsReviewingReport(false);
    }
  };

  const openReportActionModal = (action: 'suspend' | 'deactivate' | 'reject', reportId: string) => {
    setReportActionType(action);
    setSelectedReportId(reportId);
    setReasonText("");
    setShowReasonModal(true);
  };

  const handleReportAction = async () => {
    if (!selectedReportId || !reportActionType) return;
    
    if (reportActionType !== 'reject' && !reasonText.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for this action",
        variant: "destructive"
      });
      return;
    }

    setActionLoading(selectedReportId);
    try {
      const response = await axios.post(`/api/admin/reports/${selectedReportId}/resolve`, {
        action: reportActionType,
        reason: reasonText.trim(),
        duration: reportActionType === 'suspend' ? suspensionDuration : undefined
      });
      
      if (response.data.success) {
        setShowReasonModal(false);
        setReasonText("");
        setSuspensionDuration(7);
        setReportActionType(null);
        setSelectedReportId(null);
        
        // Refresh data
        await fetchUsers();
        await fetchStats();
        
        toast({
          title: "Success",
          description: `Report resolved with ${reportActionType} action`,
        });
      }
    } catch (error: any) {
      console.error('Failed to resolve report:', error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to resolve report",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolveReport = (reportId: string, action: "deactivate" | "reject") => {
    openReportActionModal(action, reportId);
  };

  const handleRemoveReview = (reviewId: string) => {
    const review = reviews.find(r => r.id === reviewId);
    
    // In a real implementation, this would call an API
    console.log("Removing review:", reviewId);
    
    if (review) {
      toast({
        title: "Review Removed",
        description: `Review by ${review.reviewerName} has been permanently removed from the platform for policy violations.`,
        variant: "default"
      });
      
      // In a real app, you'd update the state or refetch data here
      // setReviews(reviews.filter(r => r.id !== reviewId));
    }
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
                
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-foreground">{user.fullname}</h3>
                    <div className="flex gap-2">
                      <Badge className={`${getRoleStyles(user.role)} text-base px-4 py-2`}>{user.role}</Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-base text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Phone className="w-5 h-5" />
                      {user.phone}
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      {user.email || "Not Provided"}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Joined: {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                    {/* Account Status Information */}
                    <div className="flex items-center gap-2 font-medium">
                      <User className="w-5 h-5" />
                      <span className={`${
                        user.status === 'active' ? 'text-green-600' :
                        user.status === 'suspended' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        Account Status: {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </span>
                    </div>
                    {user.status === "suspended" && (
                      <div className="flex items-center gap-2 text-yellow-600">
                        <Clock className="w-5 h-5" />
                        Unsuspends in: {getSuspensionTimeRemaining(user)}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-3 flex-wrap">
                    {/* Suspended accounts auto-unsuspend when duration expires */}
                    {user.status === "suspended" && (
                      <div className="px-3 py-2 text-sm bg-yellow-100 text-yellow-800 rounded-lg flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Auto-unsuspends: {getSuspensionTimeRemaining(user)}
                      </div>
                    )}
                    
                    {/* Manual reactivation for banned/deactivated accounts with valid reasoning */}
                    {user.status === "deactivated" && (user.role === "elderly" || user.role === "volunteer") && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600 hover:text-green-700"
                        onClick={() => openReasonModal('reactivate', user.userid)}
                        disabled={actionLoading === user.userid}
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        {actionLoading === user.userid ? 'Processing...' : 'Reactivate Account'}
                      </Button>
                    )}
                    
                    {/* Caregiver accounts remain permanently active */}
                    {user.role === "caregiver" && (
                      <div className="px-3 py-2 text-sm bg-blue-100 text-blue-800 rounded-lg flex items-center gap-1">
                        <UserCheck className="w-4 h-4" />
                        Active
                      </div>
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
      
      {/* Report Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{reports.filter(r => r.status === "Pending").length}</div>
          <div className="text-sm text-muted-foreground">Pending Reviews</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{reports.filter(r => r.status === "In Progress").length}</div>
          <div className="text-sm text-muted-foreground">In Progress</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{reports.filter(r => r.status === "Resolved").length}</div>
          <div className="text-sm text-muted-foreground">Resolved</div>
        </Card>
      </div>

      {/* Policy Notice */}
      <Card className="p-4 mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Caregiver Account Policy</h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Caregiver accounts remain active and cannot be suspended or deactivated. 
              When elderly accounts are banned/suspended, linked caregivers are notified but remain active to serve other elderly users.
            </p>
          </div>
        </div>
      </Card>

      {/* Pending Reports Section */}
      <Card className="p-6 shadow-sm border-border/50">
        <h3 className="text-base font-semibold text-foreground mb-4">Reports Requiring Review</h3>
        
        {reports.length === 0 ? (
          <div className="text-center py-12">
            <Flag className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">No reports to review.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <Card key={report.id} className={`p-5 shadow-sm border-border/50 ${
                report.status === "In Progress" ? "bg-yellow-50 dark:bg-yellow-900/20" :
                report.status === "Pending" ? "bg-blue-50 dark:bg-blue-900/20" :
                "bg-muted/50"
              }`}>
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground">
                        Report against {report.reportedUser}
                      </h4>
                      <div className="flex gap-2 mt-1">
                        <Badge className={getRoleStyles(report.reportedRole)}>
                          {report.reportedRole}
                        </Badge>
                        <Badge className={getStatusBadgeColor(report.status)}>
                          {report.status}
                        </Badge>
                        {report.status === "In Progress" && (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <User className="w-3 h-3 mr-1" />
                            Under Review by Admin
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Reported by: <span className="font-medium">{report.reporterName}</span>
                  </div>

                  <div className="bg-muted/30 p-3 rounded-lg">
                    <p className="text-sm text-foreground">{report.reason}</p>
                  </div>

                  {report.evidence && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <AlertCircle className="w-4 h-4" />
                      Evidence available: {report.evidence}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {report.timestamp}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2 flex-wrap">
                    {report.status === "Pending" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartReportReview(report.id)}
                          disabled={isReviewingReport}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          {isReviewingReport ? 'Starting Review...' : 'Start Review'}
                        </Button>
                      </>
                    )}
                    
                    {report.status === "In Progress" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedReport(report);
                            setShowEvidenceModal(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Evidence
                        </Button>
                        
                        {/* Disciplinary Actions - Only for elderly and volunteer */}
                        {(report.reportedRole === "elderly" || report.reportedRole === "volunteer") && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-yellow-600 hover:text-yellow-700"
                              onClick={() => openReportActionModal('suspend', report.id)}
                              disabled={actionLoading === report.id}
                            >
                              <UserX className="w-4 h-4 mr-2" />
                              Suspend User
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => openReportActionModal('deactivate', report.id)}
                              disabled={actionLoading === report.id}
                            >
                              <UserX className="w-4 h-4 mr-2" />
                              Ban User
                            </Button>
                          </>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-gray-600 hover:text-gray-700"
                          onClick={() => openReportActionModal('reject', report.id)}
                          disabled={actionLoading === report.id}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject Report
                        </Button>
                      </>
                    )}
                    
                    {report.status === "Resolved" && (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                  </div>
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
      
      {/* Review Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{reviews.length}</div>
          <div className="text-sm text-muted-foreground">Total Reviews</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{reviews.filter(r => r.flagged).length}</div>
          <div className="text-sm text-muted-foreground">Reported Reviews</div>
        </Card>
      </div>

      {/* Policy Notice */}
      <Card className="p-4 mb-6 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-1">Review Moderation</h4>
            <p className="text-sm text-orange-800 dark:text-orange-200">
              Remove reviews that contain inappropriate content, personal information, or are unrelated to the service provided. 
              Removed reviews will be permanently deleted and will not be visible to any users.
            </p>
          </div>
        </div>
      </Card>
      
      <Card className="p-6 shadow-sm border-border/50">
        <h3 className="text-base font-semibold text-foreground mb-4">All Reviews</h3>
        
        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">No reviews to moderate.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id} className="p-5 shadow-sm border-border/50 bg-muted/50">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground">
                        {review.reviewerName} → {review.revieweeName}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className={i < review.rating ? "text-yellow-500" : "text-gray-300"}>★</span>
                          ))}
                          <span className="text-sm text-muted-foreground ml-1">({review.rating}/5)</span>
                        </div>
                        {review.flagged && (
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Reported
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-background p-3 rounded-lg border">
                    <p className="text-sm text-foreground">"{review.comment}"</p>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {review.timestamp}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
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

      {/* Reason Modal - Updated for both user management and report actions */}
      {showReasonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">
              {reportActionType ? (
                reportActionType === 'reject' ? 'Reject Report' :
                reportActionType === 'suspend' ? 'Suspend User (Report Action)' :
                'Ban User (Report Action)'
              ) : (
                actionType === 'suspend' ? 'Suspend User' : 
                actionType === 'deactivate' ? 'Deactivate User' :
                'Reactivate User'
              )}
            </h3>
            
            {/* Suspension Duration Selection - Only for suspend actions */}
            {(actionType === 'suspend' || reportActionType === 'suspend') && (
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
              {reportActionType === 'reject' 
                ? 'Please provide a reason for rejecting this report:'
                : actionType === 'reactivate'
                ? 'Please provide a valid reason for reactivating this account (minimum 10 characters):'
                : 'Please provide a reason for this action (minimum 10 characters):'}
            </p>
            <Textarea
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              placeholder={reportActionType ? `Enter reason for ${reportActionType}...` : `Enter reason for ${actionType}...`}
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
                  setSuspensionDuration(7);
                  setReportActionType(null);
                  setSelectedReportId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={reportActionType ? handleReportAction : (
                  actionType === 'suspend' ? handleSuspendUser : 
                  actionType === 'deactivate' ? handleDeactivateUser :
                  handleReactivateUser
                )}
                disabled={(reportActionType !== 'reject' && actionType !== 'reactivate' && reasonText.trim().length < 10) || 
                         (actionType === 'reactivate' && reasonText.trim().length < 10) || 
                         actionLoading !== null}
                className={
                  reportActionType === 'suspend' || actionType === 'suspend' ? 'bg-yellow-600 hover:bg-yellow-700' :
                  reportActionType === 'deactivate' || actionType === 'deactivate' ? 'bg-red-600 hover:bg-red-700' :
                  actionType === 'reactivate' ? 'bg-green-600 hover:bg-green-700' :
                  'bg-gray-600 hover:bg-gray-700'
                }
              >
                {actionLoading ? 'Processing...' : (
                  reportActionType === 'suspend' || actionType === 'suspend' ? `Suspend User (${suspensionDuration} days)` :
                  reportActionType === 'deactivate' || actionType === 'deactivate' ? 'Ban User' :
                  actionType === 'reactivate' ? 'Reactivate Account' :
                  reportActionType === 'reject' ? 'Reject Report' : 'Confirm'
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Evidence Viewer Modal */}
      {showEvidenceModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Report Evidence</h3>
                  <p className="text-sm text-muted-foreground">
                    Report ID: {selectedReport.id} | Against: {selectedReport.reportedUser}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowEvidenceModal(false);
                    setSelectedReport(null);
                  }}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>

              {/* Report Details */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Reporter:</Label>
                  <p className="text-sm">{selectedReport.reporterName}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Reported User:</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm">{selectedReport.reportedUser}</span>
                    <Badge className={getRoleStyles(selectedReport.reportedRole)}>
                      {selectedReport.reportedRole}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Report Reason:</Label>
                  <div className="bg-muted/30 p-3 rounded-lg mt-1">
                    <p className="text-sm">{selectedReport.reason}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Evidence:</Label>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mt-1 border border-blue-200 dark:border-blue-800">
                    {selectedReport.evidence ? (
                      <div className="space-y-2">
                        <p className="text-sm text-blue-800 dark:text-blue-200">{selectedReport.evidence}</p>
                        
                        {/* Mock evidence items */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                          <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                            <div className="flex items-center gap-2 mb-2">
                              <MessageSquare className="w-4 h-4 text-blue-600" />
                              <span className="text-xs font-medium">Chat Log</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Conversation screenshots showing inappropriate behavior
                            </p>
                            <Button variant="outline" size="sm" className="mt-2 text-xs h-6">
                              View Details
                            </Button>
                          </div>
                          
                          <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                            <div className="flex items-center gap-2 mb-2">
                              <User className="w-4 h-4 text-green-600" />
                              <span className="text-xs font-medium">Witness Statement</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Third-party confirmation of the incident
                            </p>
                            <Button variant="outline" size="sm" className="mt-2 text-xs h-6">
                              Read Statement
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <AlertCircle className="w-12 h-12 mx-auto mb-2 text-orange-500" />
                        <p className="text-sm text-muted-foreground">Evidence retrieval error</p>
                        <Button variant="outline" size="sm" className="mt-2">
                          Retry
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Timestamp:</Label>
                  <p className="text-sm text-muted-foreground">{selectedReport.timestamp}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowEvidenceModal(false);
                    setSelectedReport(null);
                  }}
                >
                  Close
                </Button>
                
                {selectedReport.status === "In Progress" && (selectedReport.reportedRole === "elderly" || selectedReport.reportedRole === "volunteer") && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-yellow-600 hover:text-yellow-700"
                      onClick={() => {
                        setShowEvidenceModal(false);
                        openReportActionModal('suspend', selectedReport.id);
                      }}
                    >
                      <UserX className="w-4 h-4 mr-2" />
                      Suspend User
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {
                        setShowEvidenceModal(false);
                        openReportActionModal('deactivate', selectedReport.id);
                      }}
                    >
                      <UserX className="w-4 h-4 mr-2" />
                      Ban User
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-gray-600 hover:text-gray-700"
                      onClick={() => {
                        setShowEvidenceModal(false);
                        openReportActionModal('reject', selectedReport.id);
                      }}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject Report
                    </Button>
                  </>
                )}
              </div>
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
