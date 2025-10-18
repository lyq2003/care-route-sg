const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const ReviewController = require('../controllers/reviewController');

router.post('/', requireAuth, ReviewController.submitReview);
router.put('/:reviewId', requireAuth, ReviewController.editReview);
router.get('/me', requireAuth, ReviewController.viewMyReviews);
router.get('/about-me', requireAuth, ReviewController.viewReviewsAboutMe);

module.exports = router;

