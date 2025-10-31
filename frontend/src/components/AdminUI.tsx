import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  Users, 
  Flag, 
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  Eye,
  UserX,
  CheckCircle,
  AlertCircle,
  XCircle,
  User,
  Clock,
  RotateCcw,
  UserCheck,
  ChevronDown,
  LogOut
} from "lucide-react";
import { axiosInstance as axios } from "./axios";

type UserRole = "elderly" | "volunteer" | "caregiver" | "admin";
type UserStatus = "active" | "suspended" | "deactivated";
type ReportStatus = "Pending" | "In Progress" | "Resolved" | "Rejected";

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

interface Report {
  id: string;
  reporterName: string;
  reportedUser: string;
  reportedUserId: string;
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

export default function AdminUI() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    deactivatedUsers: 0,
    pendingReports: 0,
    inProgressReports: 0,
    resolvedReports: 0,
    rejectedReports: 0
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

  // Pagination and filtering states
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");
  const [dateFilter, setDateFilter] = useState<"newest" | "oldest" | "all">("all");

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
          inProgressReports: 0,
          resolvedReports: 0,
          rejectedReports: 0
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
          fullname: user.user_metadata?.displayName || user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown User',
          email: user.email,
          phone: user.user_metadata?.phone_number || user.user_metadata?.phone || 'Not provided',
          role: user.user_metadata?.role || 'elderly', // Default to elderly if no role
          status: user.user_metadata?.status || 'active', // Default to active if no status
          createdAt: user.created_at || new Date().toISOString(),
          profilePicture: user.user_metadata?.avatar_url || user.user_metadata?.avatar,
          online: user.user_metadata?.online || false
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

