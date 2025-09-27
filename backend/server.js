require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Import utilities and middleware
const logger = require('./src/utils/logger');
const { errorHandler, notFound } = require('./src/middleware/errorHandler');
const dbConnection = require('./config/database');

// Import routes
const userRoutes = require('./src/routes/userRoutes');

/**
 * Instagram Dashboard Backend Server
 * Express.js API with MongoDB integration
 */
class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 5000;

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: false, // Disable CSP for API
      crossOriginEmbedderPolicy: false
    }));

    // Compression
    this.app.use(compression());

    // CORS configuration
    const corsOptions = {
      origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'http://localhost:5173'],
      credentials: true,
      optionsSuccessStatus: 200,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID']
    };
    this.app.use(cors(corsOptions));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: {
        success: false,
        statusCode: 429,
        message: 'Too many requests from this IP, please try again later.',
        timestamp: new Date().toISOString()
      },
      standardHeaders: true,
      legacyHeaders: false
    });
    this.app.use(limiter);

    // Specific rate limit for Instagram data fetching
    const instagramLimiter = rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 20, // 20 requests per hour for Instagram endpoints
      keyGenerator: (req) => `instagram_${req.ip}`,
      message: {
        success: false,
        statusCode: 429,
        message: 'Instagram API rate limit exceeded. Please try again in an hour.',
        timestamp: new Date().toISOString()
      }
    });

    // Apply Instagram rate limit to specific routes
    this.app.use('/api/user/:username/refresh', instagramLimiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
    this.app.use(morgan(morganFormat, {
      stream: {
        write: (message) => logger.http(message.trim())
      }
    }));

    // Request ID middleware
    this.app.use((req, res, next) => {
      req.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
      res.set('X-Request-ID', req.id);
      next();
    });

    // Health check middleware
    this.app.use('/health', (req, res) => {
      const dbStatus = dbConnection.getStatus();

      const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0',
        database: {
          status: dbStatus.isConnected ? 'connected' : 'disconnected',
          state: dbStatus.state
        },
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      };

      const statusCode = dbStatus.isConnected ? 200 : 503;
      res.status(statusCode).json(health);
    });
  }

  /**
   * Setup API routes
   */
  setupRoutes() {
    // API root
    this.app.get('/api', (req, res) => {
      res.json({
        success: true,
        message: 'Instagram Dashboard API',
        version: '1.0.0',
        documentation: '/api/docs',
        endpoints: {
          users: '/api/users',
          user: '/api/user/:username',
          health: '/health'
        },
        timestamp: new Date().toISOString()
      });
    });

    // Image proxy endpoint to bypass CORS restrictions
    this.app.get('/api/proxy/image', async (req, res) => {
      try {
        const { url } = req.query;
        if (!url) {
          return res.status(400).json({ error: 'URL parameter is required' });
        }

        // Validate URL is from Instagram
        if (!url.includes('instagram.') && !url.includes('fbcdn.net')) {
          return res.status(403).json({ error: 'Only Instagram URLs are allowed' });
        }

        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        if (!response.ok) {
          return res.status(404).json({ error: 'Image not found' });
        }

        // Set appropriate headers
        res.set({
          'Content-Type': response.headers.get('content-type') || 'image/jpeg',
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*'
        });

        response.body.pipe(res);
      } catch (error) {
        logger.error('Image proxy error:', error);
        res.status(500).json({ error: 'Failed to proxy image' });
      }
    });

    // Mount routes
    this.app.use('/api/user', userRoutes);
    this.app.use('/api/users', userRoutes);

    // API documentation
    this.app.get('/api/docs', (req, res) => {
      res.json({
        success: true,
        message: 'Instagram Dashboard API Documentation',
        version: '1.0.0',
        baseUrl: `${req.protocol}://${req.get('host')}/api`,

        overview: {
          description: 'API for Instagram influencer profile analysis, posts, reels, and analytics',
          contentSeparation: 'Posts (images/carousels) and Reels (videos) are stored and served separately',
          rateLimits: {
            general: '100 requests per 15 minutes',
            refresh: '1 request per 4 hours per user'
          }
        },

        endpoints: {
          profile: [
            {
              method: 'GET',
              path: '/user/:username',
              description: 'Get basic user profile information only',
              parameters: {
                path: ['username (required) - Instagram username without @']
              },
              response: {
                fields: ['username', 'full_name', 'profile_pic_url', 'followers', 'following', 'posts_count', 'is_verified', 'engagement_rate', 'avg_likes', 'avg_comments'],
                example: '/user/theboyfrom_maharashtra'
              }
            },
            {
              method: 'POST',
              path: '/user/:username/refresh',
              description: 'Force refresh user data from Instagram (rate limited)',
              parameters: {
                path: ['username (required) - Instagram username']
              },
              rateLimits: '1 request per 4 hours per user',
              response: 'Updated profile data'
            },
            {
              method: 'GET',
              path: '/user/:username/analytics',
              description: 'Get user engagement analytics',
              parameters: {
                path: ['username (required) - Instagram username']
              },
              response: {
                fields: ['engagement_rate', 'avg_likes', 'avg_comments']
              }
            }
          ],

          content: [
            {
              method: 'GET',
              path: '/user/:username/posts',
              description: 'Get user posts (images and carousels only) with pagination',
              parameters: {
                path: ['username (required) - Instagram username'],
                query: [
                  'page (optional) - Page number (default: 1)',
                  'limit (optional) - Posts per page (default: 20, max: 50)',
                  'sortBy (optional) - Sort field: -posted_at, posted_at, -likes, likes, -comments, comments'
                ]
              },
              response: {
                contentType: 'image/carousel posts only',
                fields: ['type', 'shortcode', 'media_type', 'caption', 'display_url', 'likes', 'comments', 'posted_at'],
                pagination: true,
                example: '/user/theboyfrom_maharashtra/posts?page=1&limit=10&sortBy=-likes'
              }
            },
            {
              method: 'GET',
              path: '/user/:username/reels',
              description: 'Get user reels (videos) with views, hashtags, and tags',
              parameters: {
                path: ['username (required) - Instagram username'],
                query: [
                  'page (optional) - Page number (default: 1)',
                  'limit (optional) - Reels per page (default: 20, max: 50)',
                  'sortBy (optional) - Sort field: -posted_at, posted_at, -likes, likes, -comments, comments, -views, views'
                ]
              },
              response: {
                contentType: 'video reels with extended metadata',
                fields: ['type', 'shortcode', 'caption', 'display_url', 'video_url', 'likes', 'comments', 'views', 'hashtags', 'tags', 'duration', 'posted_at'],
                specialFeatures: ['view counts', 'hashtag extraction', 'content categorization', 'video duration'],
                pagination: true,
                example: '/user/theboyfrom_maharashtra/reels?page=1&limit=5&sortBy=-views'
              }
            }
          ],

          search: [
            {
              method: 'GET',
              path: '/users/search',
              description: 'Search users by username or full name',
              parameters: {
                query: [
                  'q (required) - Search query (minimum 2 characters)',
                  'limit (optional) - Number of results (default: 20, max: 100)'
                ]
              },
              example: '/users/search?q=maharashtra&limit=10'
            },
            {
              method: 'GET',
              path: '/users/top',
              description: 'Get top influencers ranked by followers',
              parameters: {
                query: ['limit (optional) - Number of results (default: 50, max: 100)']
              },
              example: '/users/top?limit=20'
            }
          ]
        },

        dataModels: {
          post: {
            description: 'Image and carousel posts',
            fields: {
              type: 'Always "post"',
              shortcode: 'Instagram shortcode',
              media_type: 'Either "image" or "carousel"',
              caption: 'Post caption text',
              display_url: 'Image URL',
              likes: 'Number of likes',
              comments: 'Number of comments',
              posted_at: 'ISO 8601 timestamp'
            }
          },
          reel: {
            description: 'Video reels with extended metadata',
            fields: {
              type: 'Always "reel"',
              shortcode: 'Instagram shortcode',
              caption: 'Reel caption text',
              display_url: 'Thumbnail image URL',
              video_url: 'Video file URL',
              likes: 'Number of likes',
              comments: 'Number of comments',
              views: 'Number of views (reel-specific)',
              hashtags: 'Array of hashtags extracted from caption',
              tags: 'Array of content category tags',
              duration: 'Video length in seconds',
              posted_at: 'ISO 8601 timestamp'
            }
          },
          profile: {
            description: 'User profile information',
            fields: {
              username: 'Instagram username',
              full_name: 'User display name',
              profile_pic_url: 'Profile picture URL',
              followers: 'Follower count',
              following: 'Following count',
              posts_count: 'Total posts count',
              is_verified: 'Verification status',
              engagement_rate: 'Engagement percentage',
              avg_likes: 'Average likes per post',
              avg_comments: 'Average comments per post'
            }
          }
        },

        contentCategories: {
          description: 'Reels are automatically tagged with content categories',
          categories: ['fashion', 'food', 'travel', 'fitness', 'beauty', 'lifestyle', 'music', 'art', 'dance', 'comedy', 'tech', 'sports', 'nature', 'motivation', 'education', 'business', 'diy', 'recipe', 'tutorial']
        },

        errorCodes: {
          400: 'Bad Request - Invalid parameters',
          404: 'Not Found - User not found in database',
          429: 'Too Many Requests - Rate limit exceeded',
          500: 'Internal Server Error - Server error'
        },

        examples: {
          basicProfile: `${req.protocol}://${req.get('host')}/api/user/theboyfrom_maharashtra`,
          userPosts: `${req.protocol}://${req.get('host')}/api/user/theboyfrom_maharashtra/posts?limit=10`,
          userReels: `${req.protocol}://${req.get('host')}/api/user/theboyfrom_maharashtra/reels?sortBy=-views`,
          search: `${req.protocol}://${req.get('host')}/api/users/search?q=maharashtra`
        }
      });
    });
  }

  /**
   * Setup error handling
   */
  setupErrorHandling() {
    // 404 handler for unmatched routes
    this.app.use(notFound);

    // Global error handler
    this.app.use(errorHandler);

    // Unhandled promise rejections
    process.on('unhandledRejection', (err, promise) => {
      logger.error('Unhandled Promise Rejection:', err);
      this.shutdown();
    });

    // Uncaught exceptions
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', err);
      this.shutdown();
    });

    // Graceful shutdown
    process.on('SIGTERM', this.shutdown.bind(this));
    process.on('SIGINT', this.shutdown.bind(this));
  }

  /**
   * Start the server
   */
  async start() {
    try {
      // Connect to database
      await dbConnection.connect();

      // Initialize database (create indexes, etc.)
      await dbConnection.initialize();

      // Start Express server
      this.server = this.app.listen(this.port, () => {
        logger.info(`🚀 Instagram Dashboard API Server started`, {
          port: this.port,
          environment: process.env.NODE_ENV,
          database: dbConnection.getStatus().database,
          timestamp: new Date().toISOString()
        });

        if (process.env.NODE_ENV === 'development') {
          logger.info(`📚 API Documentation: http://localhost:${this.port}/api/docs`);
          logger.info(`❤️  Health Check: http://localhost:${this.port}/health`);
          logger.info(`🔗 API Base URL: http://localhost:${this.port}/api`);
        }
      });

      this.server.on('error', (error) => {
        logger.error('Server error:', error);
        this.shutdown();
      });

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    logger.info('🔄 Gracefully shutting down server...');

    if (this.server) {
      this.server.close(() => {
        logger.info('Express server closed');
      });
    }

    // Close database connection
    await dbConnection.gracefulShutdown();
  }
}

// Create and start server
const server = new Server();

// Start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  server.start().catch((error) => {
    logger.error('Failed to start application:', error);
    process.exit(1);
  });
}

module.exports = server;