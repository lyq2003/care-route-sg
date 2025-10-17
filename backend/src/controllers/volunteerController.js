const UserService = require('../services/user');
const VolunteerServices = require('../services/volunteerServices');

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
            
            console.log("Pending request json format check:",pendingRequests);
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

            const filteredPosts = await VolunteerServices.getFilteredRequests(filters);

            res.json({
                success:true,
                posts:filteredPosts,
                count: filteredPosts.length 
            })
        }catch (err) {
            console.error('Filter requests error:', err.message);
            res.status(500).json({ 
            success: false, 
            error: 'Failed to filter requests',
            details: err.message 
            });
        }
    }
}


module.exports = VolunteerController;
