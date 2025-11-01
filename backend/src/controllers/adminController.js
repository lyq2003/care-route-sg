const adminService = require('../services/admin');
const reportService = require('../services/report');
const reviewService = require('../services/review');
const NotificationService = require('../services/notificationService');
const { supabaseAdmin } = require('../config/supabase');
//const User = require('../domain/User');
const UserStatus = require('../domain/enum/UserStatus');
const Role = require('../domain/enum/Role');
const ReportStatus = require('../domain/enum/ReportStatus');

/**
 * Admin Controller
 * Handles HTTP requests for administrative operations
 * Provides endpoints for user management, dashboard statistics, and report/review moderation
 * All methods require admin authentication
 * 
 * @class AdminController
 * @example
 * const adminController = new AdminController();
 * // Used in routes: router.get('/dashboard/stats', adminController.getDashboardStats);
 */
class AdminController {
  
  /**
   * Get dashboard statistics
   * @route GET /api/admin/dashboard/stats
   * @access Private (Admin only)
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Object} 200 - Dashboard statistics
   * @returns {boolean} returns.success - Success flag
   * @returns {Object} returns.data - Statistics object with user counts and pending reports
   */
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

  /**
   * Get all users with pagination and filters
   * @route GET /api/admin/users
   * @access Private (Admin only)
   * @param {Request} req - Express request object
   * @param {Object} req.query - Query parameters
   * @param {number} [req.query.page=1] - Page number
   * @param {number} [req.query.limit=10] - Users per page
   * @param {string} [req.query.status] - Filter by status
   * @param {string} [req.query.search] - Search term for name/email
   * @param {Response} res - Express response object
   * @returns {Object} 200 - Paginated users list
   * @returns {boolean} returns.success - Success flag
   * @returns {Object} returns.data - Users and pagination info
   */
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

  /**
   * Get user by ID
   * @route GET /api/admin/users/:userId
   * @access Private (Admin only)
   * @param {Request} req - Express request object
   * @param {string} req.params.userId - User ID to retrieve
   * @param {Response} res - Express response object
   * @returns {Object} 200 - User details
   * @returns {Object} 400 - Missing user ID
   * @returns {Object} 404 - User not found
   */
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

  /**
   * Suspend a user account
   * @route POST /api/admin/users/:userId/suspend
   * @access Private (Admin only)
   * @param {Request} req - Express request object
   * @param {string} req.user.id - Admin user ID (from authentication)
   * @param {string} req.params.userId - User ID to suspend
   * @param {Object} req.body - Suspension data
   * @param {number} [req.body.duration=7] - Suspension duration in days (7, 30, or 90)
   * @param {Response} res - Express response object
   * @returns {Object} 200 - User suspended successfully
   * @returns {Object} 400 - Invalid duration or user ID
   * @returns {Object} 404 - User not found
   * @returns {Object} 500 - Server error
   */
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

  /**
   * Deactivate a user account
   * Indefinite deactivation until manually reactivated by admin
   * @route POST /api/admin/users/:userId/deactivate
   * @access Private (Admin only)
   * @param {Request} req - Express request object
   * @param {string} req.user.id - Admin user ID (from authentication)
   * @param {string} req.params.userId - User ID to deactivate
   * @param {Response} res - Express response object
   * @returns {Object} 200 - User deactivated successfully
   * @returns {Object} 400 - Invalid user ID or cannot deactivate
   * @returns {Object} 404 - User not found
   * @returns {Object} 500 - Server error
   */
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

  /**
   * Reactivate a deactivated user account
   * @route POST /api/admin/users/:userId/reactivate
   * @access Private (Admin only)
   * @param {Request} req - Express request object
   * @param {string} req.user.id - Admin user ID (from authentication)
   * @param {string} req.params.userId - User ID to reactivate
   * @param {Response} res - Express response object
   * @returns {Object} 200 - User reactivated successfully
   * @returns {Object} 400 - Cannot reactivate (user not deactivated)
   * @returns {Object} 404 - User not found
   * @returns {Object} 500 - Server error
   */
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

