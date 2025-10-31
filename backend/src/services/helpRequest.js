const { supabaseAdmin, supabase } = require('../config/supabase');
const NotificationService = require('./notificationService');

// Using supabaseAdmin to bypass RLS (Row Level Security)



class HelpRequest {

  static async createRequest(requesterId, longitude, latitude,address,description, urgency, image) {
    const { data, error } = await supabaseAdmin
      .from("help_request")
      .insert({
        requesterId: requesterId,
        longitude: longitude,
        latitude: latitude,
        address:address,
        description:description,
        urgency: urgency,
        image: image,
        helpRequestStatus: 1,
        geom: `SRID=4326;POINT(${longitude} ${latitude})`,
      })
      .select();

    if (error) {
      throw error
    } else {
      // Send notification to elderly user about request creation
      if (data && data.length > 0) {
        try {
          await NotificationService.notifyHelpRequestCreated(requesterId, data[0].id);
        } catch (notifError) {
          console.error('Error sending help request created notification:', notifError);
          // Don't fail the request creation if notification fails
        }

        // Notify all linked caregivers about the help request
        try {
          // Get elderly user info
          const { data: elderlyProfile } = await supabaseAdmin
            .from('user_profiles')
            .select('username, full_name')
            .eq('user_id', requesterId)
            .single();
          
          const elderlyName = elderlyProfile?.full_name || elderlyProfile?.username || 'Elderly user';

          // Get all linked caregivers
          const { data: caregiverLinks } = await supabaseAdmin
            .from('caregiver_link')
            .select('caregiver_user_id')
            .eq('elderly_user_id', requesterId);

          // Notify each caregiver
          if (caregiverLinks && caregiverLinks.length > 0) {
            for (const link of caregiverLinks) {
              await NotificationService.notifyCaregiverHelpRequestInitiated(
                link.caregiver_user_id,
                elderlyName,
                data[0].id,
                'Pending'
              );
            }
          }
        } catch (caregiverNotifError) {
          console.error('Error sending caregiver help request notification:', caregiverNotifError);
          // Don't fail the request creation if caregiver notification fails
        }

        // Notify nearby volunteers about new help request
        try {
          // Get all active volunteer profiles (could be improved with geolocation filtering)
          const { data: volunteers } = await supabaseAdmin
            .from('user_profiles')
            .select('user_id, online')
            .eq('role', 'VOLUNTEER')
            .eq('status', 'ACTIVE');

          // For simplicity, notify all online volunteers within reasonable distance
          // In production, you would use geolocation queries to find nearby volunteers
          const radiusKm = 10; // 10km radius
          const location = address || `${latitude}, ${longitude}`;
          
          if (volunteers && volunteers.length > 0) {
            // Notify online volunteers (in production, filter by distance)
            const onlineVolunteers = volunteers.filter(v => v.online);
            for (const volunteer of onlineVolunteers) {
              // Calculate approximate distance (placeholder - would use actual geolocation in production)
              const distance = Math.random() * radiusKm; // Placeholder distance
              
              await NotificationService.notifyVolunteerNewRequestNearby(
                volunteer.user_id,
                location,
                distance.toFixed(1),
                data[0].id
              );
            }
          }
        } catch (volunteerNotifError) {
          console.error('Error sending volunteer nearby notification:', volunteerNotifError);
          // Don't fail the request creation if volunteer notification fails
        }
      }
      return data
    }

  }


  static async endHelpRequest(helpRequestId) {
    try {

      const { data, error } = await supabaseAdmin
        .from('help_request')
        .update({
          helpRequestStatus: 3
        })
        .eq('id',helpRequestId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating help request status to end:', error);
      throw error;
    }
  }



  static async getCompletedHelpRequestswithVolunteer(requesterId) {

    const { data, error } = await supabaseAdmin
      .from("help_request")
      .select()
      .eq("requesterId", requesterId)
      .not("assignedVolunteerId", "is", null);
      //.is("assignedVolunteerId", null);

    if (error) {
      throw error
    } else {
      return data
    }

  }


}



module.exports = HelpRequest;