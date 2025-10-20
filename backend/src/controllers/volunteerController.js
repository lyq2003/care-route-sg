const { supabase } = require('../config/supabase');
const UserService = require('../services/user');
const VolunteerServices = require('../services/volunteerServices');
const {getReceiverSocketId, io} = require('../middleware/socket.js')

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

    static async cancelRequest(req,res) {
        try{
            const {requestId, elderlyId} = req.body.params;
            const volunteerId = req.user.id;
            const volunteerName = req.user.username;
            const cancelledRequest = await VolunteerServices.cancelRequest(requestId,volunteerId);
            //console.log("Cancelled Request are:",cancelledRequest);
            
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
            if (elderlySocketId) {
                io.to(elderlySocketId).emit("notify", { message });
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
    static async acceptRequest(req,res) {
        try{
            const {requestId, elderlyId} = req.body.params;
            const volunteerId = req.user.id;
            console.log("user info is:",req.user);
            const volunteerName = req.user.username;
            const acceptRequest = await VolunteerServices.acceptRequest(requestId,volunteerId);
            //console.log("Accepted Request are:",acceptRequest);

            const message = `${volunteerName} has accepted your help request!`;
            
            await supabase.from("notifications").insert([
                {
                elderly_id: elderlyId,
                volunteer_id: volunteerId,
                message,
                },
            ]);
        
            const elderlySocketId = getReceiverSocketId(elderlyId);
            console.log("Elderly id is:", elderlyId);
            console.log("Elderly socket is:", elderlySocketId);
            if (elderlySocketId) {
                io.to(elderlySocketId).emit("notify", { message });
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
}


module.exports = VolunteerController;
