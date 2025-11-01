const ReviewService = require('../services/review');

/**
 * Review Controller
 * Handles HTTP requests for review operations
 * Provides endpoints for submitting, editing, and viewing reviews
 * 
 * @class ReviewController
 * @example
 * const reviewController = new ReviewController();
 * // Used in routes: router.post('/reviews', reviewController.submitReview);
 */
class ReviewController {
  /**
   * Submit a new review
   * @route POST /api/reviews
   * @access Private
   * @param {Request} req - Express request object
   * @param {string} req.user.id - Author user ID (from authentication)
   * @param {Object} req.body - Review data
   * @param {string} req.body.recipientUserId - ID of user being reviewed
   * @param {string} req.body.helpRequestId - ID of completed help request
   * @param {number} req.body.rating - Rating value (1-5)
   * @param {string} [req.body.text] - Optional review text
   * @param {Response} res - Express response object
   * @returns {Object} 201 - Created review
   * @returns {Object} 400 - Missing required fields
   * @returns {Object} 500 - Server error
   */
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

  /**
   * Edit an existing review
   * @route PUT /api/reviews/:reviewId
   * @access Private (Review author only)
   * @param {Request} req - Express request object
   * @param {string} req.user.id - Author user ID (from authentication)
   * @param {string} req.params.reviewId - Review ID to edit
   * @param {Object} req.body - Updated review data
   * @param {number} [req.body.rating] - Updated rating value
   * @param {string} [req.body.text] - Updated review text
   * @param {Response} res - Express response object
   * @returns {Object} 200 - Updated review
   * @returns {Object} 403 - Not authorized (not the review author)
   * @returns {Object} 500 - Server error
   */
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

  /**
   * View reviews written by the authenticated user
   * @route GET /api/reviews/my-reviews
   * @access Private
   * @param {Request} req - Express request object
   * @param {string} req.user.id - Author user ID (from authentication)
   * @param {Response} res - Express response object
   * @returns {Object} 200 - Array of reviews written by user
   * @returns {Object} 500 - Server error
   */
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

  /**
   * View reviews about the authenticated user
   * @route GET /api/reviews/about-me
   * @access Private
   * @param {Request} req - Express request object
   * @param {string} req.user.id - User ID (from authentication)
   * @param {Response} res - Express response object
   * @returns {Object} 200 - Array of reviews about the user
   * @returns {Object} 500 - Server error
   */
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
}

module.exports = new ReviewController();

