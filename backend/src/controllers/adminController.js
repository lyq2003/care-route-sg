const adminService = require('../services/admin');
const reportService = require('../services/report');
const reviewService = require('../services/review');
const { supabaseAdmin } = require('../config/supabase');
//const User = require('../domain/User');
const UserStatus = require('../domain/enum/UserStatus');
const Role = require('../domain/enum/Role');
const ReportStatus = require('../domain/enum/ReportStatus');

class AdminController {
  
  // Get dashboard statistics
  async getDashboardStats(req, res) {
    try {
      // Debug user information
      console.log('Dashboard stats request from user:', {
        id: req.user.id,
        role: req.user.role,
        metadata: req.user.user_metadata
      });

      const stats = await adminService.getDashboardStats();

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get all users with pagination and filters
  async getAllUsers(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        search
      } = req.query;

      // Validate pagination parameters
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      
      if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
          success: false,
          error: 'Invalid pagination parameters'
        });
      }

      const filters = {};
      if (status && Object.values(UserStatus).includes(status)) {
        filters.status = status;
      }
      if (search) {
        filters.search = search.trim();
      }

      const result = await adminService.getAllUsers(pageNum, limitNum, filters);

      res.status(200).json({
        success: true,
        data: {
          users: result.users,
          pagination: {
            total: result.total,
            page: result.page,
            totalPages: result.totalPages,
            limit: limitNum
          }
        }
      });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get user by ID
  async getUserById(req, res) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      const user = await adminService.getUserById(userId);

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Get user by ID error:', error);
      
      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Suspend user (For all Users except Admin with duration of 7, 30, or 90 days)
  async suspendUser(req, res) {
    try {
      const { userId } = req.params;
      const { duration = 7 } = req.body; // Extract duration with default value
      const adminId = req.user.id; // From session via requireAuth middleware

      // Debug admin information
      console.log('Suspend user request:', {
        adminId,
        targetUserId: userId,
        adminRole: req.user.role,
        adminMetadata: req.user.user_metadata,
        duration
      });

      // Validation
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      // Validate duration
      if (![7, 30, 90].includes(duration)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid suspension duration. Must be 7, 30, or 90 days.'
        });
      }

      // Prevent self-suspension
      if (userId === adminId) {
        return res.status(400).json({
          success: false,
          error: 'Cannot suspend your own account'
        });
      }

      if (!adminId) {
        return res.status(400).json({
          success: false,
          error: 'Invalid admin session'
        });
      }

      const updatedUser = await adminService.suspendUser(userId, 'Administrative action', adminId, duration);

      res.status(200).json({
        success: true,
        message: `User suspended for ${duration} days`,
        data: updatedUser
      });
    } catch (error) {
      console.error('Suspend user error:', error);
      
      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      if (error.message.includes('cannot be suspended')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Deactivate user (For all Users except Admin and is indefinite until reactivated)
  async deactivateUser(req, res) {
    try {
      const { userId } = req.params;
      const adminId = req.user.id;

      // Validation
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      // Prevent self-deactivation
      if (userId === adminId) {
        return res.status(400).json({
          success: false,
          error: 'Cannot deactivate your own account'
        });
      }

      const updatedUser = await adminService.deactivateUser(userId, 'Administrative action', adminId);

      res.status(200).json({
        success: true,
        message: 'User deactivated successfully',
        data: updatedUser
      });
    } catch (error) {
      console.error('Deactivate user error:', error);
      
      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      if (error.message.includes('cannot be deactivated')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Reactivate user (manual admin reactivation for deactivated accounts)
  async reactivateUser(req, res) {
    try {
      const { userId } = req.params;
      const adminId = req.user.id;

      // Validation
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      const updatedUser = await adminService.reactivateUser(userId, adminId, 'Administrative action');

      res.status(200).json({
        success: true,
        message: 'User reactivated successfully',
        data: updatedUser
      });
    } catch (error) {
      console.error('Reactivate user error:', error);
      
      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      if (error.message.includes('cannot be reactivated')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Unsuspend user (automatic unsuspension when duration expires)
  async unsuspendUser(req, res) {
    try {
      const { userId } = req.params;
      const { reason = 'Suspension period expired' } = req.body;

      // Validation
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      const updatedUser = await adminService.unsuspendUser(userId, reason);

      res.status(200).json({
        success: true,
        message: 'User unsuspended successfully',
        data: updatedUser
      });
    } catch (error) {
      console.error('Unsuspend user error:', error);
      
      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      if (error.message.includes('cannot be unsuspended')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get admin activity logs

  // Reassign volunteer to request
  async reassignVolunteer(req, res) {
    try {
      const { requestId } = req.params;
      const { volunteerId } = req.body;
      const adminId = req.user.id;

      if (!requestId || !volunteerId) {
        return res.status(400).json({
          success: false,
          error: 'Request ID and Volunteer ID are required'
        });
      }

      const updatedRequest = await adminService.reassignVolunteer(requestId, volunteerId, adminId);

      res.status(200).json({
        success: true,
        message: 'Volunteer reassigned successfully',
        data: updatedRequest
      });
    } catch (error) {
      console.error('Reassign volunteer error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Report Management Methods
  
  // Get all reports for admin review
  async getAllReports(req, res) {
    try {
      // Use the admin service method to get all reports with full user details
      const reports = await reportService.getAllReportsForAdmin();

      // Apply status filter if provided
      const { status } = req.query;
      let filteredReports = reports;
      
      if (status && Object.values(ReportStatus).includes(status.toUpperCase())) {
        filteredReports = reports.filter(report => 
          report.status === status.toUpperCase()
        );
      }

      res.status(200).json({
        success: true,
        data: {
          reports: filteredReports,
          pagination: {
            total: filteredReports.length,
            page: 1,
            totalPages: 1,
            limit: filteredReports.length
          }
        }
      });
    } catch (error) {
      console.error('Get all reports error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Start reviewing a report
  async startReportReview(req, res) {
    try {
      const { reportId } = req.params;
      const adminUserId = req.user.id;

      if (!reportId) {
        return res.status(400).json({
          success: false,
          error: 'Report ID is required'
        });
      }

      const report = await reportService.beginReview({ reportId, adminUserId });

      res.status(200).json({
        success: true,
        message: 'Report review started',
        data: report
      });
    } catch (error) {
      console.error('Start report review error:', error);
      
      if (error.statusCode === 409) {
        return res.status(409).json({
          success: false,
          error: 'Report is already being reviewed by another admin'
        });
      }

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Resolve a report with disciplinary action
  async resolveReport(req, res) {
    try {
      const { reportId } = req.params;
      const { action, reason, duration } = req.body;
      const adminUserId = req.user.id;

      if (!reportId || !action) {
        return res.status(400).json({
          success: false,
          error: 'Report ID and action are required'
        });
      }

      // Get the report details first
      const { data: report, error: reportError } = await supabaseAdmin
        .from('reports')
        .select('*, reported_user_id')
        .eq('id', reportId)
        .single();

      if (reportError || !report) {
        return res.status(404).json({
          success: false,
          error: 'Report not found'
        });
      }

      const reportedUserId = report.reported_user_id;

      // Take disciplinary action based on the action type
      if (action === 'suspend' && duration) {
        if (![7, 30, 90].includes(duration)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid suspension duration. Must be 7, 30, or 90 days'
          });
        }

        await adminService.suspendUser(reportedUserId, reason || 'Report violation', adminUserId, duration);
      } else if (action === 'deactivate') {
        await adminService.deactivateUser(reportedUserId, reason || 'Report violation', adminUserId);
      }

      // Mark report as resolved
      const resolvedReport = await reportService.resolveReport({ 
        reportId, 
        adminUserId, 
        note: `Action taken: ${action}${duration ? ` for ${duration} days` : ''}. Reason: ${reason || 'Report violation'}` 
      });

      res.status(200).json({
        success: true,
        message: 'Report resolved and disciplinary action taken',
        data: resolvedReport
      });
    } catch (error) {
      console.error('Resolve report error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Reject a report
  async rejectReport(req, res) {
    try {
      const { reportId } = req.params;
      const { reason } = req.body;
      const adminUserId = req.user.id;

      if (!reportId) {
        return res.status(400).json({
          success: false,
          error: 'Report ID is required'
        });
      }

      const rejectedReport = await reportService.rejectReport({ 
        reportId, 
        adminUserId, 
        note: reason || 'Report rejected - insufficient evidence or invalid claim' 
      });

      res.status(200).json({
        success: true,
        message: 'Report rejected',
        data: rejectedReport
      });
    } catch (error) {
      console.error('Reject report error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Review Management Methods

  // Get all reviews for admin moderation
  async getAllReviews(req, res) {
    try {
      // Use the admin service method to get all reviews with full user details
      const reviews = await reviewService.getAllReviewsForAdmin();

      // Apply flagged filter if provided
      const { flagged } = req.query;
      let filteredReviews = reviews;
      
      if (flagged === 'true') {
        filteredReviews = reviews.filter(review => review.flagged === true);
      }

      res.status(200).json({
        success: true,
        data: {
          reviews: filteredReviews,
          pagination: {
            total: filteredReviews.length,
            page: 1,
            totalPages: 1,
            limit: filteredReviews.length
          }
        }
      });
    } catch (error) {
      console.error('Get all reviews error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Remove inappropriate review
  async removeReview(req, res) {
    try {
      const { reviewId } = req.params;
      const { reason } = req.body;
      const adminUserId = req.user.id;

      if (!reviewId) {
        return res.status(400).json({
          success: false,
          error: 'Review ID is required'
        });
      }

      // Delete the review
      const { data, error } = await supabaseAdmin
        .from('reviews')
        .delete()
        .eq('id', reviewId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to remove review: ${error.message}`);
      }

      // Log admin action
      await adminService.logAdminAction(adminUserId, 'REMOVE_REVIEW', reviewId, { 
        reason: reason || 'Review removed for policy violation' 
      });

      res.status(200).json({
        success: true,
        message: 'Review removed successfully',
        data: data
      });
    } catch (error) {
      console.error('Remove review error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get admin activity logs
  async getAdminLogs(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        adminId,
        action
      } = req.query;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      
      if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
          success: false,
          error: 'Invalid pagination parameters'
        });
      }

      const filters = {};
      if (adminId) filters.adminId = adminId;
      if (action) filters.action = action;

      const result = await adminService.getAdminLogs(pageNum, limitNum, filters);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get admin logs error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new AdminController();