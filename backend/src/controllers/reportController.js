const ReportService = require('../services/report');
const ReportStatus = require('../domain/enum/ReportStatus');

/**
 * Report Controller
 * Handles HTTP requests for report operations
 * Provides endpoints for submitting reports, adding evidence, and admin moderation
 * 
 * @class ReportController
 * @example
 * const reportController = new ReportController();
 * // Used in routes: router.post('/reports', reportController.submitReport);
 */
class ReportController {
  /**
   * Submit a new report
   * @route POST /api/reports
   * @access Private
   * @param {Request} req - Express request object
   * @param {string} req.user.id - Reporter user ID (from authentication)
   * @param {string} req.user.role - Reporter role (from authentication)
   * @param {Object} req.body - Report data
   * @param {string} req.body.reportedUserId - ID of user being reported
   * @param {string} [req.body.helpRequestId] - Optional related help request ID
   * @param {string} req.body.reason - Reason for report
   * @param {string} [req.body.description] - Optional detailed description
   * @param {Response} res - Express response object
   * @returns {Object} 201 - Created report
   * @returns {Object} 400 - Missing required fields
   * @returns {Object} 500 - Server error
   */
  submitReport = async (req, res) => {
    try {
      const reporterUserId = req.user.id;
      const reporterRole = req.user.role; // <- NEW
      const { reportedUserId, helpRequestId, reason, description } = req.body;

      if (!reportedUserId || !reason) {
        return res.status(400).json({ error: 'reportedUserId and reason are required' });
      }

      const report = await ReportService.submitReport({
        reporterUserId,
        reporterRole, // <- pass down
        reportedUserId,
        helpRequestId,
        reason,
        description,
      });

      return res.status(201).json({ success: true, data: report });
    } catch (error) {
      console.error('submitReport error:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * Add evidence file to a report
   * @route POST /api/reports/:reportId/evidence
   * @access Private (Report author only)
   * @param {Request} req - Express request object
   * @param {string} req.user.id - Reporter user ID (from authentication)
   * @param {string} req.params.reportId - Report ID to add evidence to
   * @param {File} req.file - Uploaded evidence file (via multer middleware)
   * @param {Response} res - Express response object
   * @returns {Object} 201 - Evidence attached successfully
   * @returns {Object} 400 - Missing file or report ID
   * @returns {Object} 403 - Not authorized (not the report author)
   * @returns {Object} 500 - Server error
   */
  addEvidence = async (req, res) => {
    try {
      const uploadedByUserId = req.user.id;
      const { reportId } = req.params;

      const attachment = await ReportService.addEvidence({
        reportId,
        uploadedByUserId,
        file: req.file,
      });

      return res.status(201).json({ success: true, data: attachment });
    } catch (error) {
      console.error('addEvidence error:', error);
      const status = error.statusCode || 500;
      return res.status(status).json({ error: error.message });
    }
  };

  /**
   * Begin reviewing a report (Admin only)
   * Marks report as IN_PROGRESS
   * @route POST /api/reports/:reportId/review
   * @access Private (Admin only)
   * @param {Request} req - Express request object
   * @param {string} req.user.id - Admin user ID (from authentication)
   * @param {string} req.user.role - Must be ADMIN
   * @param {string} req.params.reportId - Report ID to review
   * @param {Response} res - Express response object
   * @returns {Object} 200 - Report review started
   * @returns {Object} 400 - Missing report ID
   * @returns {Object} 409 - Report already being reviewed
   * @returns {Object} 500 - Server error
   */
  beginReview = async (req, res) => {
    try {
      const adminUserId = req.user.id;
      const adminRole = req.user.role; // <- NEW
      const { reportId } = req.params;

      const updated = await ReportService.beginReview({
        reportId,
        adminUserId,
        adminRole, // <- pass down
      });

      return res.status(200).json({ success: true, data: updated });
    } catch (error) {
      console.error('beginReview error:', error);
      const status = error.statusCode || 500;
      return res.status(status).json({ error: error.message });
    }
  };

  /**
   * Resolve a report (Admin only)
   * Marks report as RESOLVED
   * @route POST /api/reports/:reportId/resolve
   * @access Private (Admin only)
   * @param {Request} req - Express request object
   * @param {string} req.user.id - Admin user ID (from authentication)
   * @param {string} req.user.role - Must be ADMIN
   * @param {string} req.params.reportId - Report ID to resolve
   * @param {Object} req.body - Resolution data
   * @param {string} [req.body.note] - Resolution note
   * @param {Response} res - Express response object
   * @returns {Object} 200 - Report resolved successfully
   * @returns {Object} 500 - Server error
   */
  resolveReport = async (req, res) => {
    try {
      const adminUserId = req.user.id;
      const adminRole = req.user.role; // <- NEW
      const { reportId } = req.params;
      const { note } = req.body;

      const updated = await ReportService.resolveReport({
        reportId,
        adminUserId,
        adminRole, // <- pass down
        note,
      });

      return res.status(200).json({ success: true, data: updated });
    } catch (error) {
      console.error('resolveReport error:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * Reject a report (Admin only)
   * Marks report as REJECTED
   * @route POST /api/reports/:reportId/reject
   * @access Private (Admin only)
   * @param {Request} req - Express request object
   * @param {string} req.user.id - Admin user ID (from authentication)
   * @param {string} req.user.role - Must be ADMIN
   * @param {string} req.params.reportId - Report ID to reject
   * @param {Object} req.body - Rejection data
   * @param {string} [req.body.note] - Rejection note
   * @param {Response} res - Express response object
   * @returns {Object} 200 - Report rejected successfully
   * @returns {Object} 500 - Server error
   */
  rejectReport = async (req, res) => {
    try {
      const adminUserId = req.user.id;
      const adminRole = req.user.role; // <- NEW
      const { reportId } = req.params;
      const { note } = req.body;

      const updated = await ReportService.rejectReport({
        reportId,
        adminUserId,
        adminRole, // <- pass down
        note,
      });

      return res.status(200).json({ success: true, data: updated });
    } catch (error) {
      console.error('rejectReport error:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * View reports submitted by the authenticated user
   * @route GET /api/reports/my-reports
   * @access Private
   * @param {Request} req - Express request object
   * @param {string} req.user.id - Reporter user ID (from authentication)
   * @param {Response} res - Express response object
   * @returns {Object} 200 - Array of reports submitted by user
   * @returns {Object} 500 - Server error
   */
  viewMyReports = async (req, res) => {
    try {
      const userId = req.user.id;
      const reports = await ReportService.viewMyReports(userId);
      return res.status(200).json({ success: true, data: reports });
    } catch (error) {
      console.error('viewMyReports error:', error);
      return res.status(500).json({ error: error.message });
    }
  };
}

module.exports = new ReportController();