  /**
   * Unsuspend a suspended user account
   * Can be used for manual early unsuspension before duration expires
   * @route POST /api/admin/users/:userId/unsuspend
   * @access Private (Admin only)
   * @param {Request} req - Express request object
   * @param {string} req.user.id - Admin user ID (from authentication)
   * @param {string} req.params.userId - User ID to unsuspend
   * @param {Object} req.body - Unsuspension data
   * @param {string} [req.body.reason] - Reason for unsuspension
   * @param {Response} res - Express response object
   * @returns {Object} 200 - User unsuspended successfully
   * @returns {Object} 400 - Cannot unsuspend (user not suspended)
   * @returns {Object} 404 - User not found
   * @returns {Object} 500 - Server error
   */
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

  /**
   * Reassign a volunteer to a help request
   * @route POST /api/admin/requests/:requestId/reassign
   * @access Private (Admin only)
   * @param {Request} req - Express request object
   * @param {string} req.user.id - Admin user ID (from authentication)
   * @param {string} req.params.requestId - Help request ID
   * @param {Object} req.body - Reassignment data
   * @param {string} req.body.volunteerId - New volunteer ID to assign
   * @param {Response} res - Express response object
   * @returns {Object} 200 - Volunteer reassigned successfully
   * @returns {Object} 400 - Missing request ID or volunteer ID
   * @returns {Object} 500 - Server error
   */
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
  
  /**
   * Get all reports for admin review
   * @route GET /api/admin/reports
   * @access Private (Admin only)
   * @param {Request} req - Express request object
   * @param {Object} req.query - Query parameters
   * @param {string} [req.query.status] - Filter by report status
   * @param {Response} res - Express response object
   * @returns {Object} 200 - Array of reports with pagination
   * @returns {Object} 500 - Server error
   */
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

  /**
   * Start reviewing a report
   * Marks report as IN_PROGRESS and assigns admin to it
   * @route POST /api/admin/reports/:reportId/review
   * @access Private (Admin only)
   * @param {Request} req - Express request object
   * @param {string} req.user.id - Admin user ID (from authentication)
   * @param {string} req.params.reportId - Report ID to review
   * @param {Response} res - Express response object
   * @returns {Object} 200 - Report review started
   * @returns {Object} 400 - Missing report ID
   * @returns {Object} 409 - Report already being reviewed
   * @returns {Object} 500 - Server error
   */
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

  /**
   * Resolve a report with disciplinary action
   * Can suspend or deactivate reported user based on action type
   * @route POST /api/admin/reports/:reportId/resolve
   * @access Private (Admin only)
   * @param {Request} req - Express request object
   * @param {string} req.user.id - Admin user ID (from authentication)
   * @param {string} req.params.reportId - Report ID to resolve
   * @param {Object} req.body - Resolution data
   * @param {string} req.body.action - Action type ('suspend' or 'deactivate')
   * @param {string} [req.body.reason] - Reason for action
   * @param {number} [req.body.duration] - Suspension duration (7, 30, or 90 days) if action is 'suspend'
   * @param {Response} res - Express response object
   * @returns {Object} 200 - Report resolved and action taken
   * @returns {Object} 400 - Missing report ID, action, or invalid duration
   * @returns {Object} 404 - Report not found
   * @returns {Object} 500 - Server error
   */
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

  /**
   * Reject a report
   * Closes report without taking action on reported user
   * @route POST /api/admin/reports/:reportId/reject
   * @access Private (Admin only)
   * @param {Request} req - Express request object
   * @param {string} req.user.id - Admin user ID (from authentication)
   * @param {string} req.params.reportId - Report ID to reject
   * @param {Object} req.body - Rejection data
   * @param {string} [req.body.reason] - Reason for rejection
   * @param {Response} res - Express response object
   * @returns {Object} 200 - Report rejected successfully
   * @returns {Object} 400 - Missing report ID
   * @returns {Object} 500 - Server error
   */
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

  /**
   * Get all reviews for admin moderation
   * @route GET /api/admin/reviews
   * @access Private (Admin only)
   * @param {Request} req - Express request object
   * @param {Object} req.query - Query parameters
   * @param {string} [req.query.flagged] - Filter by flagged status ('true' or 'false')
   * @param {Response} res - Express response object
   * @returns {Object} 200 - Array of reviews with pagination
   * @returns {Object} 500 - Server error
   */
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

