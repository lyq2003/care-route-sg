// routes/users.js
const express = require('express');
const User = require('../services/user');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

// Get all users (admin only - you might want to add role-based auth)
router.get('/', requireAuth, async (req, res) => {
  try {
    const users = await User.getAll();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
router.get('/profile', requireAuth, (req, res) => {
  // Transform user data for consistent API response
  const userProfile = {
    id: req.user.id,
    email: req.user.email,
    name: req.user.username,
    avatar: req.user.user_metadata?.avatar_url,
    provider: req.user.user_metadata?.provider,
    created_at: req.user.created_at,
    updated_at: req.user.updated_at
  };
  
  res.json(userProfile);
});

// Update current user profile
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { name, email } = req.body;
    const updatedUser = await User.update(req.user.id, { 
      name, 
      email, 
      avatar: req.user.user_metadata?.avatar_url 
    });
    
    const userProfile={
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.user_metadata?.name || updatedUser.user_metadata?.full_name,
      avatar: updatedUser.user_metadata?.avatar_url,
      provider: updatedUser.user_metadata?.provider,
      created_at: updatedUser.created_at,
      updated_at: updatedUser.updated_at
    }

    res.json(userProfile);
    
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete current user account
router.delete('/profile', requireAuth, async (req, res) => {
  try {
    await User.delete(req.user.id);
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: 'Error during account deletion' });
      }
      res.json({ message: 'Account deleted successfully' });
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;