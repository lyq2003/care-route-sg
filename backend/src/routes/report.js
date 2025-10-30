const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const ReportController = require('../controllers/reportController');
const ReportService = require('../services/report');

// User: submit a report
router.post('/', requireAuth, ReportController.submitReport);

// User/Admin: upload evidence file to a report (multipart/form-data, field: file)
router.post('/:reportId/evidence', requireAuth, ReportService.getEvidenceUploadMiddleware(), ReportController.addEvidence);

// Admin-only: begin review
router.post('/:reportId/start-review', requireAuth, requireAdmin, ReportController.beginReview);

// Admin-only: resolve
router.post('/:reportId/resolve', requireAuth, requireAdmin, ReportController.resolveReport);

// Admin-only: reject
router.post('/:reportId/reject', requireAuth, requireAdmin, ReportController.rejectReport);

// User: view my reports
router.get('/me', requireAuth, ReportController.viewMyReports);

module.exports = router;