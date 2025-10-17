const express=require('express');
const router = express.Router();

const authRoutes = require('../controllers/authRouter');
const profileRoutes = require('../controllers/profileRouter');
const adminRoutes = require('./admin');
const userRoutes = require('./users');
const elderlyRoutes = require('./elderly')
const volunteerRoutes = require('./volunteer')

router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/admin', adminRoutes);
router.use('/users', userRoutes);
router.use('/elderly', elderlyRoutes);
router.use('/volunteer', volunteerRoutes);

module.exports= router;