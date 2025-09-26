const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const UserController = require('../controllers/UserController');
const ApiError = require('../utils/ApiError');

const router = express.Router();
const userController = new UserController();

/**
 * Validation middleware
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    throw ApiError.badRequest(`Validation failed: ${errorMessages.join(', ')}`);
  }
  next();
};

/**
 * Username validation
 */
const validateUsername = [
  param('username')
    .isLength({ min: 1, max: 30 })
    .withMessage('Username must be between 1 and 30 characters')
    .matches(/^[a-zA-Z0-9._]+$/)
    .withMessage('Username can only contain letters, numbers, dots, and underscores')
    .customSanitizer(value => value.toLowerCase().trim()),
  handleValidationErrors
];

/**
 * Search validation
 */
const validateSearch = [
  query('q')
    .isLength({ min: 2, max: 50 })
    .withMessage('Search query must be between 2 and 50 characters')
    .trim(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  handleValidationErrors
];

/**
 * Pagination validation
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
    .toInt(),
  query('sortBy')
    .optional()
    .isIn(['-instagram_data.posted_at', 'instagram_data.posted_at', '-likes', 'likes', '-comments', 'comments'])
    .withMessage('Invalid sort field'),
  handleValidationErrors
];

// Routes

/**
 * @route   GET /api/users/search
 * @desc    Search users by username or full name
 * @access  Public
 * @query   q (string, required) - Search query
 * @query   limit (number, optional) - Number of results (default: 20, max: 100)
 */
router.get('/search', validateSearch, userController.searchUsers);

/**
 * @route   GET /api/users/top
 * @desc    Get top influencers ranked by influence score
 * @access  Public
 * @query   limit (number, optional) - Number of results (default: 50, max: 100)
 */
router.get('/top', [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  handleValidationErrors
], userController.getTopInfluencers);

/**
 * @route   GET /api/user/:username
 * @desc    Get user profile data (cached or fresh from Instagram)
 * @access  Public
 * @param   username (string, required) - Instagram username
 */
router.get('/:username', validateUsername, userController.getUser);

/**
 * @route   POST /api/user/:username/refresh
 * @desc    Force refresh user data from Instagram
 * @access  Public
 * @param   username (string, required) - Instagram username
 */
router.post('/:username/refresh', validateUsername, userController.refreshUser);

/**
 * @route   GET /api/user/:username/posts
 * @desc    Get user's Instagram posts with pagination
 * @access  Public
 * @param   username (string, required) - Instagram username
 * @query   page (number, optional) - Page number (default: 1)
 * @query   limit (number, optional) - Posts per page (default: 20, max: 50)
 * @query   sortBy (string, optional) - Sort field (default: '-instagram_data.posted_at')
 */
router.get('/:username/posts', [
  ...validateUsername,
  ...validatePagination
], userController.getUserPosts);

/**
 * @route   GET /api/user/:username/analytics
 * @desc    Get user's analytics data
 * @access  Public
 * @param   username (string, required) - Instagram username
 */
router.get('/:username/analytics', validateUsername, userController.getUserAnalytics);

module.exports = router;