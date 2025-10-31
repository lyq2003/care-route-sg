
const { supabase, supabaseAdmin } = require('../config/supabase');


class UserAccessibilityNeedsService {


    static async createUserAccessibilityNeeds(userID) {
        const { data, error } = await supabaseAdmin
            .from('user_accessibility_needs')
            .insert([
                {
                    user_id: userID
                },
            ])
            .select('*')

        if (error) {
            throw error
        } else {
            return data
        }
    }


    static async getUserNeeds(userID) {

        const { data, error } = await supabase
            .from('user_accessibility_needs')
            .select('*')
            .eq('user_id', userID)

        

        if (error) throw error;
        return data;
    }

}


module.exports = UserAccessibilityNeedsService;