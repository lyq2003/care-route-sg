const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { supabase, supabaseAdmin } = require('../config/supabase');
const ReportStatus = require('../domain/enum/ReportStatus');
const AttachmentParentType = require('../domain/enum/AttachmentParentType');
const NotificationService = require('./notificationService');

// Local disk storage for uploaded evidence (dev only)
const uploadPath = path.join(__dirname, './uploads');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

/**
 * Report Service
 * Handles report submission, status management, and evidence file uploads
 * Manages moderation workflow for user reports
 * 
 * @class ReportService
 * @example
 * const reportService = new ReportService();
 * const report = await reportService.submitReport({
 *   reporterUserId: 'user-123',
 *   reporterRole: 'ELDERLY',
 *   reportedUserId: 'volunteer-456',
 *   helpRequestId: 'request-789',
 *   reason: 'Inappropriate behavior',
 *   description: 'Details of the incident...'
 * });
 */
class ReportService {
  /**
   * Returns Multer middleware for handling evidence file uploads
   * Configures file upload destination and naming
   * 
   * @returns {Function} Multer middleware function
   * @example
   * // In route handler
   * router.post('/report', 
   *   reportService.getEvidenceUploadMiddleware(),
   *   async (req, res) => {
   *     // req.file contains uploaded file info
   *   }
   * );
   */
  getEvidenceUploadMiddleware() {
    return upload.single('file');
  }

  /**
   * Submits a new report from a user
   * Creates report record and initial status history entry
   * Notifies admins about the new report
   * 
   * @param {Object} reportData - Report data object
   * @param {string} reportData.reporterUserId - ID of user submitting the report
   * @param {string} reportData.reporterRole - Role of the reporter (ELDERLY, VOLUNTEER, CAREGIVER)
   * @param {string} reportData.reportedUserId - ID of user being reported
   * @param {string} [reportData.helpRequestId] - Optional ID of related help request
   * @param {string} reportData.reason - Reason for the report
   * @param {string} [reportData.description] - Optional detailed description
   * @returns {Promise<Object>} Created report object
   * @throws {Error} If report submission fails
   * 
   * @example
   * const report = await reportService.submitReport({
   *   reporterUserId: 'elderly-123',
   *   reporterRole: 'ELDERLY',
   *   reportedUserId: 'volunteer-456',
   *   helpRequestId: 'request-789',
   *   reason: 'Inappropriate behavior',
   *   description: 'Detailed description...'
   * });
   */
  async submitReport({ reporterUserId, reporterRole, reportedUserId, helpRequestId, reason, description }) {
    // 1. Insert the report itself
    const { data, error } = await supabase
      .from('reports')
      .insert([
        {
          reporter_user_id: reporterUserId,
          reported_user_id: reportedUserId,
          help_request_id: helpRequestId || null,
          reason,
          description: description || null,
          status: ReportStatus.PENDING,
        },
      ])
      .select('*')
      .single();

    if (error) throw error;

    // 2. Insert status history row
    await supabase.from('report_status_history').insert([
      {
        report_id: data.id,
        from_status: null,
        to_status: ReportStatus.PENDING,
        changed_by_user_id: reporterUserId,
        admin_note: null,
      },
    ]);

    // 3. Notify admins that someone submitted a report
    // We used to query user_profiles to get "reporterName" and a nice role string.
    // For demo: we avoid any DB lookups that assume user_profiles exists.
    try {
      const reporterName = 'User'; // fallback display name
      const safeRole = reporterRole || 'User'; // fallback role
      await NotificationService.notifyAdminNewReportSubmitted(
        reporterName,
        safeRole,
        data.id
      );
    } catch (notifError) {
      console.error('Error sending admin report notification:', notifError);
      // swallow notification failure to keep demo stable
    }

    return data;
  }

  /**
   * Add evidence file attachment to a report
   * @param {Object} evidenceData - Evidence data
   * @param {string} evidenceData.reportId - Report ID to attach evidence to
   * @param {string} evidenceData.uploadedByUserId - User ID uploading the file
   * @param {File} evidenceData.file - Multer file object
   * @returns {Promise<Object>} Created attachment object
   * @throws {Error} If file is missing or attachment creation fails
   */
  async addEvidence({ reportId, uploadedByUserId, file }) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const publicUrl = `/api/static/uploads/${file.filename}`; // optionally serve statically via Express

