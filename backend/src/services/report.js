const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { supabase, supabaseAdmin } = require('../config/supabase');
const ReportStatus = require('../domain/enum/ReportStatus');
const AttachmentParentType = require('../domain/enum/AttachmentParentType');

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

  async submitReport({ reporterUserId, reportedUserId, helpRequestId, reason, description }) {
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

    // history
    await supabase.from('report_status_history').insert([
      {
        report_id: data.id,
        from_status: null,
        to_status: ReportStatus.PENDING,
        changed_by_user_id: reporterUserId,
        admin_note: null,
      },
    ]);

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

  async beginReview({ reportId, adminUserId }) {
    const { data: report, error: fetchErr } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();
    if (fetchErr) throw fetchErr;

    if (report.status === ReportStatus.IN_PROGRESS) {
      const conflict = new Error('Report already in progress');
      conflict.statusCode = 409;
      throw conflict;
    }

    const { data: updated, error } = await supabase
      .from('reports')
      .update({ status: ReportStatus.IN_PROGRESS })
      .eq('id', reportId)
      .select('*')
      .single();
    if (error) throw error;

    await supabase.from('report_status_history').insert([
      {
        report_id: reportId,
        from_status: report.status,
        to_status: ReportStatus.IN_PROGRESS,
        changed_by_user_id: adminUserId,
      },
    ]);

    return updated;
  }

  async resolveReport({ reportId, adminUserId, note }) {
    return this.#closeReport({ reportId, adminUserId, toStatus: ReportStatus.RESOLVED, note });
  }

  async rejectReport({ reportId, adminUserId, note }) {
    return this.#closeReport({ reportId, adminUserId, toStatus: ReportStatus.REJECTED, note });
  }

  async #closeReport({ reportId, adminUserId, toStatus, note }) {
    const { data: report, error: fetchErr } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();
    if (fetchErr) throw fetchErr;

    const { data: updated, error } = await supabase
      .from('reports')
      .update({ status: toStatus })
      .eq('id', reportId)
      .select('*')
      .single();
    if (error) throw error;

    await supabase.from('report_status_history').insert([
      {
        report_id: reportId,
        from_status: report.status,
        to_status: toStatus,
        changed_by_user_id: adminUserId,
        admin_note: note || null,
      },
    ]);

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

  // Admin-specific method to get all reports with full user details
  async getAllReportsForAdmin() {
    const { data, error } = await supabaseAdmin
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

