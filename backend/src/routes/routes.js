const express=require('express');
const router = express.Router();

const authRoutes = require('../features/auth/authRouter');

router.use('/auth', authRoutes);

module.exports= router;