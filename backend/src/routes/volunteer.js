const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const VolunteerController = require('../controllers/volunteerController');

router.get('/profile', requireAuth, VolunteerController.getProfile);
router.put('/profile', requireAuth, VolunteerController.updateProfile);

router.get('/getPendingPosts', requireAuth, VolunteerController.getPendingRequest);
router.get('/getFilteredRequests', requireAuth, VolunteerController.getFilteredRequests);
router.put('/acceptRequest', requireAuth, VolunteerController.acceptRequest);
router.put('/cancelRequest', requireAuth, VolunteerController.cancelRequest);
router.put('/completeRequest', requireAuth, VolunteerController.completeRequest);
router.post('/sendProgressUpdate', requireAuth, VolunteerController.sendProgressUpdate);
router.get('/getAcceptedRequest', requireAuth, VolunteerController.getAcceptedRequest);
router.get('/getCompletedRequest', requireAuth, VolunteerController.getCompletedRequest);
module.exports = router;
