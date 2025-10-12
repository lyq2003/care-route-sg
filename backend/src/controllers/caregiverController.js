const CaregiverServices = require('../services/caregiverServices');
const Caregiver = require('../domain/caregiver');

class CaregiverController {
  static async me(req, res) {
    try {
      const linked = await CaregiverServices.getLinkedElderly(req.user.id);
      res.json({ linkedElderly: linked });
    } catch (e) { res.status(500).json({ error: e.message }); }
  }

  static async updateProfile(req, res) {
    try {
      // Pull current profile to validate merged data (optional but clean)
      const updates = req.body || {};
      const merged = { ...updates, role: 'CAREGIVER' };
      const { isValid, errors } = Caregiver.validate(merged);
      if (!isValid) return res.status(400).json({ errors });

      const updated = await CaregiverServices.updateProfile(req.user.id, updates);
      res.json({ message: 'Profile updated', profile: updated });
    } catch (e) { res.status(400).json({ error: e.message }); }
  }

  static async linkByPIN(req, res) {
    try {
      const { pin } = req.body || {};
      if (!pin) return res.status(400).json({ error: 'PIN is required' });
      const link = await CaregiverServices.linkToElderlyByPIN(req.user.id, pin);
      res.status(201).json({ message: 'Linked', link });
    } catch (e) { res.status(400).json({ error: e.message }); }
  }

  static async getLinkedElderly(req, res) {
    try { res.json(await CaregiverServices.getLinkedElderly(req.user.id)); }
    catch (e) { res.status(500).json({ error: e.message }); }
  }

  static async submitReport(req, res) {
    try {
      const report = await CaregiverServices.submitReport(req.user.id, req.body || {});
      res.status(201).json(report);
    } catch (e) { res.status(400).json({ error: e.message }); }
  }

  static async requestHistory(req, res) {
    try {
      const { elderlyUserId } = req.params;
      const { limit, offset } = req.query;
      const data = await CaregiverServices.getRequestHistory(
        req.user.id, elderlyUserId,
        { limit: Number(limit) || 20, offset: Number(offset) || 0 }
      );
      res.json(data);
    } catch (e) { res.status(400).json({ error: e.message }); }
  }
}

module.exports = CaregiverController;