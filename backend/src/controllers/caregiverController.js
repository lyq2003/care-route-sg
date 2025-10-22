const CaregiverServices = require('../services/caregiver');
const Caregiver = require('../domain/caregiver');
const { supabase } = require('../config/supabase');
const Role = require('../domain/enum/Role');

class CaregiverController {
  static async me(req, res) {
    try {
      // Get caregiver's own profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_id, username, full_name, email, phone, avatar_url, role')
        .eq('user_id', req.user.id)
        .eq('role', Role.CAREGIVER)
        .single();
      
      if (profileError) throw profileError;
      
      // Format profile data
      const caregiverProfile = {
        id: profile.user_id,
        name: profile.full_name || profile.username || '',
        email: profile.email || '',
        phone: profile.phone || '',
        avatar: profile.avatar_url || '',
        role: profile.role
      };
      
      // Get linked elderly data
      const linkedElderly = await CaregiverServices.getLinkedElderly(req.user.id);
      
      res.json({ 
        profile: caregiverProfile,
        linkedElderly: linkedElderly 
      });
    } catch (e) { 
      console.error('Error in caregiver/me:', e);
      res.status(500).json({ error: e.message }); 
    }
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

  static async updateElderlyProfile(req, res) {
    try {
      const { elderlyUserId } = req.params;
      const updates = req.body || {};
      
      // Verify the elderly user is linked to this caregiver
      const linkedElderly = await CaregiverServices.getLinkedElderly(req.user.id);
      const isLinked = linkedElderly.some(elderly => elderly.user_id === elderlyUserId);
      
      if (!isLinked) {
        return res.status(403).json({ error: 'Not authorized to update this elderly user profile' });
      }
      
      const updated = await CaregiverServices.updateElderlyProfile(elderlyUserId, updates);
      res.json({ message: 'Elderly profile updated', profile: updated });
    } catch (e) { 
      console.error('Error updating elderly profile:', e);
      res.status(400).json({ error: e.message }); 
    }
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