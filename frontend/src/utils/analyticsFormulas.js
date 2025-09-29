/**
 * Instagram Analytics Mathematical Formulas and Metrics
 *
 * This file contains all mathematical formulas, calculations, and normalization
 * techniques used for analyzing Instagram metrics and engagement data.
 */

// =============================================================================
// DATA FORMATTING UTILITIES
// =============================================================================

/**
 * Format numbers for display (K, M suffixes)
 * @param {number} num - Raw number
 * @returns {string} Formatted number string
 */
export const formatDisplayNumber = (num) => {
  if (!num && num !== 0) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

/**
 * Safe number formatting with fallback
 * @param {number} num - Raw number
 * @returns {number} Formatted number or 0
 */
export const formatNumber = (num) => {
  if (!num && num !== 0) return 0;
  return num;
};

// =============================================================================
// NORMALIZATION TECHNIQUES
// =============================================================================

/**
 * Min-Max Normalization (0-100% scale)
 *
 * Formula: ((value - min) / (max - min)) * 100
 *
 * Purpose: Scales all metrics to 0-100% range for comparison
 * - 100% = highest value in dataset
 * - 0% = lowest value in dataset
 * - Preserves relative relationships
 * - Always positive values
 *
 * @param {Array<number>} data - Array of numerical values
 * @returns {Object} Normalized data with original values
 */
export const normalizeData = (data) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1; // Prevent division by zero

  return {
    normalized: data.map(val => ((val - min) / range) * 100),
    original: data,
    max,
    min,
    range
  };
};

/**
 * Z-Score Standardization (mean=0, std=1)
 *
 * Formula: (value - mean) / standard_deviation
 *
 * Purpose: Centers data around 0 with unit variance
 * - Positive values = above average
 * - Negative values = below average
 * - Values typically range from -3 to +3
 *
 * Note: Can produce negative values, less intuitive for UI
 *
 * @param {Array<number>} data - Array of numerical values
 * @returns {Object} Standardized data with statistics
 */
export const standardizeData = (data) => {
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
  const stdDev = Math.sqrt(variance) || 1;

  return {
    standardized: data.map(val => ((val - mean) / stdDev)),
    original: data,
    mean,
    stdDev,
    variance
  };
};

// =============================================================================
// ENGAGEMENT METRICS CALCULATIONS
// =============================================================================

/**
 * Engagement Rate Calculation
 *
 * Formula: ((likes + comments) / views) * 100
 * Alternative: ((likes + comments) / followers) * 100
 *
 * Purpose: Measures audience interaction relative to reach
 * - Higher percentage = more engaging content
 * - Industry average: 1-3% is good, 3%+ is excellent
 *
 * @param {number} likes - Number of likes
 * @param {number} comments - Number of comments
 * @param {number} views - Number of views (or followers as fallback)
 * @returns {number} Engagement rate as percentage
 */
export const calculateEngagementRate = (likes, comments, views) => {
  const totalEngagement = formatNumber(likes) + formatNumber(comments);
  const reach = formatNumber(views) || formatNumber(likes); // Fallback to likes if no views

  if (reach === 0) return 0;
  return ((totalEngagement / reach) * 100);
};

/**
 * Average Metrics Calculation
 *
 * Formula: sum(values) / count(values)
 *
 * @param {Array<Object>} content - Array of posts/reels
 * @param {string} metric - Metric name (likes, comments, views)
 * @returns {number} Average value for the metric
 */
export const calculateAverageMetric = (content, metric) => {
  if (!content || content.length === 0) return 0;

  const total = content.reduce((sum, item) => sum + formatNumber(item[metric]), 0);
  return Math.round(total / content.length);
};

/**
 * Best Performing Content Type Analysis
 *
 * Compares average likes between Posts and Reels
 *
 * @param {Array<Object>} posts - Array of posts
 * @param {Array<Object>} reels - Array of reels
 * @returns {string} 'Posts' or 'Reels'
 */
export const getBestPerformingContentType = (posts, reels) => {
  const postsAvgLikes = posts?.length > 0
    ? posts.reduce((sum, p) => sum + formatNumber(p.likes), 0) / posts.length
    : 0;

  const reelsAvgLikes = reels?.length > 0
    ? reels.reduce((sum, r) => sum + formatNumber(r.likes), 0) / reels.length
    : 0;

  return reelsAvgLikes > postsAvgLikes ? 'Reels' : 'Posts';
};

