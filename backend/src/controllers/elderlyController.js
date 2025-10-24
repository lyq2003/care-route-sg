const Elderly = require('../domain/elderly');
const UserService = require('../services/user');
const ElderlyServices = require('../services/elderly');

class ElderlyController {
  static async getProfile(req, res) {
    try {
      const elderly = await UserService.findById(req.user.id);
      if (!elderly) return res.status(404).json({ error: 'Not found' });
      res.json(elderly);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updateProfile(req, res) {
    try {
      const { mobilityPreference } = req.body;
      const updated = await UserService.update(req.user.id, { mobilityPreference });
      res.json({ message: 'Profile updated', updated });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get linking PIN for elderly user (generates one if it doesn't exist)
   */
  static async getLinkingPIN(req, res) {
    try {
      const pin = await ElderlyServices.getLinkingPIN(req.user.id);
      res.json({ 
        message: 'Linking PIN retrieved successfully', 
        pin,
        instructions: 'Share this 6-digit PIN with your caregiver to link your accounts.'
      });
    } catch (err) {
      console.error('Get linking PIN error:', err);
      res.status(500).json({ error: err.message || 'Failed to get linking PIN' });
    }
  }

  /**
   * Regenerate linking PIN for elderly user
   */
  static async regenerateLinkingPIN(req, res) {
    try {
      const pin = await ElderlyServices.regenerateLinkingPIN(req.user.id);
      res.json({ 
        message: 'New linking PIN generated successfully', 
        pin,
        instructions: 'Your old PIN is no longer valid. Share this new 6-digit PIN with your caregiver.'
      });
    } catch (err) {
      console.error('Regenerate linking PIN error:', err);
      res.status(500).json({ error: err.message || 'Failed to regenerate linking PIN' });
    }
  }

  /**
   * Get all caregivers linked to this elderly user
   */
  static async getLinkedCaregivers(req, res) {
    try {
      const caregivers = await ElderlyServices.getLinkedCaregivers(req.user.id);
      res.json({ caregivers });
    } catch (err) {
      console.error('Get linked caregivers error:', err);
      res.status(500).json({ error: err.message || 'Failed to get linked caregivers' });
    }
  }
}

module.exports = ElderlyController;
