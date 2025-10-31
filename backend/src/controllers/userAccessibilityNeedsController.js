const UserAccessibilityNeedsService = require("../services/userAccessibilityNeeds");
const { supabase, supabaseAdmin } = require('../config/supabase');



class UserAccessibilityNeedsController {

    getNeeds = async (req, res) => {
        try {
            const userId = req.user.id;
            const userNeeds = await UserAccessibilityNeedsService.getUserNeeds(userId)
            return res.status(200).json({ success: true, data: userNeeds });

        } catch (error) {
            console.error('getNeeds error:', error);
            return res.status(500).json({ error: error.message });
        }
    };



    /**
     * Update user accessibility needs for elderly user
     */
    updateAccessibilityNeed = async (req, res) => {
        try {
            const { need, currentValue } = req.body;

            if (!need) {
                return res.status(400).json({ error: 'A accessibility need is required' });
            }

            // Validate need
            const validNeeds = ['wheelchair', 'visual', 'mobility', 'cognitive', "hearing"];
            if (!validNeeds.includes(need)) {
                return res.status(400).json({ error: 'Invalid accessibility need' });
            }

            // Update
            const { data, error } = await supabase
                .from('user_accessibility_needs')
                .update({
                    [need]: !currentValue
                })
                .eq('user_id', req.user.id)
                .select()
                .single();

            if (error) {
                console.error('Error updating user accessibility need:', error);
                return res.status(500).json({ error: 'Failed to update user accessibility need' });
            }

            res.json({
                message: 'User accessibility need updated successfully',
                need: need,
                profile: data
            });
        } catch (err) {
            console.error('Update user accessibility need error:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    }



}

module.exports = new UserAccessibilityNeedsController();