// =============================================================================
// TIME SERIES ANALYSIS
// =============================================================================

/**
 * Chronological Content Sorting
 *
 * Sorts content from oldest to newest for trend analysis
 *
 * @param {Array<Object>} posts - Array of posts
 * @param {Array<Object>} reels - Array of reels
 * @param {number} limit - Number of recent items to analyze
 * @returns {Array<Object>} Sorted content array
 */
export const getChronologicalContent = (posts, reels, limit = 10) => {
  return [...(posts || []), ...(reels || [])]
    .sort((a, b) => new Date(b.posted_at) - new Date(a.posted_at)) // Newest first
    .slice(0, limit)
    .reverse(); // Reverse to oldest first for trend analysis
};

/**
 * Performance Trend Analysis
 *
 * Calculates if metrics are trending up, down, or stable
 *
 * @param {Array<number>} values - Time series of metric values
 * @returns {string} 'increasing', 'decreasing', or 'stable'
 */
export const analyzeTrend = (values) => {
  if (values.length < 2) return 'stable';

  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));

  const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

  const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;

  if (changePercent > 5) return 'increasing';
  if (changePercent < -5) return 'decreasing';
  return 'stable';
};

// =============================================================================
// DATA VALIDATION AND QUALITY
// =============================================================================

/**
 * Data Quality Validation
 *
 * Checks for missing or invalid data points
 *
 * @param {Array<Object>} content - Content array to validate
 * @returns {Object} Quality metrics
 */
export const validateDataQuality = (content) => {
  if (!content || content.length === 0) {
    return { isValid: false, missingFields: [], completeness: 0 };
  }

  const requiredFields = ['likes', 'comments', 'posted_at'];
  const optionalFields = ['views'];

  let missingCount = 0;
  const missingFields = new Set();

  content.forEach(item => {
    requiredFields.forEach(field => {
      if (!item[field] && item[field] !== 0) {
        missingFields.add(field);
        missingCount++;
      }
    });
  });

  const totalExpectedFields = content.length * requiredFields.length;
  const completeness = ((totalExpectedFields - missingCount) / totalExpectedFields) * 100;

  return {
    isValid: completeness > 80,
    missingFields: Array.from(missingFields),
    completeness: Math.round(completeness)
  };
};

// =============================================================================
// STATISTICAL UTILITIES
// =============================================================================

/**
 * Calculate percentiles for metric distribution
 *
 * @param {Array<number>} data - Sorted array of values
 * @param {number} percentile - Percentile to calculate (0-100)
 * @returns {number} Value at the given percentile
 */
export const calculatePercentile = (data, percentile) => {
  const sorted = [...data].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);

  if (Math.floor(index) === index) {
    return sorted[index];
  }

  const lower = sorted[Math.floor(index)];
  const upper = sorted[Math.ceil(index)];
  return lower + (upper - lower) * (index - Math.floor(index));
};

/**
 * Detect outliers using IQR method
 *
 * @param {Array<number>} data - Array of values
 * @returns {Object} Outlier analysis
 */
export const detectOutliers = (data) => {
  const q1 = calculatePercentile(data, 25);
  const q3 = calculatePercentile(data, 75);
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  const outliers = data.filter(val => val < lowerBound || val > upperBound);

  return {
    q1,
    q3,
    iqr,
    lowerBound,
    upperBound,
    outliers,
    outlierCount: outliers.length,
    outlierPercentage: (outliers.length / data.length) * 100
  };
};

// =============================================================================
// EXPORT ALL FORMULAS
// =============================================================================

export default {
  // Formatting
  formatDisplayNumber,
  formatNumber,

  // Normalization
  normalizeData,
  standardizeData,

  // Engagement
  calculateEngagementRate,
  calculateAverageMetric,
  getBestPerformingContentType,

  // Time Series
  getChronologicalContent,
  analyzeTrend,

  // Quality
  validateDataQuality,

  // Statistics
  calculatePercentile,
  detectOutliers
};