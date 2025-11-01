const { supabase } = require('../config/supabase');
const UserService = require('../services/user');
const VolunteerServices = require('../services/volunteerServices');
const {getReceiverSocketId, io} = require('../middleware/socket.js');
const NotificationService = require('../services/notificationService');

/**
 * Volunteer Controller
 * Handles HTTP requests for volunteer operations
 * Provides endpoints for viewing help requests, accepting/cancelling requests, and completing tasks
 * All methods require volunteer authentication
 * 
 * @class VolunteerController
 * @example
 * // Used in routes: router.get('/profile', VolunteerController.getProfile);
 */
class VolunteerController {
    /**
     * Get volunteer profile
     * @route GET /api/volunteer/profile
     * @access Private (Volunteer only)
     * @param {Request} req - Express request object
     * @param {string} req.user.id - Volunteer user ID (from authentication)
     * @param {Response} res - Express response object
     * @returns {Object} 200 - Volunteer profile data
     * @returns {Object} 404 - Volunteer not found
     * @returns {Object} 500 - Server error
     */
    static async getProfile(req, res) {
        try {
        const volunteer = await UserService.findById(req.user.id);
        if (!volunteer) return res.status(404).json({ error: 'Not found' });
        res.json(volunteer);
        } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Update volunteer profile
     * @route PUT /api/volunteer/profile
     * @access Private (Volunteer only)
     * @param {Request} req - Express request object
     * @param {string} req.user.id - Volunteer user ID (from authentication)
     * @param {Object} req.body - Profile updates
     * @param {Response} res - Express response object
     * @returns {Object} 200 - Updated profile data
     * @returns {Object} 500 - Server error
     */
    static async updateProfile(req, res) {
        try {
        const userData = req.body;
        const updated = await UserService.update(req.user.id, { userData });
        res.json({ message: 'Profile updated', updated });
        } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Get pending help requests near volunteer's location
     * @route GET /api/volunteer/requests/pending
     * @access Private (Volunteer only)
     * @param {Request} req - Express request object
     * @param {string} req.user.id - Volunteer user ID (from authentication)
     * @param {Object} req.query - Query parameters
     * @param {number} req.query.latitude - Volunteer latitude (required)
     * @param {number} req.query.longitude - Volunteer longitude (required)
     * @param {number} [req.query.limit] - Maximum results to return
     * @param {number} [req.query.offset] - Number of results to skip
     * @param {Response} res - Express response object
     * @returns {Object} 200 - Array of pending help requests
     * @returns {Object} 400 - Missing location parameters
     * @returns {Object} 500 - Server error
     */
    static async getPendingRequest(req, res) {
        try{
            const { latitude, longitude, limit, offset } = req.query;
            if (!latitude || !longitude) {
                return res.status(400).json({ message: 'Location required' });
            }
            
            const pendingRequests = await VolunteerServices.getPendingRequests(latitude, longitude,limit,offset);

            return res.status(200).json({
                message: 'Pending help requests fetched successfully',
                data: pendingRequests
            });
        }catch(err){
            console.error('Error getting pending help requests,',err.message);
            res.status(500).json({error:"Failed to get pending help requests"});
        }
    }

    /**
     * Get filtered help requests based on urgency and distance
     * @route GET /api/volunteer/requests/filtered
     * @access Private (Volunteer only)
     * @param {Request} req - Express request object
     * @param {string} req.user.id - Volunteer user ID (from authentication)
     * @param {Object} req.query - Query parameters
     * @param {number} req.query.latitude - Volunteer latitude (required)
     * @param {number} req.query.longitude - Volunteer longitude (required)
     * @param {string} [req.query.priority] - Filter by urgency/priority
     * @param {number} [req.query.distance] - Maximum distance in meters
     * @param {number} [req.query.limit] - Maximum results to return
     * @param {number} [req.query.offset] - Number of results to skip
     * @param {Response} res - Express response object
     * @returns {Object} 200 - Array of filtered help requests
     * @returns {Object} 500 - Server error
     */
    static async getFilteredRequests(req,res) {
        try{
            const filters = {
                urgency : req.query.priority,
                distance : req.query.distance
            };

            // Extract latitude, longitude, limit, and offset from the query parameters
            const { latitude, longitude, limit, offset } = req.query;
            
            const filteredPosts = await VolunteerServices.getFilteredRequests(latitude, longitude,filters,limit,offset);

            return res.status(200).json({
                message: 'Pending help requests fetched successfully',
                data: filteredPosts
            });
        }catch (err) {
            console.error('Filter requests error:', err.message);
            res.status(500).json({ 
            success: false, 
            error: 'Failed to filter requests',
            details: err.message 
            });
        }
    }

    /**
     * Cancel an accepted help request
     * @route POST /api/volunteer/requests/cancel
     * @access Private (Volunteer only)
     * @param {Request} req - Express request object
     * @param {string} req.user.id - Volunteer user ID (from authentication)
     * @param {string} req.user.username - Volunteer username (from authentication)
     * @param {Object} req.body - Request cancellation data
     * @param {Object} req.body.params - Parameters object
     * @param {string} req.body.params.requestId - Help request ID to cancel
     * @param {string} req.body.params.elderlyId - Elderly user ID for notifications
     * @param {Response} res - Express response object
     * @returns {Object} 200 - Request cancelled successfully
     * @returns {Object} 500 - Server error
     */
    static async cancelRequest(req,res) {
        try{
            const {requestId, elderlyId} = req.body.params;
            const volunteerId = req.user.id;
            const volunteerName = req.user.username;
            const cancelledRequest = await VolunteerServices.cancelRequest(requestId,volunteerId);
            //console.log("Cancelled Request are:",cancelledRequest);
            
            // Get elderly name for volunteer notification
            const { data: elderlyProfile } = await supabase
                .from('user_profiles')
                .select('username, full_name')
                .eq('user_id', elderlyId)
                .single();
            
            const elderlyName = elderlyProfile?.full_name || elderlyProfile?.username || 'Elderly user';

            // Send notification to elderly (kept from original implementation)
            const message = `${volunteerName} has cancelled your help request!`;
            await supabase.from("notifications").insert([
                {
                elderly_id: elderlyId,
                volunteer_id: volunteerId,
                message,
                },
            ]);
            const elderlySocketId = getReceiverSocketId(elderlyId);
            console.log("Elderly socket is:", elderlySocketId);


            // Notify the elderly about the cancellation
            try {
                await NotificationService.notifyHelpRequestCancelled(
                    elderlyId,
                    volunteerId,
                    volunteerName
                );
            } catch (notifError) {
                console.error('Error sending volunteer cancel notification:', notifError);
            }

            return res.status(200).json({
                success: true,
                message: 'Cancelled request successfully',
                data: cancelledRequest
            });
        }
        catch (err) {
            console.error('Cancelling requests error:', err.message);
            res.status(500).json({ 
            success: false, 
            error: 'Failed to cancel requests',
            details: err.message 
            });
        }
    }
    /**
     * Accept a help request
     * Assigns volunteer to the request and notifies elderly user and linked caregivers
     * @route POST /api/volunteer/requests/accept
     * @access Private (Volunteer only)
     * @param {Request} req - Express request object
     * @param {string} req.user.id - Volunteer user ID (from authentication)
     * @param {string} req.user.username - Volunteer username (from authentication)
     * @param {Object} req.body - Request acceptance data
     * @param {Object} req.body.params - Parameters object
     * @param {string} req.body.params.requestId - Help request ID to accept
     * @param {string} req.body.params.elderlyId - Elderly user ID
     * @param {Response} res - Express response object
     * @returns {Object} 200 - Request accepted successfully
     * @returns {Object} 500 - Server error
     */
    static async acceptRequest(req,res) {
        try{
            const {requestId, elderlyId} = req.body.params;
            const volunteerId = req.user.id;
            console.log("user info is:",req.user);
            const volunteerName = req.user.username;
            const acceptRequest = await VolunteerServices.acceptRequest(requestId,volunteerId);
            //console.log("Accepted Request are:",acceptRequest);

            // Send notification using the notification service
            try {
                await NotificationService.notifyHelpRequestMatched(elderlyId, volunteerId, volunteerName);
                
                // Also notify caregivers linked to this elderly user
                const { data: elderlyProfile } = await supabase
                    .from('user_profiles')
                    .select('username, full_name')
                    .eq('user_id', elderlyId)
                    .single();
                
                const elderlyName = elderlyProfile?.full_name || elderlyProfile?.username || 'Elderly user';

                // Get all linked caregivers
                const { data: caregiverLinks } = await supabase
                    .from('caregiver_link')
                    .select('caregiver_user_id')
                    .eq('elderly_user_id', elderlyId);

                // Notify each caregiver
                if (caregiverLinks && caregiverLinks.length > 0) {
                    for (const link of caregiverLinks) {
                        await NotificationService.notifyCaregiverHelpRequestMatched(
                            link.caregiver_user_id,
                            elderlyName,
                            volunteerName,
                            requestId
                        );
                    }
                }

                // Notify the volunteer about being assigned
                await NotificationService.notifyVolunteerRequestAssigned(
                    volunteerId,
                    elderlyName,
                    requestId
                );
            } catch (notifError) {
                console.error('Error sending help request matched notification:', notifError);
                // Don't fail the accept if notification fails
            }

            return res.status(200).json({
                success: true,
                message: 'Accepted request successfully',
                data: acceptRequest
            });
        }
        catch (err) {
            console.error('Accepting requests error:', err.message);
            res.status(500).json({ 
            success: false, 
            error: 'Failed to accept requests',
            details: err.message 
            });
        }
    }

    /**
     * Get accepted help request for volunteer
     * Returns the currently assigned request if any
     * @route GET /api/volunteer/requests/accepted
     * @access Private (Volunteer only)
     * @param {Request} req - Express request object
     * @param {string} req.user.id - Volunteer user ID (from authentication)
     * @param {Object} req.query - Query parameters
     * @param {number} req.query.latitude - Volunteer latitude (required)
     * @param {number} req.query.longitude - Volunteer longitude (required)
     * @param {Response} res - Express response object
     * @returns {Object} 200 - Accepted request data or null if none
     * @returns {Object} 500 - Server error
     */
    static async getAcceptedRequest(req,res) {
        try{
            const volunteerId = req.user.id;
            const { latitude, longitude } = req.query;
            const acceptedRequest = await VolunteerServices.getAcceptedRequest(latitude,longitude,volunteerId);

            if (acceptedRequest === null) {
                return res.status(200).json({
                    success: true,
                    message: 'No accepted requests found.',
                    data: null
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Get accepted request successfully',
                data: acceptedRequest
            });
        }catch (err) {
            console.error('Failed to get Accepted requests:', err.message);
            res.status(500).json({ 
            success: false, 
            error: 'Failed to get accepted requests',
            details: err.message 
            });
        }
    }

    /**
     * Mark help request as completed
     * Updates request status and sends completion notifications
     * @route POST /api/volunteer/requests/complete
     * @access Private (Volunteer only)
     * @param {Request} req - Express request object
     * @param {string} req.user.id - Volunteer user ID (from authentication)
     * @param {Object} req.body - Request completion data
     * @param {Object} req.body.params - Parameters object
     * @param {string} req.body.params.requestId - Help request ID to complete
     * @param {string} req.body.params.elderlyId - Elderly user ID
     * @param {Response} res - Express response object
     * @returns {Object} 200 - Request completed successfully
     * @returns {Object} 500 - Server error
     */
    static async completeRequest(req,res) {
        try{
            const {requestId, elderlyId} = req.body.params;
            const volunteerId = req.user.id;
            const completedRequest = await VolunteerServices.completeRequest(requestId, volunteerId, elderlyId);

            return res.status(200).json({
                success: true,
                message: 'Completed request successfully',
                data: completedRequest
            });
        } catch (err) {
            console.error('Completing requests error:', err.message);
            res.status(500).json({ 
            success: false, 
            error: 'Failed to complete requests',
            details: err.message 
            });
        }
    }

    /**
     * Send progress update to caregivers
     * Notifies linked caregivers about volunteer's progress with elderly user
     * @route POST /api/volunteer/progress
     * @access Private (Volunteer only)
     * @param {Request} req - Express request object
     * @param {string} req.user.id - Volunteer user ID (from authentication)
     * @param {Object} req.body - Progress update data
     * @param {string} req.body.elderlyId - Elderly user ID
     * @param {string} req.body.location - Current location description
     * @param {string} [req.body.estimatedArrival] - Estimated arrival time
     * @param {Response} res - Express response object
     * @returns {Object} 200 - Progress update sent successfully
     * @returns {Object} 400 - Missing elderlyId or location
     * @returns {Object} 500 - Server error
     */
    static async sendProgressUpdate(req,res) {
        try{
            const {elderlyId, location, estimatedArrival} = req.body;
            const volunteerId = req.user.id;

            if (!elderlyId || !location) {
                return res.status(400).json({
                    success: false,
                    error: 'elderlyId and location are required'
                });
            }

            // Get elderly user info
            const { data: elderlyProfile } = await supabase
                .from('user_profiles')
                .select('username, full_name')
                .eq('user_id', elderlyId)
                .single();
            
            const elderlyName = elderlyProfile?.full_name || elderlyProfile?.username || 'Elderly user';

            // Get all linked caregivers
            const { data: caregiverLinks } = await supabase
                .from('caregiver_link')
                .select('caregiver_user_id')
                .eq('elderly_user_id', elderlyId);

            // Send progress update to each caregiver
            if (caregiverLinks && caregiverLinks.length > 0) {
                for (const link of caregiverLinks) {
                    await NotificationService.notifyCaregiverProgressUpdate(
                        link.caregiver_user_id,
                        elderlyName,
                        location,
                        estimatedArrival
                    );
                }
            }

            return res.status(200).json({
                success: true,
                message: 'Progress update sent to caregivers',
                notifiedCaregivers: caregiverLinks?.length || 0
            });
        } catch (err) {
            console.error('Sending progress update error:', err.message);
            res.status(500).json({ 
            success: false, 
            error: 'Failed to send progress update',
            details: err.message 
            });
        }
    }
}


module.exports = VolunteerController;
