const { supabase } = require('../config/supabase');
const UserService = require('../services/user');
const VolunteerServices = require('../services/volunteerServices');
const { getReceiverSocketId, io } = require('../middleware/socket.js');
const NotificationService = require('../services/notificationService');
const ProfileService = require('../services/profiles');
const ReviewService = require('../services/review');


class VolunteerController {
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

    static async getPendingRequest(req, res) {
        try {
            const { latitude, longitude, limit, offset } = req.query;
            if (!latitude || !longitude) {
                return res.status(400).json({ message: 'Location required' });
            }

            const pendingRequests = await VolunteerServices.getPendingRequests(latitude, longitude, limit, offset);

            return res.status(200).json({
                message: 'Pending help requests fetched successfully',
                data: pendingRequests
            });
        } catch (err) {
            console.error('Error getting pending help requests,', err.message);
            res.status(500).json({ error: "Failed to get pending help requests" });
        }
    }

    static async getFilteredRequests(req, res) {
        try {
            const filters = {
                urgency: req.query.priority,
                distance: req.query.distance
            };

            // Extract latitude, longitude, limit, and offset from the query parameters
            const { latitude, longitude, limit, offset } = req.query;

            const filteredPosts = await VolunteerServices.getFilteredRequests(latitude, longitude, filters, limit, offset);

            return res.status(200).json({
                message: 'Pending help requests fetched successfully',
                data: filteredPosts
            });
        } catch (err) {
            console.error('Filter requests error:', err.message);
            res.status(500).json({
                success: false,
                error: 'Failed to filter requests',
                details: err.message
            });
        }
    }

    static async cancelRequest(req, res) {
        try {
            const { requestId, elderlyId } = req.body.params;
            const volunteerId = req.user.id;
            const volunteerName = req.user.username;
            const cancelledRequest = await VolunteerServices.cancelRequest(requestId, volunteerId);
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
    static async acceptRequest(req, res) {
        try {
            const { requestId, elderlyId } = req.body.params;
            const volunteerId = req.user.id;
            console.log("user info is:", req.user);
            const volunteerName = req.user.username;
            const acceptRequest = await VolunteerServices.acceptRequest(requestId, volunteerId);
            //console.log("Accepted Request are:",acceptRequest);

            const helpRequestId = acceptRequest.id;

            // Get volunteer phone number
            const volunteerData = await ProfileService.getprofile(acceptRequest.assignedVolunteerId);

            const volunteerPhoneNumber = volunteerData[0].phone_number;

            // Get volunteer rating
            const volunteerReviews = await ReviewService.viewReviewsAboutMe(acceptRequest.assignedVolunteerId);


            var averageRating = 0;
            if (volunteerReviews.length > 0) {
                var ratingSum = 0;

                for (let i = 0; i < volunteerReviews.length; i++) {
                    ratingSum += volunteerReviews[i].rating;
                }

                averageRating = ratingSum / volunteerReviews.length;
            }



            // Send notification using the notification service
            try {
                await NotificationService.notifyHelpRequestMatched(elderlyId, volunteerId, volunteerName, volunteerPhoneNumber, averageRating, helpRequestId);

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

    static async getAcceptedRequest(req, res) {
        try {
            const volunteerId = req.user.id;
            const { latitude, longitude } = req.query;
            const acceptedRequest = await VolunteerServices.getAcceptedRequest(latitude, longitude, volunteerId);

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
        } catch (err) {
            console.error('Failed to get Accepted requests:', err.message);
            res.status(500).json({
                success: false,
                error: 'Failed to get accepted requests',
                details: err.message
            });
        }
    }

    static async getCompletedRequest(req, res) {
        try {
            const volunteerId = req.user.id;
            const acceptedRequest = await VolunteerServices.getCompletedRequest(volunteerId);

            if (acceptedRequest === null) {
                return res.status(200).json({
                    success: true,
                    message: 'No completed requests found.',
                    data: null
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Get completed request successfully',
                data: acceptedRequest
            });
        } catch (err) {
            console.error('Failed to get completed requests:', err.message);
            res.status(500).json({
                success: false,
                error: 'Failed to get completed requests',
                details: err.message
            });
        }
    }
    static async completeRequest(req, res) {
        try {
            const { requestId, elderlyId } = req.body.params;
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

    static async sendProgressUpdate(req, res) {
        try {
            const { elderlyId, location, estimatedArrival } = req.body;
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
