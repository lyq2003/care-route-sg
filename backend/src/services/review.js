const { supabase, supabaseAdmin } = require('../config/supabase');

/**
 * Review Service
 * Handles review submission, retrieval, and rating calculations
 * Manages volunteer ratings based on reviews from elderly users
 * 
 * @class ReviewService
 * @example
 * const reviewService = new ReviewService();
 * await reviewService.submitReview({
 *   authorUserId: 'elderly-123',
 *   recipientUserId: 'volunteer-456',
 *   helpRequestId: 'request-789',
 *   rating: 5,
 *   text: 'Great help, very patient!'
 * });
 */
class ReviewService {
  /**
   * Submits a review from an elderly user for a volunteer
   * Updates the volunteer's average rating and review count
   * 
   * @param {Object} reviewData - Review data object
   * @param {string} reviewData.authorUserId - ID of the user writing the review (elderly)
   * @param {string} reviewData.recipientUserId - ID of the user being reviewed (volunteer)
   * @param {string} reviewData.helpRequestId - ID of the completed help request
   * @param {number} reviewData.rating - Rating value (typically 1-5)
   * @param {string} [reviewData.text] - Optional review text/comment
   * @returns {Promise<Object>} Created review object
   * @throws {Error} If review submission or profile update fails
   * 
   * @example
   * const review = await reviewService.submitReview({
   *   authorUserId: 'elderly-123',
   *   recipientUserId: 'volunteer-456',
   *   helpRequestId: 'request-789',
   *   rating: 5,
   *   text: 'Excellent service!'
   * });
   */
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

  /**
   * Edit an existing review
   * Only the author can edit their review
   * @param {Object} editData - Review edit data
   * @param {string} editData.reviewId - Review ID to edit
   * @param {string} editData.authorUserId - ID of review author (must match existing review)
   * @param {number} [editData.rating] - Updated rating value
   * @param {string} [editData.text] - Updated review text
   * @returns {Promise<Object>} Updated review object
   * @throws {Error} If review not found, unauthorized, or update fails
   */
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

  /**
   * Get all reviews written by a user
   * @param {string} userId - ID of the user (review author)
   * @returns {Promise<Array>} Array of review objects authored by the user
   * @throws {Error} If database query fails
   */
  async viewMyReviews(userId) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('author_user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  /**
   * Get all reviews about a user
   * @param {string} userId - ID of the user being reviewed
   * @returns {Promise<Array>} Array of review objects about the user
   * @throws {Error} If database query fails
   */
  async viewReviewsAboutMe(userId) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('recipient_user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  /**
   * Get all reviews with full user details for admin moderation
   * @returns {Promise<Array>} Array of review objects with author and recipient profiles
   * @throws {Error} If database query fails
   */
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

  /**
   * Flag a review for moderation
   * @param {Object} flagData - Flag data
   * @param {string} flagData.reviewId - Review ID to flag
   * @param {string} [flagData.reason='offensive language'] - Reason for flagging
   * @param {string} [flagData.flaggedBy='SYSTEM'] - Who flagged the review
   * @returns {Promise<Object>} Flagged review object
   * @throws {Error} If review not found or update fails
   */
  async flagReview({ reviewId, reason = 'offensive language', flaggedBy = 'SYSTEM' }) {
    const { data, error } = await supabase
      .from('reviews')
      .update({ 
        flagged: true,
        flag_reason: reason,
        flagged_at: new Date().toISOString(),
        flagged_by: flaggedBy
      })
      .eq('id', reviewId)
      .select('*')
      .single();
    
    if (error) throw error;

    // Notify admins about flagged review
    try {
      const NotificationService = require('./notificationService');
      await NotificationService.notifyAdminReviewFlagged(reviewId, reason);
    } catch (notifError) {
      console.error('Error sending admin review flagged notification:', notifError);
      // Don't fail the flag operation if notification fails
    }

    return data;
  }

  /**
   * Remove a review (admin action)
   * @param {Object} removeData - Removal data
   * @param {string} removeData.reviewId - Review ID to remove
   * @param {string} removeData.adminUserId - Admin user ID performing removal
   * @returns {Promise<Object>} Removed review object
   * @throws {Error} If review not found or deletion fails
   */
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

