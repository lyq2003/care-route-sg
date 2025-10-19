const { supabase, supabaseAdmin } = require('../config/supabase');

class ReviewService {
  async submitReview({ authorUserId, recipientUserId, helpRequestId, rating, text }) {
    const { data, error } = await supabase
      .from('reviews')
      .insert([
        {
          author_user_id: authorUserId,
          recipient_user_id: recipientUserId,
          help_request_id: helpRequestId,
          rating,
          text: text || null,
          edited: false,
        },
      ])
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  async editReview({ reviewId, authorUserId, rating, text }) {
    // Only author can edit
    const { data: existing, error: fetchErr } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', reviewId)
      .single();
    if (fetchErr) throw fetchErr;
    if (existing.author_user_id !== authorUserId) {
      const e = new Error('Forbidden');
      e.statusCode = 403;
      throw e;
    }

    const { data, error } = await supabase
      .from('reviews')
      .update({ rating, text, edited: true })
      .eq('id', reviewId)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  async viewMyReviews(userId) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('author_user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async viewReviewsAboutMe(userId) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('recipient_user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  // Admin-specific method to get all reviews with full user details
  async getAllReviewsForAdmin() {
    console.log('getAllReviewsForAdmin: Fetching all reviews for admin...');
    
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select(`
        *,
        author:auth.users!author_user_id(*),
        recipient:auth.users!recipient_user_id(*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('getAllReviewsForAdmin error:', error);
      throw error;
    }
    
    console.log(`getAllReviewsForAdmin: Found ${data?.length || 0} reviews`);
    return data || []; // Ensure we return an empty array if data is null
  }
}

module.exports = new ReviewService();

