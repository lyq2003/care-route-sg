const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const CaregiverController = require('../controllers/caregiverController');

router.use(requireAuth);
router.get('/me', CaregiverController.me);
router.patch('/me', CaregiverController.updateProfile);
router.post('/link', CaregiverController.linkByPIN);
router.get('/linked-elderly', CaregiverController.getLinkedElderly);
router.patch('/elderly/:elderlyUserId', CaregiverController.updateElderlyProfile);
router.post('/reports', CaregiverController.submitReport);
router.get('/history/:elderlyUserId', CaregiverController.requestHistory);

// Location tracking routes
router.get('/elderly/:elderlyUserId/location', CaregiverController.getElderlyLocation);
router.get('/elderly/:elderlyUserId/location-history', CaregiverController.getElderlyLocationHistory);
//router.get('/active-trips', CaregiverController.getActiveTrips);

module.exports = router;