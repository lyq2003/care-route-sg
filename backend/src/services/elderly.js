const { supabase, supabaseAdmin } = require('../config/supabase');
const Role = require('../domain/enum/Role');

const ElderlyServices = {
  /**
   * Get or generate linking PIN for elderly user
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

    maxRetries = 5;

    for (let attempt = 0; attempt < maxRetries; attempt++) {

      console.log(`Attempt ${attempt + 1}: Creating linking pin`);


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
      } else {
        return updated.linking_pin;
      }



    }

  },

  /**
   * Regenerate linking PIN for elderly user
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


  async getRecentActivityByElderlyID(elderlyID) {
    const { data, error } = await supabaseAdmin
      .from("help_request")
      .select(`id, description, createdAt, help_request_status (statusName), help_request_assignedVolunteerId_fkey (username, phone_number)`)
      .eq("requesterId", elderlyID)
      .neq("helpRequestStatus", 1)
      .not("assignedVolunteerId", "is", null);;

    if (error) {
      throw error
    } else {
      return data
    }
  }
};

module.exports = ElderlyServices;

