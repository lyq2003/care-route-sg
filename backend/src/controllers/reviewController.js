const ReviewService = require('../services/review');
const adminService = require('../services/admin');
const { supabaseAdmin } = require('../config/supabase');

class ReviewController {
  submitReview = async (req, res) => {
    try {
      const authorUserId = req.user.id;
      const { recipientUserId, helpRequestId, rating, text } = req.body;
      if (!recipientUserId || !helpRequestId || !rating) {
        return res.status(400).json({ error: 'recipientUserId, helpRequestId, rating are required' });
      }
      const review = await ReviewService.submitReview({ authorUserId, recipientUserId, helpRequestId, rating, text });
      return res.status(201).json({ success: true, data: review });
    } catch (error) {
      console.error('submitReview error:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  editReview = async (req, res) => {
    try {
      const authorUserId = req.user.id;
      const { reviewId } = req.params;
      const { rating, text } = req.body;
      const review = await ReviewService.editReview({ reviewId, authorUserId, rating, text });
      return res.status(200).json({ success: true, data: review });
    } catch (error) {
      console.error('editReview error:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  viewMyReviews = async (req, res) => {
    try {
      const userId = req.user.id;
      const reviews = await ReviewService.viewMyReviews(userId);
      return res.status(200).json({ success: true, data: reviews });
    } catch (error) {
      console.error('viewMyReviews error:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  viewReviewsAboutMe = async (req, res) => {
    try {
      const userId = req.user.id;
      const reviews = await ReviewService.viewReviewsAboutMe(userId);
      return res.status(200).json({ success: true, data: reviews });
    } catch (error) {
      console.error('viewReviewsAboutMe error:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  getAllReviews = async (req, res) => {
    try {
      // Use the admin service method to get all reviews with full user details
      const reviews = await ReviewService.getAllReviewsForAdmin();

      // Apply flagged filter if provided
      const { flagged } = req.query;
      let filteredReviews = reviews;
      
      if (flagged === 'true') {
        filteredReviews = reviews.filter(review => review.flagged === true);
      }

      res.status(200).json({
        success: true,
        data: {
          reviews: filteredReviews,
          pagination: {
            total: filteredReviews.length,
            page: 1,
            totalPages: 1,
            limit: filteredReviews.length
          }
        }
      });
    } catch (error) {
      console.error('Get all reviews error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  // Remove inappropriate review
  removeReview = async (req, res) => {
    try {
      const { reviewId } = req.params;
      const { reason } = req.body;
      const adminUserId = req.user.id;

      if (!reviewId) {
        return res.status(400).json({
          success: false,
          error: 'Review ID is required'
        });
      }

      // Delete the review
      const { data, error } = await supabaseAdmin
        .from('reviews')
        .delete()
        .eq('id', reviewId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to remove review: ${error.message}`);
      }

      // Log admin action
      await adminService.logAdminAction(adminUserId, 'REMOVE_REVIEW', reviewId, { 
        reason: reason || 'Review removed for policy violation' 
      });

      res.status(200).json({
        success: true,
        message: 'Review removed successfully',
        data: data
      });
    } catch (error) {
      console.error('Remove review error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };
}

module.exports = new ReviewController();

