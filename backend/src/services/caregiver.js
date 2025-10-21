const { supabase } = require('../config/supabase');
const Role = require('../domain/enum/Role');
const ReportStatus = require('../domain/enum/ReportStatus'); // keep if you have it
const NotificationService = require('./notificationService');

const CaregiverServices = {
  async linkToElderlyByPIN(caregiverUserId, pin) {
    console.log('Attempting to link with PIN:', pin);
    
    const { data: elderlyProfile, error: pinErr } = await supabase
      .from('user_profiles')
      .select('user_id, role, linking_pin')
      .eq('linking_pin', pin)
      .eq('role', Role.ELDERLY)
      .single();
    
    console.log('PIN lookup result:', { elderlyProfile, pinErr });
    
    if (pinErr) {
      console.error('PIN lookup error:', pinErr);
      throw new Error('Invalid or expired PIN');
    }
    
    if (!elderlyProfile) {
      throw new Error('No elderly user found with this PIN');
    }

    // Get caregiver name for notification
    const { data: caregiverProfile, error: caregiverErr } = await supabase
      .from('user_profiles')
      .select('username, full_name')
      .eq('user_id', caregiverUserId)
      .single();
    
    const caregiverName = caregiverProfile?.full_name || caregiverProfile?.username || 'Your caregiver';

    const { data: link, error: linkErr } = await supabase
      .from('caregiver_links')
      .upsert(
        { caregiver_user_id: caregiverUserId, elderly_user_id: elderlyProfile.user_id },
        { onConflict: 'caregiver_user_id,elderly_user_id' }
      )
      .select('*')
      .single();
    if (linkErr) throw linkErr;

    // Get elderly name for caregiver notification
    const { data: elderlyProfileData, error: elderlyNameErr } = await supabase
      .from('user_profiles')
      .select('username, full_name')
      .eq('user_id', elderlyProfile.user_id)
      .single();
    
    const elderlyName = elderlyProfileData?.full_name || elderlyProfileData?.username || 'Elderly user';

    // Send notification to elderly user
    try {
      await NotificationService.notifyCaregiverLinked(elderlyProfile.user_id, caregiverName);
    } catch (notifError) {
      console.error('Error sending caregiver linked notification:', notifError);
      // Don't fail the link if notification fails
    }

    // Send notification to caregiver about successful linking
    try {
      await NotificationService.notifyCaregiverElderlyLinked(caregiverUserId, elderlyName);
    } catch (notifError) {
      console.error('Error sending elderly linked notification to caregiver:', notifError);
      // Don't fail the link if notification fails
    }

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