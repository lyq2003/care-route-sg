const express = require('express');
const adminController = require('../controllers/adminController');
const { requireAuth } = require('../middleware/auth');
const Role = require('../domain/enum/Role');

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
  
  if (userRole !== Role.ADMIN) {
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

// Report Management Routes (Admin-only access)
// GET /api/admin/reports - Get all reports for admin review
router.get('/reports', adminController.getAllReports);

// POST /api/admin/reports/:reportId/start-review - Start reviewing a report
router.post('/reports/:reportId/start-review', adminController.startReportReview);

// POST /api/admin/reports/:reportId/resolve - Resolve a report with disciplinary action
router.post('/reports/:reportId/resolve', adminController.resolveReport);

// POST /api/admin/reports/:reportId/reject - Reject a report
router.post('/reports/:reportId/reject', adminController.rejectReport);

// Review Management Routes (Admin-only access)
// GET /api/admin/reviews - Get all reviews for admin moderation
router.get('/reviews', adminController.getAllReviews);

// DELETE /api/admin/reviews/:reviewId - Remove inappropriate review
router.delete('/reviews/:reviewId', adminController.removeReview);

// Admin Activity Routes
// GET /api/admin/logs - Get admin activity logs
router.get('/logs', adminController.getAdminLogs);

// System-Wide Notification Routes
// POST /api/admin/notifications/service-outage - Announce service outage
router.post('/notifications/service-outage', adminController.announceServiceOutage);

// POST /api/admin/notifications/feature-update - Announce feature update
router.post('/notifications/feature-update', adminController.announceFeatureUpdate);

// POST /api/admin/notifications/scheduled-maintenance - Announce scheduled maintenance
router.post('/notifications/scheduled-maintenance', adminController.announceScheduledMaintenance);

module.exports = router;