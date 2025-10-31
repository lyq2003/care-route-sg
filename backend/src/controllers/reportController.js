const ReportService = require('../services/report');
const ReportStatus = require('../domain/enum/ReportStatus');
const adminService = require('../services/admin');
const { supabaseAdmin } = require('../config/supabase');

class ReportController {
  submitReport = async (req, res) => {
    try {
      const reporterUserId = req.user.id;
      const { reportedUserId, helpRequestId, reason, description } = req.body;

      if (!reportedUserId || !reason) {
        return res.status(400).json({ error: 'reportedUserId and reason are required' });
      }

      const report = await ReportService.submitReport({
        reporterUserId,
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

  beginReview = async (req, res) => {
    try {
      const adminUserId = req.user.id;
      const { reportId } = req.params;

      const updated = await ReportService.beginReview({ reportId, adminUserId });
      return res.status(200).json({ success: true, data: updated });
    } catch (error) {
      console.error('beginReview error:', error);
      const status = error.statusCode || 500;
      return res.status(status).json({ error: error.message });
    }
  };

  // Get all reports for admin review
  getAllReports = async (req, res) => {
    try {
      // Use the admin service method to get all reports with full user details
      const reports = await ReportService.getAllReportsForAdmin();

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
  };

  // Start reviewing a report
  startReportReview = async (req, res) => {
    try {
      const { reportId } = req.params;
      const adminUserId = req.user.id;

      if (!reportId) {
        return res.status(400).json({
          success: false,
          error: 'Report ID is required'
        });
      }

      const report = await ReportService.beginReview({ reportId, adminUserId });

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
  };
  // Resolve a report with disciplinary action
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
      const resolvedReport = await ReportService.resolveReport({ 
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

  // Reject a report
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

      const rejectedReport = await ReportService.rejectReport({ 
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