  // Fetch reports
  const fetchReports = async () => {
    try {
      const response = await axios.get('/admin/reports');
      if (response.data.success) {
        // Transform backend data to match frontend interface
        const transformedReports = response.data.data.reports.map(report => ({
          id: report.id,
          reporterName: report.reporter?.user_metadata?.name || report.reporter?.email?.split('@')[0] || 'Unknown User',
          reportedUser: report.reported?.user_metadata?.name || report.reported?.email?.split('@')[0] || 'Unknown User',
          reportedUserId: report.reported_user_id,
          reportedRole: report.reported?.user_metadata?.role || 'unknown',
          reason: report.reason,
          status: report.status === 'PENDING' ? 'Pending' : 
                  report.status === 'IN_PROGRESS' ? 'In Progress' :
                  report.status === 'RESOLVED' ? 'Resolved' : 'Rejected',
          timestamp: new Date(report.created_at).toLocaleString(),
          evidence: report.attachments?.length > 0 ? 'Available' : undefined
        }));
        setReports(transformedReports);
        
        // Update all report status counts in stats
        const pendingCount = transformedReports.filter(r => r.status === 'Pending').length;
        const inProgressCount = transformedReports.filter(r => r.status === 'In Progress').length;
        const resolvedCount = transformedReports.filter(r => r.status === 'Resolved').length;
        const rejectedCount = transformedReports.filter(r => r.status === 'Rejected').length;
        
        setStats(prev => ({ 
          ...prev, 
          pendingReports: pendingCount,
          inProgressReports: inProgressCount,
          resolvedReports: resolvedCount,
          rejectedReports: rejectedCount
        }));
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      toast({
        title: "Error",
        description: "Failed to load reports",
        variant: "destructive"
      });
    }
  };

  // Fetch reviews
  const fetchReviews = async () => {
    try {
      console.log('Fetching reviews from /admin/reviews...');
      const response = await axios.get('/admin/reviews');
      
      console.log('Reviews response:', response.data);
      
      if (response.data.success) {
        const reviewsData = response.data.data.reviews || [];
        console.log(`Found ${reviewsData.length} reviews`);
        
        if (reviewsData.length === 0) {
          setReviews([]);
          console.log('No reviews found in database');
          return;
        }
        
        const transformedReviews = reviewsData.map(review => ({
          id: review.id,
          reviewerName: review.author?.user_metadata?.name || review.author?.email?.split('@')[0] || 'Anonymous User',
          revieweeName: `${review.recipient?.user_metadata?.name || review.recipient?.email?.split('@')[0] || 'Unknown User'} (${review.recipient?.user_metadata?.role || 'User'})`,
          rating: review.rating,
          comment: review.text || '',
          timestamp: new Date(review.created_at).toLocaleString(),
          flagged: review.flagged || false
        }));
        setReviews(transformedReviews);
      } else {
        console.error('API returned success: false', response.data);
        throw new Error(response.data.error || 'Unknown API error');
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      
      let errorMessage = "Failed to load reviews";
      if (error.response?.status === 401) {
        errorMessage = "Authentication required. Please login as admin";
      } else if (error.response?.status === 403) {
        errorMessage = "Admin access required";
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchReports();
    fetchReviews();
  }, []);



  // Apply all filters
  const filteredUsers = users.filter(user => {
    // Role filter
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    
    // Status filter
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    
    return matchesRole && matchesStatus;
  });

  // Apply date sorting
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (dateFilter === "newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (dateFilter === "oldest") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return 0; // no sorting for "all"
  });

  // Apply pagination
  const totalPages = Math.ceil(sortedUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const paginatedUsers = sortedUsers.slice(startIndex, startIndex + usersPerPage);

  // Reset pagination when filters change
  const resetPagination = () => {
    setCurrentPage(1);
  };

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
  const handleSuspendUser = async (userId: string, duration: 7 | 30 | 90 = 7) => {
    setActionLoading(userId);
    try {
      const response = await axios.post(`/admin/users/${userId}/suspend`, {
        duration: duration
      });
      
      if (response.data.success) {
        await fetchUsers(); // Refresh user list
        await fetchStats(); // Refresh stats
        toast({
          title: "Success",
          description: `User suspended for ${duration} days`,
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

  const handleDeactivateUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      const response = await axios.post(`/admin/users/${userId}/deactivate`);
      
      if (response.data.success) {
        await fetchUsers(); // Refresh user list
        await fetchStats(); // Refresh stats
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
      const response = await axios.post(`/admin/users/${userId}/reactivate`);
      
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
      const response = await axios.post(`/admin/reports/${reportId}/start-review`);
      
      if (response.data.success) {
        // Refresh reports data
        await fetchReports();
        
        // Find and select the updated report
        const updatedReport = reports.find(r => r.id === reportId);
        if (updatedReport) {
          setSelectedReport({...updatedReport, status: "In Progress"});
        }
        
        toast({
          title: "Report Review Started",
          description: "Report status updated to In Progress",
        });
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

  const handleReportAction = async (action: 'suspend' | 'deactivate' | 'reject', reportId: string, duration: 7 | 30 | 90 = 7) => {
    if (!reportId) return;

    setActionLoading(reportId);
    try {
      const endpoint = action === 'reject' ? 
        `/admin/reports/${reportId}/reject` : 
        `/admin/reports/${reportId}/resolve`;
      
      const response = await axios.post(endpoint, {
        action: action !== 'reject' ? action : undefined,
        reason: `Admin action: ${action}${duration && action === 'suspend' ? ` for ${duration} days` : ''}`,
        duration: action === 'suspend' ? duration : undefined
      });
      
      if (response.data.success) {
        // Refresh data
        await fetchReports();
        await fetchUsers();
        await fetchStats();
        
        // Close modals
        setShowEvidenceModal(false);
        setSelectedReport(null);
        
        toast({
          title: "Success",
          description: action === 'reject' ? 
            "Report rejected successfully" : 
            `Report resolved with ${action} action`,
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

  const handleRemoveReview = async (reviewId: string) => {
    const review = reviews.find(r => r.id === reviewId);
    
    if (!review) return;
    
    setActionLoading(reviewId);
    try {
      const response = await axios.delete(`/admin/reviews/${reviewId}`, {
        data: { reason: 'Review removed for policy violation' }
      });
      
      if (response.data.success) {
        // Refresh reviews data
        await fetchReviews();
        
        toast({
          title: "Review Removed",
          description: `Review by ${review.reviewerName} has been permanently removed from the platform for policy violations.`,
        });
      }
    } catch (error: any) {
      console.error('Failed to remove review:', error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to remove review",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
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

  const getStatusBadgeColor = (status: UserStatus | ReportStatus) => {
    switch (status) {
      case "active":
      case "Resolved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "Pending":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "In Progress":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "suspended":
      case "Rejected":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      case "deactivated":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground mb-6">System Overview</h2>
      
      {/* User Statistics */}
      <div>
        <h3 className="text-lg font-semibold mb-3">User Statistics</h3>
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
        </div>
      </div>

      {/* Report Statistics */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Report Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 text-center shadow-sm border-border/50">
            <Flag className="w-8 h-8 mx-auto mb-3 text-blue-600" />
            <div className="text-3xl font-bold text-foreground mb-1">{stats.pendingReports}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </Card>

          <Card className="p-6 text-center shadow-sm border-border/50">
            <Clock className="w-8 h-8 mx-auto mb-3 text-yellow-600" />
            <div className="text-3xl font-bold text-foreground mb-1">{stats.inProgressReports}</div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </Card>

          <Card className="p-6 text-center shadow-sm border-border/50">
            <CheckCircle className="w-8 h-8 mx-auto mb-3 text-green-600" />
            <div className="text-3xl font-bold text-foreground mb-1">{stats.resolvedReports}</div>
            <div className="text-sm text-muted-foreground">Resolved</div>
          </Card>

          <Card className="p-6 text-center shadow-sm border-border/50">
            <XCircle className="w-8 h-8 mx-auto mb-3 text-red-600" />
            <div className="text-3xl font-bold text-foreground mb-1">{stats.rejectedReports}</div>
            <div className="text-sm text-muted-foreground">Rejected</div>
          </Card>
        </div>
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
            onClick={() => setActiveTab("reviews")}
          >
            <MessageSquare className="w-6 h-6" />
            <span>Moderate Reviews</span>
            <span className="text-xs text-muted-foreground">{reviews.filter(r => r.flagged).length} reviews removed</span>
          </Button>
        </div>
      </Card>
    </div>
  );

  const renderUserManagement = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground mb-6">User Management</h2>
      
      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Role Filter */}
          <div>
            <Label className="text-sm font-medium mb-2 block">User Type</Label>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as UserRole | "all");
                resetPagination();
              }}
              className="w-full p-2 border border-input rounded-md bg-background text-sm"
            >
              <option value="all">All Roles</option>
              <option value="elderly">Elderly</option>
              <option value="volunteer">Volunteer</option>
              <option value="caregiver">Caregiver</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Account Status</Label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as UserStatus | "all");
                resetPagination();
              }}
              className="w-full p-2 border border-input rounded-md bg-background text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="deactivated">Deactivated</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Date Joined</Label>
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value as "newest" | "oldest" | "all");
                resetPagination();
              }}
              className="w-full p-2 border border-input rounded-md bg-background text-sm"
            >
              <option value="all">Default Order</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
          <div>
            Showing {startIndex + 1}-{Math.min(startIndex + usersPerPage, sortedUsers.length)} of {sortedUsers.length} users
            {(roleFilter !== "all" || statusFilter !== "all" || dateFilter !== "all") && (
              <span className="ml-2">
                (filtered from {users.length} total)
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {roleFilter !== "all" && (
              <Badge variant="secondary" className="text-xs">
                Role: {roleFilter}
                <button 
                  onClick={() => {setRoleFilter("all"); resetPagination();}}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            )}
            {statusFilter !== "all" && (
              <Badge variant="secondary" className="text-xs">
                Status: {statusFilter}
                <button 
                  onClick={() => {setStatusFilter("all"); resetPagination();}}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            )}
            {dateFilter !== "all" && (
              <Badge variant="secondary" className="text-xs">
                Sort: {dateFilter === "newest" ? "Newest First" : "Oldest First"}
                <button 
                  onClick={() => {setDateFilter("all"); resetPagination();}}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            )}
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading users...</p>
          </div>
        ) : paginatedUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">No users found matching your criteria.</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setRoleFilter("all");
                setStatusFilter("all");
                setDateFilter("all");
                resetPagination();
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          paginatedUsers.map((user) => (
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
                        onClick={() => handleReactivateUser(user.userid)}
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3"
              >
                First
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3"
              >
                Previous
              </Button>
              
              {/* Page Numbers */}
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let page;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3"
              >
                Next
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3"
              >
                Last
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground">
              {sortedUsers.length} total users
            </div>
          </div>
        </Card>
      )}
    </div>
  );



  const renderReportManagement = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground mb-6">Report Management</h2>
      
      <Card className="p-6 shadow-sm border-border/50">
        <h3 className="text-base font-semibold text-foreground mb-4">All Reports</h3>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12">
            <Flag className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">No reports found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Reported User ID</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-mono text-xs">{report.id.slice(0, 8)}...</TableCell>
                    <TableCell className="font-mono text-xs">{report.reportedUserId?.slice(0, 8) || 'N/A'}...</TableCell>
                    <TableCell className="max-w-xs truncate">{report.reason}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(report.status)}>
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {report.status === "Pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStartReportReview(report.id)}
                            disabled={actionLoading === report.id}
                          >
                            {actionLoading === report.id ? 'Processing...' : 'Start Review'}
                          </Button>
                        )}
                        
                        {report.status === "In Progress" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                setActionLoading(report.id);
                                try {
                                  const response = await axios.post(`/admin/reports/${report.id}/resolve`, {
                                    note: 'Report resolved by admin'
                                  });
                                  if (response.data.success) {
                                    await fetchReports();
                                    toast({
                                      title: "Success",
                                      description: "Report resolved successfully",
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
                              }}
                              disabled={actionLoading === report.id}
                            >
                              {actionLoading === report.id ? 'Processing...' : 'Resolve'}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={async () => {
                                setActionLoading(report.id);
                                try {
                                  const response = await axios.post(`/admin/reports/${report.id}/reject`, {
                                    note: 'Report rejected by admin'
                                  });
                                  if (response.data.success) {
                                    await fetchReports();
                                    toast({
                                      title: "Success",
                                      description: "Report rejected successfully",
                                    });
                                  }
                                } catch (error: any) {
                                  console.error('Failed to reject report:', error);
                                  toast({
                                    title: "Error",
                                    description: error.response?.data?.error || "Failed to reject report",
                                    variant: "destructive"
                                  });
                                } finally {
                                  setActionLoading(null);
                                }
                              }}
                              disabled={actionLoading === report.id}
                            >
                              {actionLoading === report.id ? 'Processing...' : 'Reject'}
                            </Button>
                          </>
                        )}
                        
                        {report.status === "Resolved" && (
                          <span className="text-sm text-muted-foreground">Completed</span>
                        )}
                        
                        {report.status === "Rejected" && (
                          <span className="text-sm text-muted-foreground">Rejected</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );

  const renderReviewModeration = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground mb-6">Review Moderation</h2>

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
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center justify-center gap-2 flex-1">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            className="gap-2"
            onClick={async () => {
              try {
                await axios.post('/auth/logout', {}, {
                  withCredentials: true,
                });
                window.location.href = '/login';
              } catch (err) {
                console.error('Logout failed:', err);
                toast({
                  title: "Error",
                  description: "Logout failed. Please try again.",
                  variant: "destructive"
                });
              }
            }}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">System Administration & Management</p>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {activeTab === "overview" && renderOverview()}
        {activeTab === "users" && renderUserManagement()}
        {activeTab === "reports" && renderReportManagement()}
        {activeTab === "reviews" && renderReviewModeration()}
      </div>



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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-yellow-600 hover:text-yellow-700"
                        >
                          <UserX className="w-4 h-4 mr-2" />
                          Suspend User
                          <ChevronDown className="w-4 h-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => {
                          setShowEvidenceModal(false);
                          handleReportAction('suspend', selectedReport.id, 7);
                        }}>
                          <div className="flex flex-col">
                            <span className="font-medium">7 days (Minor)</span>
                            <span className="text-xs text-muted-foreground">For minor or first-time misconduct</span>
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setShowEvidenceModal(false);
                          handleReportAction('suspend', selectedReport.id, 30);
                        }}>
                          <div className="flex flex-col">
                            <span className="font-medium">30 days (Moderate)</span>
                            <span className="text-xs text-muted-foreground">For moderate or repeated misconduct</span>
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setShowEvidenceModal(false);
                          handleReportAction('suspend', selectedReport.id, 90);
                        }}>
                          <div className="flex flex-col">
                            <span className="font-medium">90 days (Serious)</span>
                            <span className="text-xs text-muted-foreground">For serious misconduct</span>
                          </div>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {
                        setShowEvidenceModal(false);
                        handleReportAction('deactivate', selectedReport.id);
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
                        handleReportAction('reject', selectedReport.id);
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
