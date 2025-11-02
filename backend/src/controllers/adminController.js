const adminService = require('../services/admin');
const reportService = require('../services/report');
const reviewService = require('../services/review');
const NotificationService = require('../services/notificationService');
const { supabaseAdmin } = require('../config/supabase');
const reportController = require('./reportController');
const reviewController = require('./reviewController');
//const User = require('../domain/User');
const UserStatus = require('../domain/enum/UserStatus');
const Role = require('../domain/enum/Role');
const ReportStatus = require('../domain/enum/ReportStatus');

class AdminController {
  
  // Helper function to calculate suspension time remaining
  calculateSuspensionTimeRemaining(suspensionEndDate) {
    if (!suspensionEndDate) return null;
    
    const now = new Date();
    const endDate = new Date(suspensionEndDate);
    const timeRemaining = endDate.getTime() - now.getTime();
    
    if (timeRemaining <= 0) {
      return { expired: true, daysRemaining: 0, message: "Expired" };
    }
    
    const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));
    return { 
      expired: false, 
      daysRemaining, 
      message: `${daysRemaining} day${daysRemaining === 1 ? '' : 's'}` 
    };
  }
  
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

      // Add suspension time remaining for suspended users
      const usersWithSuspensionInfo = result.users.map(user => {
        const userObj = user.toJSON ? user.toJSON() : user;
        if (userObj.status === UserStatus.SUSPENDED && userObj.suspensionEndDate) {
          const suspensionInfo = this.calculateSuspensionTimeRemaining(userObj.suspensionEndDate);
          userObj.suspensionTimeRemaining = suspensionInfo;
        }
        return userObj;
      });

      res.status(200).json({
        success: true,
        data: {
          users: usersWithSuspensionInfo,
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

  // Ban user permanently (deletes account permanently - cannot be recovered)
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
        message: 'User banned permanently - account deleted',
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

  // Announce service outage (API/external service down)
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

  // ==================== DELEGATION TO REPORT CONTROLLER ====================
  
  // Delegate to report controller for report management
  async getAllReports(req, res) {
    return await reportController.getAllReports(req, res);
  }

  async startReportReview(req, res) {
    return await reportController.startReportReview(req, res);
  }

  async resolveReport(req, res) {
    return await reportController.resolveReport(req, res);
  }

  async rejectReport(req, res) {
    return await reportController.rejectReport(req, res);
  }

  // ==================== DELEGATION TO REVIEW CONTROLLER ====================
  
  // Delegate to review controller for review management
  async getAllReviews(req, res) {
    return await reviewController.getAllReviews(req, res);
  }

  async removeReview(req, res) {
    return await reviewController.removeReview(req, res);
  }
}

module.exports = new AdminController();