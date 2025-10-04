const express = require('express');
const ElderlyController = require('../controllers/elderlyController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/profile', requireAuth, ElderlyController.getProfile);
router.put('/profile', requireAuth, ElderlyController.updateProfile);

module.exports = router;
