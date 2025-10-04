const UserService = require('../services/user');
const Role = require('../models/enum/Role');
const User = require('../models/User');

/**
 * Utility: remove sensitive data before returning to the client
 */
function sanitize(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}

/**
 * GET /users or /users/:id
 * - Admins can view anyone.
 * - Normal users can only view themselves.
 */
async function getProfile(req, res) {
  try {
    const targetId =
      req.params.id === 'me' || !req.params.id ? req.auth.userId : req.params.id;

    if (!targetId) {
      return res.status(400).json({ error: 'Missing user ID' });
    }

    // If user is not admin and not accessing own account
    if (targetId !== req.auth.userId && req.auth.role !== Role.ADMIN) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Fetch user (from Supabase Auth)
    const user = await UserService.findById(targetId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Sanitize response
    return res.json(sanitize(user));
  } catch (error) {
    console.error('Error in getProfile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PATCH /users/me or /users/:id
 * - Users can update their own info (email, name, avatar).
 * - Admins can update any user.
 */
async function updateProfile(req, res) {
  try {
    const targetId =
      req.params.id === 'me' || !req.params.id ? req.auth.userId : req.params.id;

    if (!targetId) {
      return res.status(400).json({ error: 'Missing user ID' });
    }

    const isSelf = targetId === req.auth.userId;
    const isAdmin = req.auth.role === Role.ADMIN;
    if (!isSelf && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Fetch user
    const existingUser = await UserService.findById(targetId);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent forbidden changes
    if ('status' in req.body || 'role' in req.body) {
      return res.status(400).json({
        error: 'Use AdminController for status/role changes',
        allowedFields: ['name', 'email', 'avatar'],
      });
    }

    // Prepare new data
    const userData = {
      email: req.body.email || existingUser.email,
      name: req.body.name || existingUser.user_metadata?.name,
      avatar:
        req.body.avatar ||
        existingUser.user_metadata?.avatar_url ||
        existingUser.user_metadata?.avatar,
    };

    // Validation (optional, using User model)
    const { isValid, errors } = User.validate({
      fullname: userData.name,
      phone: existingUser.phone || 'unknown',
      email: userData.email,
      status: existingUser.status || 'active',
      role: existingUser.role || 'unknown',
    });
    if (!isValid) {
      return res.status(400).json({ errors });
    }

    // Update in Supabase
    const updatedUser = await UserService.update(targetId, userData);
    return res.json(sanitize(updatedUser));
  } catch (error) {
    console.error('Error in updateProfile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /users (Admin only)
 * - Lists all user profiles
 */
async function getAllUsers(req, res) {
  try {
    if (req.auth.role !== Role.ADMIN) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const users = await UserService.getAll();
    return res.json(users.map(sanitize));
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * DELETE /users/me — disabled (self-deletion not allowed)
 */
async function deleteProfile(req, res) {
  return res.status(403).json({
    error: 'Self-deletion is not allowed. Please contact an administrator.',
  });
}

module.exports = {
  getProfile,
  updateProfile,
  getAllUsers,
  deleteProfile,
};
