const { supabase, supabaseAdmin } = require('../config/supabase');

class ReviewService {
  async submitReview({ authorUserId, recipientUserId, helpRequestId, rating, text }) {
    const { data: review, error: reviewError } = await supabase
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

    if (reviewError) throw reviewError;

    // Fetch the current ratings and review_count for the recipient
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('rating, review_count')
      .eq('user_id', recipientUserId)
      .single();

    if (profileError) throw profileError;

    const currentRating = profile?.ratings;
    const currentCount = profile?.review_count;

    let newRating;
    let newCount;

    // Handle the edge case when no rating exists yet
    if (currentRating == null || currentCount == null) {
      newRating = rating;
      newCount = 1;
    } else {
      newCount = currentCount + 1;
      newRating = (currentRating * currentCount + rating) / newCount;
    }

    // Update the user's profile with new rating and count
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        rating: newRating,
        review_count: newCount,
      })
      .eq('user_id', recipientUserId);

    if (updateError) throw updateError;

    return review;
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
      .select('*, reviews_recipient_user_id_fkey1 (username)')
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
    
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        author:user_profiles!author_user_id(*),
        recipient:user_profiles!recipient_user_id(*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('getAllReviewsForAdmin error:', error);
      throw error;
    }
    
    console.log(`getAllReviewsForAdmin: Found ${data?.length || 0} reviews`);
    return data || []; // Ensure we return an empty array if data is null
  }

  // Remove review (admin action)
  async removeReview({ reviewId, adminUserId }) {
    const { data, error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)
      .select('*')
      .single();
    
    if (error) throw error;
    return data;
  }
}

module.exports = new ReviewService();

