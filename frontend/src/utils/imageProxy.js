/**
 * Image proxy utility to handle Instagram image URLs
 * Uses backend proxy to bypass CORS restrictions
 */

const API_BASE_URL = 'http://localhost:8000/api';

/**
 * Get the best image URL (Cloudinary first, then proxy, then original)
 * @param {string} instagramUrl - Original Instagram image URL
 * @param {string} cloudinaryUrl - Cloudinary URL if available
 * @returns {string} - Best available image URL
 */
export const getProxiedImageUrl = (instagramUrl, cloudinaryUrl = null) => {
  // Prefer Cloudinary URL if available
  if (cloudinaryUrl) {
    return cloudinaryUrl;
  }

  if (!instagramUrl) return null;

  // If it's already a non-Instagram URL, return as is
  if (!instagramUrl.includes('instagram.') && !instagramUrl.includes('fbcdn.net')) {
    return instagramUrl;
  }

  // Use our proxy endpoint as fallback
  return `${API_BASE_URL}/proxy/image?url=${encodeURIComponent(instagramUrl)}`;
};

/**
 * Check if image URL is from Instagram CDN
 * @param {string} url - Image URL to check
 * @returns {boolean} - True if Instagram URL
 */
export const isInstagramUrl = (url) => {
  if (!url) return false;
  return url.includes('instagram.') || url.includes('fbcdn.net');
};