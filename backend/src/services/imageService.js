const cloudinary = require('cloudinary').v2;
const axios = require('axios');
const sharp = require('sharp');
const crypto = require('crypto');

// Configure Cloudinary (add your credentials to .env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || 'demo',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'demo'
});

class ImageService {
  /**
   * Download and upload Instagram thumbnail to Cloudinary
   * @param {string} instagramUrl - Original Instagram thumbnail URL
   * @param {string} folder - Cloudinary folder name
   * @param {string} publicId - Custom public ID for the thumbnail
   * @returns {Promise<string>} - Cloudinary thumbnail URL
   */
  async downloadAndUploadThumbnail(instagramUrl, folder = 'instagram-thumbnails', publicId = null) {
    try {
      if (!instagramUrl) {
        throw new Error('Instagram URL is required');
      }

      // Generate a unique public ID if not provided
      if (!publicId) {
        const hash = crypto.createHash('md5').update(instagramUrl).digest('hex');
        publicId = `img_${hash}`;
      }

      console.log(`📸 Downloading thumbnail from: ${instagramUrl}`);

      // Download the thumbnail from Instagram
      const response = await axios({
        method: 'GET',
        url: instagramUrl,
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 10000
      });

      // Process thumbnail with Sharp (optimize for thumbnails)
      const processedThumbnail = await sharp(response.data)
        .resize(400, 400, {
          fit: 'cover',
          withoutEnlargement: false
        })
        .jpeg({
          quality: 80,
          progressive: true
        })
        .toBuffer();

      console.log(`📤 Uploading to Cloudinary: ${folder}/${publicId}`);

      // Upload to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: folder,
            public_id: publicId,
            resource_type: 'image',
            format: 'jpg',
            transformation: [
              { quality: 'auto:good' },
              { fetch_format: 'auto' },
              { width: 400, height: 400, crop: 'fill' }
            ]
          },
          (error, result) => {
            if (error) {
              console.error('❌ Cloudinary upload error:', error);
              reject(error);
            } else {
              console.log(`✅ Thumbnail uploaded successfully: ${result.secure_url}`);
              resolve(result);
            }
          }
        ).end(processedThumbnail);
      });

      return uploadResult.secure_url;

    } catch (error) {
      console.error('❌ Error in downloadAndUploadThumbnail:', error.message);

      // Return null instead of throwing, so we can fall back to gradients
      return null;
    }
  }

  /**
   * Batch process multiple thumbnails
   * @param {Array<{url: string, folder: string, publicId: string}>} thumbnails
   * @returns {Promise<Array<{original: string, cloudinary: string}>>}
   */
  async batchProcessThumbnails(thumbnails) {
    const results = [];

    for (const thumbnail of thumbnails) {
      try {
        const cloudinaryUrl = await this.downloadAndUploadThumbnail(
          thumbnail.url,
          thumbnail.folder,
          thumbnail.publicId
        );

        results.push({
          original: thumbnail.url,
          cloudinary: cloudinaryUrl
        });

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`❌ Failed to process thumbnail ${thumbnail.url}:`, error.message);
        results.push({
          original: thumbnail.url,
          cloudinary: null
        });
      }
    }

    return results;
  }

  /**
   * Generate a consistent public ID from Instagram URL
   * @param {string} instagramUrl
   * @param {string} prefix
   * @returns {string}
   */
  generatePublicId(instagramUrl, prefix = 'img') {
    const hash = crypto.createHash('md5').update(instagramUrl).digest('hex');
    return `${prefix}_${hash.substring(0, 12)}`;
  }

  /**
   * Check if image already exists in Cloudinary
   * @param {string} publicId
   * @returns {Promise<string|null>}
   */
  async getExistingImage(publicId) {
    try {
      const result = await cloudinary.api.resource(publicId);
      return result.secure_url;
    } catch (error) {
      // Image doesn't exist
      return null;
    }
  }
}

module.exports = new ImageService();