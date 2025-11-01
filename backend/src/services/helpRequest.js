const { supabaseAdmin, supabase } = require('../config/supabase');
const NotificationService = require('./notificationService');

// Using supabaseAdmin to bypass RLS (Row Level Security)

/**
 * Help Request service class
 * Handles creation and retrieval of help requests from elderly users
 * Manages notifications to caregivers and volunteers when requests are created
 * 
 * @class HelpRequest
 * @example
 * // Create a new help request
 * const request = await HelpRequest.createRequest(
 *   'elderly-123',
 *   103.8198, // longitude
 *   1.3521,   // latitude
 *   '123 Main St, Singapore',
 *   'Need help going to clinic',
 *   'HIGH',
 *   'image-url.jpg'
 * );
 */
class HelpRequest {

  /**
   * Creates a new help request for an elderly user
   * Automatically notifies linked caregivers and nearby volunteers
   * 
   * @static
   * @param {string} requesterId - ID of the elderly user requesting help
   * @param {number} longitude - Longitude coordinate of request location
   * @param {number} latitude - Latitude coordinate of request location
   * @param {string} address - Address or description of the location
   * @param {string} description - Description of the help needed
   * @param {string} urgency - Urgency level (e.g., 'HIGH', 'MEDIUM', 'LOW')
   * @param {string} [image] - Optional image URL attached to the request
   * @returns {Promise<Array>} Created help request data
   * @throws {Error} If database insertion fails
   * 
   * @example
   * const request = await HelpRequest.createRequest(
   *   'user-123',
   *   103.8198,
   *   1.3521,
   *   '123 Orchard Road',
   *   'Need assistance going to clinic',
   *   'HIGH',
   *   'https://example.com/image.jpg'
   * );
   */
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



  /**
   * Gets all completed help requests for a user that had a volunteer assigned
   * Useful for showing reviewable completed requests
   * 
   * @static
   * @param {string} requesterId - ID of the elderly user
   * @returns {Promise<Array>} Array of completed help requests with assigned volunteers
   * @throws {Error} If database query fails
   * 
   * @example
   * const completedRequests = await HelpRequest.getCompletedHelpRequestswithVolunteer('elderly-123');
   * // Returns requests where assignedVolunteerId is not null
   */
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