  /**
   * Remove inappropriate review
   * Permanently deletes a review and logs admin action
   * @route DELETE /api/admin/reviews/:reviewId
   * @access Private (Admin only)
   * @param {Request} req - Express request object
   * @param {string} req.user.id - Admin user ID (from authentication)
   * @param {string} req.params.reviewId - Review ID to remove
   * @param {Object} req.body - Removal data
   * @param {string} [req.body.reason] - Reason for removal
   * @param {Response} res - Express response object
   * @returns {Object} 200 - Review removed successfully
   * @returns {Object} 400 - Missing review ID
   * @returns {Object} 500 - Server error
   */
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

  /**
   * Get admin activity logs
   * Retrieves paginated log of all administrative actions
   * @route GET /api/admin/logs
   * @access Private (Admin only)
   * @param {Request} req - Express request object
   * @param {Object} req.query - Query parameters
   * @param {number} [req.query.page=1] - Page number
   * @param {number} [req.query.limit=20] - Logs per page
   * @param {string} [req.query.adminId] - Filter by admin ID
   * @param {string} [req.query.action] - Filter by action type
   * @param {Response} res - Express response object
   * @returns {Object} 200 - Paginated admin logs
   * @returns {Object} 400 - Invalid pagination parameters
   * @returns {Object} 500 - Server error
   */
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

  // ==================== SYSTEM-WIDE NOTIFICATIONS ====================

  /**
   * Announce service outage
   * Broadcasts system-wide notification about service disruption
   * @route POST /api/admin/notifications/outage
   * @access Private (Admin only)
   * @param {Request} req - Express request object
   * @param {Object} req.body - Outage data
   * @param {string} req.body.serviceName - Name of the affected service
   * @param {string} [req.body.description] - Description of the outage
   * @param {Response} res - Express response object
   * @returns {Object} 200 - Notification sent successfully
   * @returns {Object} 400 - Missing service name
   * @returns {Object} 500 - Server error
   */
  async announceServiceOutage(req, res) {
    try {
      const { serviceName, description } = req.body;

      if (!serviceName) {
        return res.status(400).json({
          success: false,
          error: 'Service name is required'
        });
      }

      await NotificationService.notifyServiceOutage(
        serviceName,
        description || 'temporarily unavailable due to service maintenance'
      );

      // Log admin action
      await adminService.logAdminAction(req.user.id, 'ANNOUNCE_SERVICE_OUTAGE', null, { 
        serviceName,
        description
      });

      res.status(200).json({
        success: true,
        message: 'Service outage notification sent to all users'
      });
    } catch (error) {
      console.error('Announce service outage error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Announce feature update
  async announceFeatureUpdate(req, res) {
    try {
      const { featureName, description } = req.body;

      if (!featureName || !description) {
        return res.status(400).json({
          success: false,
          error: 'Feature name and description are required'
        });
      }

      await NotificationService.notifyFeatureUpdate(featureName, description);

      // Log admin action
      await adminService.logAdminAction(req.user.id, 'ANNOUNCE_FEATURE_UPDATE', null, { 
        featureName,
        description
      });

      res.status(200).json({
        success: true,
        message: 'Feature update notification sent to all users'
      });
    } catch (error) {
      console.error('Announce feature update error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Announce scheduled maintenance
  async announceScheduledMaintenance(req, res) {
    try {
      const { date, startTime, endTime } = req.body;

      if (!date || !startTime || !endTime) {
        return res.status(400).json({
          success: false,
          error: 'Date, start time, and end time are required'
        });
      }

      await NotificationService.notifyScheduledMaintenance(date, startTime, endTime);

      // Log admin action
      await adminService.logAdminAction(req.user.id, 'ANNOUNCE_SCHEDULED_MAINTENANCE', null, { 
        date,
        startTime,
        endTime
      });

      res.status(200).json({
        success: true,
        message: 'Scheduled maintenance notification sent to all users'
      });
    } catch (error) {
      console.error('Announce scheduled maintenance error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Flag review for removal (can also be called by automated moderation)
  async flagReview(req, res) {
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

      const flaggedReview = await reviewService.flagReview({
        reviewId,
        reason: reason || 'offensive language',
        flaggedBy: adminUserId
      });

      // Log admin action
      await adminService.logAdminAction(adminUserId, 'FLAG_REVIEW', reviewId, { reason });

      res.status(200).json({
        success: true,
        message: 'Review flagged successfully',
        data: flaggedReview
      });
    } catch (error) {
      console.error('Flag review error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new AdminController();