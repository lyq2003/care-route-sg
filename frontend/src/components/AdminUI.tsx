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
  LogOut,
  FileImage,
  FileText,
  Download,
  ExternalLink,
  Paperclip
} from "lucide-react";
import { axiosInstance } from "./axios";

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
  suspensionTimeRemaining?: {
  expired: boolean;
  daysRemaining: number;
  message: string;
  };
}

interface Attachment {
  id: string;
  url: string;
  content_type: string;
  size_bytes: number;
  uploaded_by_user_id: string;
  created_at: string;
}

interface Report {
  id: string;
  reporterName: string;
  reporterRole: UserRole;
  reportedUser: string;
  reportedUserId: string;
  reportedRole: UserRole;
  reason: string;
  description?: string;
  status: ReportStatus;
  timestamp: string;
  evidence?: string;
  attachments?: Attachment[];
}

interface Review {
  id: string;
  author_user_id: string;
  recipient_user_id: string;
  rating: number;
  text?: string;
  comment?: string;
  created_at: string;
  flagged?: boolean;
  author?: {
    name?: string;
    full_name?: string;
    role?: UserRole;
  };
  recipient?: {
    name?: string;
    full_name?: string;
    role?: UserRole;
  };
}

// Helper functions for file handling
const getFileIcon = (contentType: string) => {
  if (contentType.startsWith('image/')) {
    return <FileImage className="w-4 h-4" />;
  } else if (contentType.includes('pdf')) {
    return <FileText className="w-4 h-4 text-red-600" />;
  } else if (contentType.includes('text')) {
    return <FileText className="w-4 h-4" />;
  } else {
    return <Paperclip className="w-4 h-4" />;
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileName = (url: string): string => {
  const parts = url.split('/');
  return parts[parts.length - 1] || 'Unknown File';
};

export default function AdminUI() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
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
      const response = await axiosInstance.get('/users/');
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
        pendingReports: 0,
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
      const response = await axiosInstance.get('/users');
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
      const response = await axiosInstance.get('/admin/reports');
      if (response.data.success) {
        // Debug: Log the raw report data to see what fields are available
        console.log('Raw report data from backend:', response.data.data.reports[0]);
        
        // Transform backend data to match frontend interface
        const transformedReports = response.data.data.reports.map(report => ({
          id: report.id,
          reporterName: report.reporter?.name || report.reporter?.full_name || report.reporter?.email?.split('@')[0] || 'Unknown User',
          reporterRole: report.reporter?.role || 'elderly',
          reportedUser: report.reported?.name || report.reported?.full_name || report.reported?.email?.split('@')[0] || 'Unknown User',
          reportedUserId: report.reported_user_id,
          reportedRole: report.reported?.role || 'elderly',
          reason: report.reason,
          description: report.description || '',
          status: report.status === 'PENDING' ? 'Pending' : 
                  report.status === 'IN_PROGRESS' ? 'In Progress' :
                  report.status === 'RESOLVED' ? 'Resolved' : 'Rejected',
          timestamp: new Date(report.created_at).toLocaleString(),
          evidence: report.attachments?.length > 0 ? 'Available' : undefined,
          attachments: report.attachments || []
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
    setIsLoadingReviews(true);
    try {
      console.log('Fetching reviews from /admin/reviews...');
      const res = await axiosInstance.get('/admin/reviews');
      console.log('Reviews API response:', res.data);
      
      if (res.data && res.data.success && res.data.data && res.data.data.reviews) {
        setReviews(res.data.data.reviews);
        console.log('Set reviews:', res.data.data.reviews.length, 'reviews');
      } else if (res.data && Array.isArray(res.data)) {
        setReviews(res.data);
        console.log('Set reviews (direct array):', res.data.length, 'reviews');
      } else {
        console.log('No reviews found in response');
        setReviews([]);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error.response?.data || error.message);
      toast({ 
        title: "Failed to load reviews", 
        description: error.response?.data?.error || error.message,
        variant: "destructive" 
      });
    } finally {
      setIsLoadingReviews(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchReports();
    fetchReviews();
  }, []);

  useEffect(() => {
    if (activeTab === "reviews" || activeTab === "Reviews") {
      fetchReviews();
    }
  }, [activeTab]);



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
    if (user.status !== 'suspended' || !user.suspensionTimeRemaining) return null;
    
    if (user.suspensionTimeRemaining.expired) {
      return "Expired";
    }
    
    return user.suspensionTimeRemaining.message;
  };

  // Get display status for user
  const getDisplayStatus = (user: User): string => {
    if (user.status === 'suspended') {
      const timeRemaining = getSuspensionTimeRemaining(user);
      return timeRemaining ? `Suspended for ${timeRemaining}` : 'Suspended';
    } else if (user.status === 'deactivated') {
      return 'Banned';
    }
    return 'Active';
  };

  // Handle user actions
  const handleSuspendUser = async (userId: string, duration: 7 | 30 | 90 = 7) => {
    setActionLoading(userId);
    try {
      const response = await axiosInstance.post(`/admin/users/${userId}/suspend`, {
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
      const response = await axiosInstance.post(`/admin/users/${userId}/deactivate`);
      
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
      const response = await axiosInstance.post(`/admin/users/${userId}/reactivate`);
      
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
  /*
   * REPORT WORKFLOW:
   * 1. All reports start in "Pending" state
   * 2. Admin clicks "Begin Review" → Status changes to "In Progress"
   * 3. Admin takes action (Suspend/Ban/Reject) → Status changes to "Resolved" or "Rejected"
   */
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
      const response = await axiosInstance.post(`/admin/reports/${reportId}/start-review`);
      
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

      const response = await axiosInstance.post(endpoint, {
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

  const handleDeleteReview = async (reviewId: string) => {
    try {
      // Show loading toast
      toast({ title: "Deleting review...", description: `Review ID: ${reviewId}` });
      
      const response = await axiosInstance.delete(`/admin/reviews/${reviewId}`);
      
      toast({ 
        title: "Review removed successfully", 
        description: `Review ${reviewId} has been deleted`,
        variant: "default" 
      });
      fetchReviews();
    } catch (error: any) {
      // Show detailed error information in the toast
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      const statusCode = error.response?.status || 'No status';
      
      // If authentication failed, redirect to login
      if (statusCode === 401) {
        toast({ 
          title: "Session Expired", 
          description: "Please log in again. Redirecting to login page...",
          variant: "destructive" 
        });
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }
      
      const errorDetails = error.response?.data?.debug || {};
      
      toast({ 
        title: "Failed to remove review", 
        description: `Error: ${errorMessage} (Status: ${statusCode})`,
        variant: "destructive" 
      });
      
      // Show a second toast with more details if available
      if (Object.keys(errorDetails).length > 0) {
        setTimeout(() => {
          toast({
            title: "Debug Info",
            description: `User Role: ${errorDetails.userRole || 'unknown'}, Session Role: ${errorDetails.sessionRole || 'unknown'}`,
            variant: "destructive"
          });
        }, 1000);
      }
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
                        Account Status: {getDisplayStatus(user)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 flex-wrap">
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
                        {actionLoading === user.userid ? 'Processing...' : 'Unban User'}
                      </Button>
                    )}
                    
                    {/* Caregiver accounts remain permanently active */}
                    {user.role === "caregiver" && (
                      <div className="px-3 py-2 text-sm bg-blue-100 text-blue-800 rounded-lg flex items-center gap-1">
                        <UserCheck className="w-4 h-4" />
                        Caregiver cannot be suspended/banned
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
          <div className="space-y-6">
            {reports.map((report) => (
              <Card key={report.id} className="p-8 shadow-sm border-border/50">
                <div className="space-y-6">
                  {/* Header Row */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                        <Flag className="w-6 h-6 text-red-600" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-4">
                          <span className="font-semibold text-foreground text-lg">Report #{report.id}</span>
                          <Badge className={`${getStatusBadgeColor(report.status)} px-4 py-2 text-sm font-medium`}>
                            {report.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{report.timestamp}</p>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-2">
                      {report.status === "Pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartReportReview(report.id)}
                          disabled={actionLoading === report.id}
                        >
                          {actionLoading === report.id ? 'Processing...' : 'Begin Review'}
                        </Button>
                      )}
                      
                      {report.status === "In Progress" && (
                        <>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-yellow-600 hover:text-yellow-700"
                                disabled={actionLoading === report.id}
                              >
                                <UserX className="w-4 h-4 mr-1" />
                                Suspend
                                <ChevronDown className="w-4 h-4 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleReportAction('suspend', report.id, 7)}>
                                <div className="flex flex-col">
                                  <span className="font-medium">7 days</span>
                                  <span className="text-xs text-muted-foreground">Minor misconduct</span>
                                </div>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleReportAction('suspend', report.id, 30)}>
                                <div className="flex flex-col">
                                  <span className="font-medium">30 days</span>
                                  <span className="text-xs text-muted-foreground">Moderate misconduct</span>
                                </div>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleReportAction('suspend', report.id, 90)}>
                                <div className="flex flex-col">
                                  <span className="font-medium">90 days</span>
                                  <span className="text-xs text-muted-foreground">Serious misconduct</span>
                                </div>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleReportAction('deactivate', report.id)}
                            disabled={actionLoading === report.id}
                          >
                            <UserX className="w-4 h-4 mr-1" />
                            {actionLoading === report.id ? 'Processing...' : 'Ban'}
                          </Button>
                          
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleReportAction('reject', report.id)}
                            disabled={actionLoading === report.id}
                          >
                            {actionLoading === report.id ? 'Processing...' : 'Reject'}
                          </Button>
                        </>
                      )}
                      
                      {(report.status === "Resolved" || report.status === "Rejected") && (
                        <div className="px-3 py-2 text-sm text-muted-foreground bg-muted/50 rounded-md">
                          {report.status === "Resolved" ? "Action Taken" : "No Action"}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Reporter Info */}
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Reporter</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-medium">{report.reporterName}</span>
                          <Badge className={getRoleStyles(report.reporterRole)} variant="secondary">
                            {report.reporterRole}
                          </Badge>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Report Reason</Label>
                        <div className="bg-muted/30 p-3 rounded-lg mt-1">
                          <p className="text-sm font-medium">{report.reason}</p>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                        <div className="bg-muted/20 p-3 rounded-lg mt-1 border border-border">
                          <p className="text-sm text-foreground whitespace-pre-wrap">
                            {report.description || 'No additional description provided'}
                          </p>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">File Evidence</Label>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mt-1 border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                              {report.attachments?.length || 0} File Evidence Uploaded
                            </span>
                          </div>
                          
                          {/* Real evidence display */}
                          {report.attachments && report.attachments.length > 0 ? (
                            <div className="space-y-3">
                              {report.attachments.map((attachment, index) => (
                                <div key={attachment.id} className="bg-white dark:bg-gray-800 p-3 rounded border">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      {getFileIcon(attachment.content_type)}
                                      <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                        Evidence File {index + 1}
                                      </span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                      {formatFileSize(attachment.size_bytes)}
                                    </span>
                                  </div>
                                  
                                  <div className="text-xs text-muted-foreground mb-3 space-y-1">
                                    <div>File: {getFileName(attachment.url)}</div>
                                    <div>Type: {attachment.content_type}</div>
                                    <div>Uploaded: {new Date(attachment.created_at).toLocaleDateString()}</div>
                                  </div>
                                  
                                  <div className="flex gap-2">
                                    {attachment.content_type.startsWith('image/') ? (
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="text-xs h-7"
                                        onClick={() => window.open(`http://localhost:3001${attachment.url}`, '_blank')}
                                      >
                                        <Eye className="w-3 h-3 mr-1" />
                                        View Image
                                      </Button>
                                    ) : (
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="text-xs h-7"
                                        onClick={() => window.open(`http://localhost:3001${attachment.url}`, '_blank')}
                                      >
                                        <ExternalLink className="w-3 h-3 mr-1" />
                                        Open File
                                      </Button>
                                    )}
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="text-xs h-7"
                                      onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = `http://localhost:3001${attachment.url}`;
                                        link.download = getFileName(attachment.url);
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                      }}
                                    >
                                      <Download className="w-3 h-3 mr-1" />
                                      Download
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6">
                              <Paperclip className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">No file evidence uploaded</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Reported User Info */}
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Reported User</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-medium">{report.reportedUser}</span>
                          <Badge className={getRoleStyles(report.reportedRole)} variant="secondary">
                            {report.reportedRole}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono mt-1">
                          ID: {report.reportedUserId}
                        </p>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            Disciplinary Action Required
                          </span>
                        </div>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          {report.status === "Pending" ? "Awaiting admin review and action" :
                           report.status === "In Progress" ? "Review in progress - choose appropriate action" :
                           report.status === "Resolved" ? "Disciplinary action has been taken" :
                           "Report was rejected - no action taken"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );

  const renderReviewsTable = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground mb-6">Reviews</h2>
      <Card className="p-6 shadow-sm border-border/50">
        <h3 className="text-base font-semibold text-foreground mb-4">All Reviews</h3>
        {isLoadingReviews ? (
          <div className="py-8 text-center text-muted-foreground">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">No reviews yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Review Text</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium">
                          {r.author?.name || r.author?.full_name || 'Unknown Author'}
                        </span>
                        <Badge className={`${getRoleStyles(r.author?.role || 'elderly')} text-xs px-2 py-1 w-fit`} variant="secondary">
                          {r.author?.role || 'elderly'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium">
                          {r.recipient?.name || r.recipient?.full_name || 'Unknown Recipient'}
                        </span>
                        <Badge className={`${getRoleStyles(r.recipient?.role || 'elderly')} text-xs px-2 py-1 w-fit`} variant="secondary">
                          {r.recipient?.role || 'elderly'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">{r.rating}/5</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`text-xs ${
                                i < r.rating ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <div className="text-sm text-muted-foreground">
                        {r.text || r.comment ? (
                          <span className="line-clamp-2">
                            {r.text || r.comment}
                          </span>
                        ) : (
                          <span className="italic">No review text</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Unknown'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteReview(r.id)}>
                        Delete
                      </Button>
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
                await axiosInstance.post('/auth/logout', {}, {
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
      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === "overview" && renderOverview()}
        {activeTab === "users" && renderUserManagement()}
        {activeTab === "reports" && renderReportManagement()}
        {activeTab === "reviews" && renderReviewsTable()}
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
                  <Label className="text-sm font-medium">File Evidence:</Label>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mt-1 border border-blue-200 dark:border-blue-800">
                    {selectedReport.attachments && selectedReport.attachments.length > 0 ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            {selectedReport.attachments.length} File Evidence
                          </span>
                        </div>
                        
                        {selectedReport.attachments.map((attachment, index) => (
                          <div key={attachment.id} className="bg-white dark:bg-gray-800 p-4 rounded border">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                {getFileIcon(attachment.content_type)}
                                <span className="text-sm font-medium">Evidence File {index + 1}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {formatFileSize(attachment.size_bytes)}
                              </span>
                            </div>
                            
                            <div className="text-sm text-muted-foreground mb-3 space-y-1">
                              <div><strong>File:</strong> {getFileName(attachment.url)}</div>
                              <div><strong>Type:</strong> {attachment.content_type}</div>
                              <div><strong>Uploaded:</strong> {new Date(attachment.created_at).toLocaleDateString()}</div>
                            </div>
                            
                            <div className="flex gap-2">
                              {attachment.content_type.startsWith('image/') ? (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => window.open(`http://localhost:3001${attachment.url}`, '_blank')}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Image
                                </Button>
                              ) : (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => window.open(`http://localhost:3001${attachment.url}`, '_blank')}
                                >
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  Open File
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = `http://localhost:3001${attachment.url}`;
                                  link.download = getFileName(attachment.url);
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Paperclip className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">No file evidence uploaded</p>
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
        <div className="max-w-7xl mx-auto flex justify-around items-center py-3">
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
