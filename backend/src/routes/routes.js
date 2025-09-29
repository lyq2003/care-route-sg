const express=require('express');
const router = express.Router();

const authRoutes = require('../controllers/authRouter');
const profileRoutes = require('../controllers/profileRouter');

router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);

module.exports= router;