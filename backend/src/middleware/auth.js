// middleware/auth.js
// Middleware to check authentication
const supabase = require('../config/supabase');

const requireAuth = async (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Authentication required', user:null });
  }
  
  req.user = req.session.user;
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Add your admin role logic here
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
};

module.exports = {
  requireAuth,
  requireAdmin
};
