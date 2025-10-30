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

class ReportService {
  getEvidenceUploadMiddleware() {
    return upload.single('file');
  }

  // reporterRole now comes from controller (req.user.role)
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

  // adminRole now comes from controller (req.user.role)
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

  async viewMyReports(userId) {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('reporter_user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  // This stays mostly the same. It just reads reports + attachments.
  // It does NOT look at user_profiles, so it's safe.
  async getAllReportsForAdmin() {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        reporter:auth.users!reporter_user_id(*),
        reported:auth.users!reported_user_id(*),
        attachments(*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
}

module.exports = new ReportService();