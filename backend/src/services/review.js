const { supabase } = require('../config/supabase');

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
}

module.exports = new ReviewService();

