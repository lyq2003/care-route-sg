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
  
  if (userStatus === 'SUSPENDED') {
    const suspensionEndDate = user.user_metadata?.suspension_end_date;
    const suspensionReason = user.user_metadata?.suspension_reason || 'Administrative action';
    const suspensionDuration = user.user_metadata?.suspension_duration || 'unknown';
    
    if (suspensionEndDate) {
      const endDate = new Date(suspensionEndDate);
      const now = new Date();
      
      if (endDate > now) {
        // Still suspended - clear session and deny access
        req.session.destroy();
        const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return res.status(403).json({ 
          error: `Account Suspended`,
          message: `Your account has been temporarily suspended for ${suspensionDuration} days.`,
          details: {
            reason: suspensionReason,
            daysRemaining: daysRemaining,
            expiresOn: endDate.toLocaleDateString(),
            contactSupport: 'If you believe this is an error, please contact our support team.'
          }
        });
      } else {
        // Suspension has expired - should be auto-unsuspended
        console.log(`User ${user.id} suspension has expired, should be auto-unsuspended`);
      }
    } else {
      // No end date - indefinite suspension
      req.session.destroy();
      return res.status(403).json({ 
        error: `Account Suspended`,
        message: `Your account has been suspended indefinitely.`,
        details: {
          reason: suspensionReason,
          contactSupport: 'Please contact our support team for more information.'
        }
      });
    }
  }

  if (userStatus === 'DEACTIVATED') {
    // Clear session and deny access
    req.session.destroy();
    return res.status(403).json({ 
      error: 'Account Permanently Deactivated',
      message: 'Your account has been permanently deactivated and access cannot be restored.',
      details: {
        reason: user.user_metadata?.deactivation_reason || user.user_metadata?.ban_reason || 'Policy violation',
        contactSupport: 'If you believe this is an error, please contact our support team with your account details.'
      }
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
