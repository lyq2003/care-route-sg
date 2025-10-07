const { supabaseAdmin } = require('../config/supabase');

// Using supabaseAdmin to bypass RLS (Row Level Security)



class HelpRequest {

  static async createRequest(requesterId, longitude, latitude, urgency, image) {
    /* try {


      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          provider,
          provider_id: providerId,
          name,
          avatar: avatar,
          full_name: name
        }
      });

      if (error) {
        throw error;
      }

      return data.user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    } */


    const { data, error } = await supabaseAdmin
      .from("help_request")
      .insert({ requesterId: requesterId, longitude: longitude, latitude: latitude, urgency: urgency, image: image, helpRequestStatus: 1 })
      .select();

    if (error) {
      throw error
    } else {
      return data
    }

  }


}



module.exports = HelpRequest;