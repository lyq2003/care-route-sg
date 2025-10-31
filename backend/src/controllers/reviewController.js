const ReviewService = require('../services/review');

class ReviewController {
  submitReview = async (req, res) => {
    try {
      const authorUserId = req.user.id;
      const { recipientUserId, helpRequestId, rating, text } = req.body;

      console.log("Submit review items are:",recipientUserId, helpRequestId, rating, text, req.params);
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
}

module.exports = new ReviewController();

