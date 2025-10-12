const adminService = require('../services/admin');
const UserStatus = require('../domain/enum/UserStatus');
const Role = require('../domain/enum/Role');
const HelpRequestStatus = require('../domain/enum/HelpRequestStatus');

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
      const { reason, duration = 7 } = req.body; // Extract duration with default value
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

      if (!reason || reason.trim().length < 10) {
        return res.status(400).json({
          success: false,
          error: 'Suspension reason must be at least 10 characters'
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

      const updatedUser = await adminService.suspendUser(userId, reason.trim(), adminId, duration);

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
      const { reason } = req.body;
      const adminId = req.user.id;

      // Validation
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      if (!reason || reason.trim().length < 10) {
        return res.status(400).json({
          success: false,
          error: 'Deactivation reason must be at least 10 characters'
        });
      }

      // Prevent self-deactivation
      if (userId === adminId) {
        return res.status(400).json({
          success: false,
          error: 'Cannot deactivate your own account'
        });
      }

      const updatedUser = await adminService.deactivateUser(userId, reason.trim(), adminId);

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
      const { reason } = req.body;
      const adminId = req.user.id;

      // Validation
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      if (!reason || reason.trim().length < 10) {
        return res.status(400).json({
          success: false,
          error: 'Reactivation reason must be at least 10 characters'
        });
      }

      const updatedUser = await adminService.reactivateUser(userId, adminId, reason.trim());

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

  // Get all help requests
  async getAllRequests(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        category
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
      if (status) filters.status = status;
      if (category) filters.category = category;

      const result = await adminService.getAllRequests(pageNum, limitNum, filters);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get all requests error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

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