    const { data, error } = await supabase
      .from('attachments')
      .insert([
        {
          url: publicUrl,
          content_type: file.mimetype,
          size_bytes: file.size,
          parent_type: AttachmentParentType.REPORT,
          parent_id: reportId,
          uploaded_by_user_id: uploadedByUserId,
        },
      ])
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Begin reviewing a report
   * Marks report as IN_PROGRESS and prevents other admins from reviewing it
   * @param {Object} reviewData - Review data
   * @param {string} reviewData.reportId - Report ID to review
   * @param {string} reviewData.adminUserId - Admin user ID starting review
   * @param {string} reviewData.adminRole - Admin role (must be ADMIN)
   * @returns {Promise<Object>} Updated report object
   * @throws {Error} If report not found, already in progress (409), or update fails
   */
  async beginReview({ reportId, adminUserId, adminRole }) {
    // 1. Load report
    const { data: report, error: fetchErr } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();
    if (fetchErr) throw fetchErr;

    // 2. Check if already in progress
    if (report.status === ReportStatus.IN_PROGRESS) {
      const conflict = new Error('Report already in progress');
      conflict.statusCode = 409;
      throw conflict;
    }

    // 3. Update report status
    const { data: updated, error } = await supabase
      .from('reports')
      .update({ status: ReportStatus.IN_PROGRESS })
      .eq('id', reportId)
      .select('*')
      .single();
    if (error) throw error;

    // 4. Log history
    await supabase.from('report_status_history').insert([
      {
        report_id: reportId,
        from_status: report.status,
        to_status: ReportStatus.IN_PROGRESS,
        changed_by_user_id: adminUserId,
        admin_note: null,
      },
    ]);

    // 5. Notify the reporter
    // Before: we queried user_profiles to branch on ELDERLY / CAREGIVER / VOLUNTEER.
    // Now: we DO NOT query user_profiles at all.
    // We'll just send a generic update. This is enough for demo.
    try {
      await NotificationService.notifyReportUpdate(
        report.reporter_user_id,
        reportId,
        ReportStatus.IN_PROGRESS
      );
    } catch (notifError) {
      console.error('Error sending report update notification:', notifError);
    }

    return updated;
  }

  /**
   * Resolve a report
   * Marks report as RESOLVED
   * @param {Object} resolveData - Resolution data
   * @param {string} resolveData.reportId - Report ID to resolve
   * @param {string} resolveData.adminUserId - Admin user ID resolving the report
   * @param {string} resolveData.adminRole - Admin role (must be ADMIN)
   * @param {string} [resolveData.note] - Resolution note
   * @returns {Promise<Object>} Updated report object
   * @throws {Error} If report not found or update fails
   */
  async resolveReport({ reportId, adminUserId, adminRole, note }) {
    // Reuse shared close logic
    const result = await this.#closeReport({
      reportId,
      adminUserId,
      adminRole,
      toStatus: ReportStatus.RESOLVED,
      note,
    });

    // After resolving, notify other admins.
    // Before: we tried to read the admin profile to get a pretty name.
    // Now: no DB call, just "Admin".
    try {
      const resolvedBy = 'Admin';
      await NotificationService.notifyAdminReportResolved(reportId, resolvedBy);
    } catch (notifError) {
      console.error('Error sending admin report resolved notification:', notifError);
    }

    return result;
  }

  /**
   * Reject a report
   * Marks report as REJECTED
   * @param {Object} rejectData - Rejection data
   * @param {string} rejectData.reportId - Report ID to reject
   * @param {string} rejectData.adminUserId - Admin user ID rejecting the report
   * @param {string} rejectData.adminRole - Admin role (must be ADMIN)
   * @param {string} [rejectData.note] - Rejection note
   * @returns {Promise<Object>} Updated report object
   * @throws {Error} If report not found or update fails
   */
  async rejectReport({ reportId, adminUserId, adminRole, note }) {
    // Reuse shared close logic
    return this.#closeReport({
      reportId,
      adminUserId,
      adminRole,
      toStatus: ReportStatus.REJECTED,
      note,
    });
  }

  async #closeReport({ reportId, adminUserId, adminRole, toStatus, note }) {
    // 1. Load current report
    const { data: report, error: fetchErr } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();
    if (fetchErr) throw fetchErr;

    // 2. Update status
    const { data: updated, error } = await supabase
      .from('reports')
      .update({ status: toStatus })
      .eq('id', reportId)
      .select('*')
      .single();
    if (error) throw error;

    // 3. Insert into history
    await supabase.from('report_status_history').insert([
      {
        report_id: reportId,
        from_status: report.status,
        to_status: toStatus,
        changed_by_user_id: adminUserId,
        admin_note: note || null,
      },
    ]);

    // 4. Notify the reporter (generic, no user_profiles lookup)
    try {
      await NotificationService.notifyReportUpdate(
        report.reporter_user_id,
        reportId,
        toStatus,
        note
      );
    } catch (notifError) {
      console.error('Error sending report update notification:', notifError);
    }

    return updated;
  }

  /**
   * Get all reports submitted by a user
   * @param {string} userId - ID of the user (reporter)
   * @returns {Promise<Array>} Array of report objects submitted by the user
   * @throws {Error} If database query fails
   */
  async viewMyReports(userId) {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('reporter_user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  /**
   * Get all reports with full user details for admin moderation
   * Includes reporter and reported user profiles, and attachments
   * @returns {Promise<Array>} Array of report objects with full details
   * @throws {Error} If database query fails
   */
  async getAllReportsForAdmin() {
    const { data:reports, error } = await supabase
      .from('reports')
      .select(`
        *,
        reporter:user_profiles!reporter_user_id(*),
        reported:user_profiles!reported_user_id(*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;

    const reportIds = reports.map(r => r.id);
    const { data: attachments } = await supabase
      .from('attachments')
      .select('*')
      .in('parent_id', reportIds)
      .eq('parent_type', 'report');

    // Merge attachments into each report
    const merged = reports.map(report => ({
      ...report,
      attachments: attachments.filter(a => a.parent_id === report.id),
    }));

    return merged;
  }
}

module.exports = new ReportService();