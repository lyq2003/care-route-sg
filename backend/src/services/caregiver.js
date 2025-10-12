const { supabase } = require('../config/supabase');
const Role = require('../domain/enum/Role');
const ReportStatus = require('../domain/enum/ReportStatus'); // keep if you have it

const CaregiverServices = {
  async linkToElderlyByPIN(caregiverUserId, pin) {
    const { data: elderlyProfile, error: pinErr } = await supabase
      .from('user_profiles')
      .select('user_id, role, linking_pin')
      .eq('linking_pin', pin)
      .eq('role', Role.ELDERLY)
      .single();
    if (pinErr || !elderlyProfile) throw new Error('Invalid or expired PIN');

    const { data: link, error: linkErr } = await supabase
      .from('caregiver_links')
      .upsert(
        { caregiver_user_id: caregiverUserId, elderly_user_id: elderlyProfile.user_id },
        { onConflict: 'caregiver_user_id,elderly_user_id' }
      )
      .select('*')
      .single();
    if (linkErr) throw linkErr;
    return link;
  },

  async getLinkedElderly(caregiverUserId) {
    const { data, error } = await supabase
      .from('caregiver_links')
      .select('elderly:user_profiles (user_id, full_name, email, phone, avatar_url, mobility_preference)')
      .eq('caregiver_user_id', caregiverUserId);
    if (error) throw error;
    return (data || []).map(r => r.elderly);
  },

  async submitReport(caregiverUserId, payload) {
    const { linkedElderlyUserId, reportedVolunteerUserId, reasons = [], description = null } = payload;

    const { data: link, error: linkErr } = await supabase
      .from('caregiver_links')
      .select('elderly_user_id')
      .eq('caregiver_user_id', caregiverUserId)
      .eq('elderly_user_id', linkedElderlyUserId)
      .single();
    if (linkErr || !link) throw new Error('Not linked to this Elderly');

    const { data: report, error: repErr } = await supabase
      .from('reports')
      .insert([{
        reporter_user_id: caregiverUserId,
        on_behalf_of_elderly_user_id: linkedElderlyUserId,
        reported_user_id: reportedVolunteerUserId,
        reasons, description,
        status: ReportStatus ? ReportStatus.PENDING : 'PENDING',
      }])
      .select('*')
      .single();
    if (repErr) throw repErr;
    return report;
  },

  async getRequestHistory(caregiverUserId, elderlyUserId, { limit = 20, offset = 0 } = {}) {
    const { data: link, error: linkErr } = await supabase
      .from('caregiver_links')
      .select('elderly_user_id')
      .eq('caregiver_user_id', caregiverUserId)
      .eq('elderly_user_id', elderlyUserId)
      .single();
    if (linkErr || !link) throw new Error('Not linked to this Elderly');

    const { data, error } = await supabase
      .from('help_requests')
      .select('id, created_at, status, description, assigned_volunteer_user_id')
      .eq('elderly_user_id', elderlyUserId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return data || [];
  },

  async updateProfile(caregiverUserId, updates = {}) {
    const allowed = {};
    if ('full_name' in updates) allowed.full_name = updates.full_name;
    if ('email' in updates) allowed.email = updates.email;
    if ('phone' in updates) allowed.phone = updates.phone;
    if ('avatar_url' in updates) allowed.avatar_url = updates.avatar_url; // optional

    const { data, error } = await supabase
      .from('user_profiles')
      .update(allowed)
      .eq('user_id', caregiverUserId)
      .eq('role', Role.CAREGIVER)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },
};

module.exports = CaregiverServices;