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

    // Mount routes
    this.app.use('/api/user', userRoutes);
    this.app.use('/api/users', userRoutes);

    // API documentation placeholder
    this.app.get('/api/docs', (req, res) => {
      res.json({
        success: true,
        message: 'API Documentation',
        baseUrl: `${req.protocol}://${req.get('host')}/api`,
        endpoints: [
          {
            method: 'GET',
            path: '/user/:username',
            description: 'Get user profile data (cached or fresh)',
            parameters: ['username (path)']
          },
          {
            method: 'POST',
            path: '/user/:username/refresh',
            description: 'Force refresh user data from Instagram',
            parameters: ['username (path)']
          },
          {
            method: 'GET',
            path: '/user/:username/posts',
            description: 'Get user posts with pagination',
            parameters: ['username (path)', 'page (query)', 'limit (query)', 'sortBy (query)']
          },
          {
            method: 'GET',
            path: '/user/:username/analytics',
            description: 'Get user analytics data',
            parameters: ['username (path)']
          },
          {
            method: 'GET',
            path: '/users/search',
            description: 'Search users by username or name',
            parameters: ['q (query)', 'limit (query)']
          },
          {
            method: 'GET',
            path: '/users/top',
            description: 'Get top influencers',
            parameters: ['limit (query)']
          }
        ]
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