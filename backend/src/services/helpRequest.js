const { supabaseAdmin, supabase } = require('../config/supabase');

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
      return data
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