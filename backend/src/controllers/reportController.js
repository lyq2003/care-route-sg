const ReportService = require('../services/report');
const ReportStatus = require('../domain/enum/ReportStatus');

class ReportController {
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