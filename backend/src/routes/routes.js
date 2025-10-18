const express=require('express');
const router = express.Router();

const authRoutes = require('../controllers/authRouter');
const profileRoutes = require('../controllers/profileRouter');
const adminRoutes = require('./admin');
const userRoutes = require('./users');
const elderlyRoutes = require('./elderly')
const volunteerRoutes = require('./volunteer')
const reportRoutes = require('./report')
const reviewRoutes = require('./review')

router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/admin', adminRoutes);
router.use('/users', userRoutes);
router.use('/elderly', elderlyRoutes);
router.use('/volunteer', volunteerRoutes);
router.use('/reports', reportRoutes);
router.use('/reviews', reviewRoutes);

module.exports= router;