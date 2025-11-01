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

  // fixed code
  async getAllReportsForAdmin() {
    // First get all reports
    const { data: reports, error: reportsError } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (reportsError) {
      console.error('getAllReportsForAdmin reports error:', reportsError);
      throw reportsError;
    }

    if (!reports || reports.length === 0) {
      console.log('getAllReportsForAdmin: No reports found');
      return [];
    }

    // Get all unique user IDs from reports
    const userIds = [...new Set([
      ...reports.map(r => r.reporter_user_id),
      ...reports.map(r => r.reported_user_id)
    ])].filter(Boolean);

    console.log(`getAllReportsForAdmin: Found ${userIds.length} unique users to fetch`);

    // Get user auth data and profiles
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) {
      console.error('Error fetching auth users:', authError);
      throw authError;
    }

    const { data: profilesData, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .in('user_id', userIds);

    if (profilesError) {
      console.warn('Error fetching user profiles:', profilesError);
    }

    // Create user lookup map
    const userMap = {};
    authData.users.forEach(user => {
      const profile = profilesData?.find(p => p.user_id === user.id);
      userMap[user.id] = {
        id: user.id,
        email: user.email,
        name: profile?.full_name || profile?.username || user.user_metadata?.full_name || user.user_metadata?.displayName || user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown User',
        full_name: profile?.full_name || profile?.username || user.user_metadata?.full_name || user.user_metadata?.displayName || user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown User',
        role: profile?.role || user.user_metadata?.role || 'elderly'
      };
    });

    // Get attachments for all reports
    const reportIds = reports.map(r => r.id);
    const { data: attachments } = await supabase
      .from('attachments')
      .select('*')
      .in('parent_id', reportIds)
      .eq('parent_type', 'report');

    // Enhance reports with user data and attachments
    const enhancedReports = reports.map(report => ({
      ...report,
      reporter: userMap[report.reporter_user_id] || {
        id: report.reporter_user_id,
        name: 'Unknown User',
        full_name: 'Unknown User', 
        role: 'elderly'
      },
      reported: userMap[report.reported_user_id] || {
        id: report.reported_user_id,
        name: 'Unknown User',
        full_name: 'Unknown User',
        role: 'elderly'
      },
      attachments: attachments ? attachments.filter(a => a.parent_id === report.id) : []
    }));

    console.log(`getAllReportsForAdmin: Returning ${enhancedReports.length} enhanced reports`);
    return enhancedReports;
  }
}

module.exports = new ReportService();