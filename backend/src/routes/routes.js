const express=require('express');
const router = express.Router();

const authRoutes = require('../features/auth/authRouter');
const profileRoutes = require('../features/profile/profileRouter');

router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);

module.exports= router;