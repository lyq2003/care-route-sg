const express = require('express');
const { supabase, supabaseAdmin } = require('../config/supabase');
const router= express.Router();
const NotificationService = require('./notificationService');

/**
 * Volunteer Services
 * Service layer for volunteer-specific operations
 * Handles help request management: viewing, accepting, cancelling, and completing requests
 * 
 * @namespace VolunteerServices
 */

/**
 * Get pending help requests near volunteer's location
 * Uses database function to find requests within 10km radius
 * 
 * @param {number} latitude - Volunteer's latitude coordinate
 * @param {number} longitude - Volunteer's longitude coordinate
 * @param {number} [limit] - Maximum number of requests to return
 * @param {number} [offset] - Number of requests to skip (for pagination)
 * @returns {Promise<Array>} Array of pending help requests
 * @throws {Error} If database query fails
 * 
 * @example
 * const requests = await VolunteerServices.getPendingRequests(1.3521, 103.8198, 10, 0);
 */
async function getPendingRequests(latitude,longitude,limit,offset){
    const { data, error } = await supabaseAdmin.rpc('get_pending_requests_nearby', {
        lat: latitude,
        lon: longitude,
        radius_meters: 10000,
        limit_count: limit,
        offset_count: offset
    });
    if(error) throw error;
    return data;
}

// edit the filters.distance after mallvin change table 

async function getFilteredRequests(latitude,longitude,filters,limit,offset){
    //console.log("filters json are: ",filters, "latitude:", latitude, "longitude:",longitude);
    const { data, error } = await supabaseAdmin.rpc("get_pending_requests_nearby", {
        lat: latitude,
        lon: longitude,
        radius_meters: filters.distance,
        limit_count: limit,
        offset_count: offset,
    });
    
    if(error) throw error;
    let filteredData = data;

    // Apply urgency filter (if not 'all')
    if (filters.urgency && filters.urgency !== "all") {
        filteredData = filteredData.filter((item) => item.urgency === filters.urgency);
    }

    return filteredData;    
}

/**
 * Accept a help request
 * Assigns volunteer to the request and updates status to ACCEPTED (status 2)
 * 
 * @param {string} postId - ID of the help request
 * @param {string} volunteerId - ID of the volunteer accepting the request
 * @returns {Promise<Object>} Updated help request object
 * @throws {Error} If request not found or update fails
 * 
 * @example
 * const request = await VolunteerServices.acceptRequest('request-123', 'volunteer-456');
 */
async function acceptRequest(postId,volunteerId){
    const {data,error}= await supabaseAdmin
    .from("help_request")
    .update({assignedVolunteerId: volunteerId, helpRequestStatus: "2" })
    .eq('id',postId)
    .select()
    .single();

    if(error) throw error;
    return data;
}

async function cancelRequest(postId,volunteerId){
    const {data,error}= await supabaseAdmin
    .from("help_request")
    .update({assignedVolunteerId: null, helpRequestStatus: "1" })
    .eq('id',postId)
    .eq('assignedVolunteerId',volunteerId)
    .select()
    .single();

    if(error) throw error;
    return data;
}

async function getAcceptedRequest(latitude,longitude,volunteerId){
    const { data, error } = await supabaseAdmin.rpc("get_accepted_requests",{
        lat: latitude,
        lon: longitude,
        volunteer_id: volunteerId
    })
    
    if(error) throw error;

    if (!data || data.length === 0) {
        return null;
    }
    return data;
}

/**
 * Complete a help request
 * Updates request status to COMPLETED (status 4) and sends notifications
 * Notifies elderly user, linked caregivers, and volunteer about completion
 * 
 * @param {string} postId - ID of the help request
 * @param {string} volunteerId - ID of the volunteer completing the request
 * @param {string} elderlyId - ID of the elderly user who requested help
 * @returns {Promise<Object>} Updated help request object
 * @throws {Error} If request not found or update fails
 * 
 * @example
 * const request = await VolunteerServices.completeRequest('request-123', 'volunteer-456', 'elderly-789');
 */
async function completeRequest(postId, volunteerId, elderlyId) {
    // Update request status to completed
    const {data, error} = await supabaseAdmin
        .from("help_request")
        .update({helpRequestStatus: "4"}) // 4 = COMPLETED
        .eq('id', postId)
        .eq('assignedVolunteerId', volunteerId)
        .select()
        .single();

    if(error) throw error;

    // Get volunteer name for notification
    const { data: volunteerProfile } = await supabaseAdmin
        .from('user_profiles')
        .select('username, full_name')
        .eq('user_id', volunteerId)
        .single();
    
    const volunteerName = volunteerProfile?.full_name || volunteerProfile?.username || 'Your volunteer';

    // Send completion notification
    try {
        await NotificationService.notifyHelpRequestCompleted(elderlyId, postId, volunteerName);
        
        // Send review reminder after a short delay (or immediately)
        await NotificationService.notifyReviewReminder(elderlyId, postId, volunteerName);

        // Also notify caregivers linked to this elderly user
        const { data: elderlyProfile } = await supabaseAdmin
            .from('user_profiles')
            .select('username, full_name')
            .eq('user_id', elderlyId)
            .single();
        
        const elderlyName = elderlyProfile?.full_name || elderlyProfile?.username || 'Elderly user';

        // Get all linked caregivers
        const { data: caregiverLinks } = await supabaseAdmin
            .from('caregiver_link')
            .select('caregiver_user_id')
            .eq('elderly_user_id', elderlyId);

        // Notify each caregiver
        if (caregiverLinks && caregiverLinks.length > 0) {
            for (const link of caregiverLinks) {
                await NotificationService.notifyCaregiverHelpRequestCompleted(
                    link.caregiver_user_id,
                    elderlyName,
                    postId
                );
            }
        }

        // Notify the volunteer about successful completion
        await NotificationService.notifyVolunteerRequestCompleted(
            volunteerId,
            elderlyName,
            postId
        );
    } catch (notifError) {
        console.error('Error sending completion notifications:', notifError);
        // Don't fail the complete if notification fails
    }

    return data;
}


module.exports = {
    getPendingRequests,
    getFilteredRequests,
    acceptRequest,
    getAcceptedRequest,
    cancelRequest,
    completeRequest,
}
