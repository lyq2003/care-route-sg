// middleware/auth.js
// Middleware to check authentication
const supabase = require('../config/supabase');

const requireAuth = async (req, res, next) => {
  console.log('Auth check:', {
    hasSession: !!req.session,
    hasUser: !!req.session?.user,
    sessionId: req.session?.id,
    userId: req.session?.user?.id
  });
  
  if (!req.session.user) {
    return res.status(401).json({ error: 'Authentication required', user:null });
  }
  
  // Check if user is suspended
  const user = req.session.user;
  const userStatus = user.user_metadata?.status;
  
  if (userStatus === 'suspended') {
    const suspensionEndDate = user.user_metadata?.suspension_end_date;
    const suspensionReason = user.user_metadata?.suspension_reason || 'Administrative action';
    
    if (suspensionEndDate) {
      const endDate = new Date(suspensionEndDate);
      const now = new Date();
      
      if (endDate > now) {
        // Still suspended - clear session and deny access
        req.session.destroy();
        const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return res.status(403).json({ 
          error: `Your account is suspended. Reason: ${suspensionReason}. Suspension expires in ${daysRemaining} day(s).`
        });
      }
    }
  }

  if (userStatus === 'deactivated' || userStatus === 'banned') {
    // Clear session and deny access
    req.session.destroy();
    return res.status(403).json({ 
      error: 'Your account has been permanently deactivated. Please contact support for assistance.'
    });
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
