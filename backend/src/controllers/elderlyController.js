const Elderly = require('../domain/elderly');
const UserService = require('../services/user');

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
}

module.exports = ElderlyController;
