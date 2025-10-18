const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const ReportController = require('../controllers/reportController');
const ReportService = require('../services/report');

// User: submit a report
router.post('/', requireAuth, ReportController.submitReport);

// User/Admin: upload evidence file to a report (multipart/form-data, field: file)
router.post('/:reportId/evidence', requireAuth, ReportService.getEvidenceUploadMiddleware(), ReportController.addEvidence);

// Admin: begin review
router.post('/:reportId/start-review', requireAuth, ReportController.beginReview);

// Admin: resolve
router.post('/:reportId/resolve', requireAuth, ReportController.resolveReport);

// Admin: reject
router.post('/:reportId/reject', requireAuth, ReportController.rejectReport);

// User: view my reports
router.get('/me', requireAuth, ReportController.viewMyReports);

module.exports = router;

