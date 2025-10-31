const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const UserAccessibilityNeedsController = require('../controllers/userAccessibilityNeedsController');

router.get('/getNeeds', requireAuth, UserAccessibilityNeedsController.getNeeds);
router.put('/update', requireAuth, UserAccessibilityNeedsController.updateAccessibilityNeed);

module.exports = router;

