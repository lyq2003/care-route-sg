const express = require('express');
const adminController = require('../controllers/adminController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all admin routes
router.use(requireAuth);

// Additional admin role check middleware
const checkAdminRole = (req, res, next) => {
  // Check if user has admin role (check both session and user_metadata)
  const userRole = req.user.role || req.user.user_metadata?.role;
  
  console.log('Admin role check:', {
    userId: req.user.id,
    sessionRole: req.user.role,
    metadataRole: req.user.user_metadata?.role,
    finalRole: userRole
  });
  
  if (userRole !== 'admin') {
    return res.status(403).json({ 
      error: 'Admin access required',
      debug: {
        userRole: userRole,
        sessionRole: req.user.role,
        metadataRole: req.user.user_metadata?.role
      }
    });
  }
  
  next();
};

router.use(checkAdminRole);

// Test route for debugging authentication
// GET /api/admin/test - Test admin authentication
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Admin authentication successful',
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      metadata: req.user.user_metadata
    }
  });
});

// Dashboard Routes
// GET /api/admin/stats - Get dashboard statistics
router.get('/stats', adminController.getDashboardStats);

// User Management Routes
// GET /api/admin/users - Get all users with pagination and filters (admin-specific)
router.get('/users', adminController.getAllUsers);

// GET /api/admin/users/:userId - Get specific user by ID (admin-specific)
router.get('/users/:userId', adminController.getUserById);

// POST /api/admin/users/:userId/suspend - Suspend user
router.post('/users/:userId/suspend', adminController.suspendUser);

// POST /api/admin/users/:userId/deactivate - Deactivate user
router.post('/users/:userId/deactivate', adminController.deactivateUser);

// POST /api/admin/users/:userId/reactivate - Reactivate deactivated user (manual admin action)
router.post('/users/:userId/reactivate', adminController.reactivateUser);

// POST /api/admin/users/:userId/unsuspend - Unsuspend user (automatic when duration expires)
router.post('/users/:userId/unsuspend', adminController.unsuspendUser);

// Request Management Routes
// GET /api/admin/requests - Get all help requests with pagination and filters
router.get('/requests', adminController.getAllRequests);

// POST /api/admin/requests/:requestId/reassign - Reassign volunteer to request
router.post('/requests/:requestId/reassign', adminController.reassignVolunteer);

// Admin Activity Routes
// GET /api/admin/logs - Get admin activity logs
router.get('/logs', adminController.getAdminLogs);

module.exports = router;