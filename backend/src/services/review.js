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
    // First get all reviews by this user
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .eq('author_user_id', userId)
      .order('created_at', { ascending: false });
    
    if (reviewsError) throw reviewsError;
    
    if (!reviews || reviews.length === 0) {
      return [];
    }

    // Get recipient user IDs
    const recipientIds = [...new Set(reviews.map(r => r.recipient_user_id))];
    
    // Get recipient profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, username, full_name')
      .in('user_id', recipientIds);
    
    if (profilesError) {
      console.warn('Error fetching recipient profiles:', profilesError);
    }
    
    // Create a map for quick lookup
    const profileMap = {};
    if (profiles) {
      profiles.forEach(profile => {
        profileMap[profile.user_id] = profile;
      });
    }
    
    // Enhance reviews with recipient data
    const enhancedReviews = reviews.map(review => ({
      ...review,
      reviews_recipient_user_id_fkey1: profileMap[review.recipient_user_id] || {
        username: 'Unknown User'
      }
    }));
    
    return enhancedReviews;
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
    
    // First get all reviews
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (reviewsError) {
      console.error('getAllReviewsForAdmin reviews error:', reviewsError);
      throw reviewsError;
    }

    if (!reviews || reviews.length === 0) {
      console.log('getAllReviewsForAdmin: No reviews found');
      return [];
    }

    // Get all unique user IDs from reviews
    const userIds = [...new Set([
      ...reviews.map(r => r.author_user_id),
      ...reviews.map(r => r.recipient_user_id)
    ])];

    console.log(`getAllReviewsForAdmin: Found ${userIds.length} unique users to fetch`);

    // Get user auth data and profiles
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) {
      console.error('Error fetching auth users:', authError);
      throw authError;
    }

    const { data: profilesData, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .in('user_id', userIds);

    if (profilesError) {
      console.warn('Error fetching user profiles:', profilesError);
    }

    // Create user lookup map
    const userMap = {};
    authData.users.forEach(user => {
      const profile = profilesData?.find(p => p.user_id === user.id);
      userMap[user.id] = {
        id: user.id,
        email: user.email,
        name: profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.displayName || user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown User',
        full_name: profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.displayName || user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown User',
        role: profile?.role || user.user_metadata?.role || 'elderly'
      };
    });

    // Enhance reviews with user data
    const enhancedReviews = reviews.map(review => ({
      ...review,
      author: userMap[review.author_user_id] || {
        id: review.author_user_id,
        name: 'Unknown User',
        full_name: 'Unknown User',
        role: 'elderly'
      },
      recipient: userMap[review.recipient_user_id] || {
        id: review.recipient_user_id,
        name: 'Unknown User', 
        full_name: 'Unknown User',
        role: 'elderly'
      }
    }));
    
    console.log(`getAllReviewsForAdmin: Returning ${enhancedReviews.length} enhanced reviews`);
    return enhancedReviews;
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

