const { supabase } = require('../config/supabase');
const Role = require('../domain/enum/Role');

/**
 * Elderly Services
 * Service layer for elderly user-specific operations
 * Handles linking PINs, caregiver relationships, and profile management
 * 
 * @namespace ElderlyServices
 * @example
 * const pin = await ElderlyServices.getLinkingPIN('elderly-123');
 * const caregivers = await ElderlyServices.getLinkedCaregivers('elderly-123');
 */
const ElderlyServices = {
  /**
   * Get or generate linking PIN for elderly user
   * Returns existing PIN if available, otherwise generates a new one
   * 
   * @param {string} elderlyUserId - ID of the elderly user
   * @returns {Promise<string>} 6-digit linking PIN
   * @throws {Error} If profile not found or PIN generation fails
   * 
   * @example
   * const pin = await ElderlyServices.getLinkingPIN('elderly-123');
   * console.log(`Linking PIN: ${pin}`);
   */
  async getLinkingPIN(elderlyUserId) {
    // Get current profile
    const { data: profile, error: fetchErr } = await supabase
      .from('user_profiles')
      .select('user_id, role, linking_pin')
      .eq('user_id', elderlyUserId)
      .eq('role', Role.ELDERLY)
      .single();

    if (fetchErr) {
      console.error('Error fetching elderly profile:', fetchErr);
      throw new Error('Failed to fetch elderly profile');
    }

    if (!profile) {
      throw new Error('Elderly profile not found');
    }

    // If PIN already exists, return it
    if (profile.linking_pin) {
      return profile.linking_pin;
    }

    // Generate new PIN
    const newPin = Math.floor(100000 + Math.random() * 900000).toString();

    // Update profile with new PIN
    const { data: updated, error: updateErr } = await supabase
      .from('user_profiles')
      .update({ linking_pin: newPin })
      .eq('user_id', elderlyUserId)
      .select('linking_pin')
      .single();

    if (updateErr) {
      console.error('Error generating PIN:', updateErr);
      throw new Error('Failed to generate linking PIN');
    }

    return updated.linking_pin;
  },

  /**
   * Regenerate linking PIN for elderly user
   * Creates a new PIN and invalidates the old one
   * 
   * @param {string} elderlyUserId - ID of the elderly user
   * @returns {Promise<string>} New 6-digit linking PIN
   * @throws {Error} If profile not found or PIN regeneration fails
   * 
   * @example
   * const newPin = await ElderlyServices.regenerateLinkingPIN('elderly-123');
   */
  async regenerateLinkingPIN(elderlyUserId) {
    const newPin = Math.floor(100000 + Math.random() * 900000).toString();

    const { data: updated, error: updateErr } = await supabase
      .from('user_profiles')
      .update({ linking_pin: newPin })
      .eq('user_id', elderlyUserId)
      .eq('role', Role.ELDERLY)
      .select('linking_pin')
      .single();

    if (updateErr) {
      console.error('Error regenerating PIN:', updateErr);
      throw new Error('Failed to regenerate linking PIN');
    }

    return updated.linking_pin;
  },

  /**
   * Get all caregivers linked to this elderly user
   * Retrieves caregiver profiles linked via caregiver_link table
   * 
   * @param {string} elderlyUserId - ID of the elderly user
   * @returns {Promise<Array>} Array of caregiver profile objects
   * @throws {Error} If database query fails
   * 
   * @example
   * const caregivers = await ElderlyServices.getLinkedCaregivers('elderly-123');
   * console.log(`Linked to ${caregivers.length} caregivers`);
   */
  async getLinkedCaregivers(elderlyUserId) {
    const { data, error } = await supabase
      .from('caregiver_link')
      .select('caregiver:user_profiles!caregiver_user_id (user_id, full_name, email, phone, avatar_url)')
      .eq('elderly_user_id', elderlyUserId);

    if (error) {
      console.error('Error fetching linked caregivers:', error);
      throw error;
    }

    return (data || []).map(r => r.caregiver);
  },

  /**
   * Update elderly user profile
   */
  async updateProfile(elderlyUserId, updates = {}) {
    const allowed = {};
    if ('full_name' in updates) allowed.full_name = updates.full_name;
    if ('email' in updates) allowed.email = updates.email;
    if ('phone' in updates) allowed.phone = updates.phone;
    if ('avatar_url' in updates) allowed.avatar_url = updates.avatar_url;
    if ('mobility_preference' in updates) allowed.mobility_preference = updates.mobility_preference;

    const { data, error } = await supabase
      .from('user_profiles')
      .update(allowed)
      .eq('user_id', elderlyUserId)
      .eq('role', Role.ELDERLY)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating elderly profile:', error);
      throw error;
    }

    return data;
  },
};

module.exports = ElderlyServices;

