const mongoose = require('mongoose');
const logger = require('../src/utils/logger');

/**
 * Database connection configuration
 */
class DatabaseConnection {
  constructor() {
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxRetryAttempts = 5;
    this.retryInterval = 5000; // 5 seconds
  }

  /**
   * Connect to MongoDB
   * @returns {Promise<void>}
   */
  async connect() {
    try {
      const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/instagram_dashboard';

      const options = {
        // Connection options
        maxPoolSize: 10, // Maximum number of connections in the connection pool
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        // bufferMaxEntries: 0, // Disable mongoose buffering (deprecated)
        bufferCommands: false, // Disable mongoose buffering

        // Authentication options (if needed)
        ...(process.env.MONGODB_USERNAME && {
          auth: {
            username: process.env.MONGODB_USERNAME,
            password: process.env.MONGODB_PASSWORD
          }
        })
      };

      logger.info('Connecting to MongoDB...', { uri: mongoURI.replace(/\/\/.*@/, '//***:***@') });

      await mongoose.connect(mongoURI, options);

      this.isConnected = true;
      this.connectionAttempts = 0;

      logger.info('MongoDB connected successfully', {
        database: mongoose.connection.db.databaseName,
        host: mongoose.connection.host,
        port: mongoose.connection.port
      });

      // Set up event listeners
      this.setupEventListeners();

    } catch (error) {
      this.isConnected = false;
      this.connectionAttempts++;

      logger.error('MongoDB connection failed:', {
        error: error.message,
        attempt: this.connectionAttempts,
        maxAttempts: this.maxRetryAttempts
      });

      if (this.connectionAttempts < this.maxRetryAttempts) {
        logger.info(`Retrying connection in ${this.retryInterval / 1000} seconds...`);
        setTimeout(() => this.connect(), this.retryInterval);
      } else {
        logger.error('Max connection attempts reached. Exiting...');
        process.exit(1);
      }
    }
  }

  /**
   * Set up MongoDB event listeners
   */
  setupEventListeners() {
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connected');
      this.isConnected = true;
    });

    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
      this.isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      this.isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
      this.isConnected = true;
    });

    // Handle application termination
    process.on('SIGINT', this.gracefulShutdown.bind(this));
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
  }

  /**
   * Gracefully shutdown database connection
   */
  async gracefulShutdown() {
    try {
      logger.info('Closing MongoDB connection...');
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during MongoDB shutdown:', error);
      process.exit(1);
    }
  }

  /**
   * Check if database is connected
   * @returns {boolean}
   */
  isReady() {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  /**
   * Get database connection status
   * @returns {Object}
   */
  getStatus() {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    return {
      isConnected: this.isConnected,
      state: states[mongoose.connection.readyState] || 'unknown',
      database: mongoose.connection.db?.databaseName || null,
      host: mongoose.connection.host || null,
      port: mongoose.connection.port || null,
      connectionAttempts: this.connectionAttempts
    };
  }

  /**
   * Initialize database with indexes and default data
   */
  async initialize() {
    try {
      logger.info('Initializing database...');

      // Ensure indexes are created
      await this.createIndexes();

      logger.info('Database initialization completed');

    } catch (error) {
      logger.error('Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create database indexes for better performance
   */
  async createIndexes() {
    try {
      const collections = mongoose.connection.collections;

      // Users collection indexes
      if (collections.users) {
        await collections.users.createIndex({ instagram_username: 1 }, { unique: true });
        await collections.users.createIndex({ 'profile.followers': -1 });
        await collections.users.createIndex({ 'analytics.influence_score': -1 });
        await collections.users.createIndex({ 'scraping.last_scraped': 1 });
        logger.info('Users collection indexes created');
      }

      // Posts collection indexes
      if (collections.posts) {
        await collections.posts.createIndex({ user_id: 1, 'instagram_data.posted_at': -1 });
        await collections.posts.createIndex({ instagram_post_id: 1 }, { unique: true });
        await collections.posts.createIndex({ user_id: 1, likes: -1 });
        await collections.posts.createIndex({ hashtags: 1 });
        logger.info('Posts collection indexes created');
      }

      // Analytics collection indexes
      if (collections.analytics) {
        await collections.analytics.createIndex({ user_id: 1, 'period.start_date': -1 });
        await collections.analytics.createIndex({ 'influence.overall_score': -1 });
        logger.info('Analytics collection indexes created');
      }

    } catch (error) {
      logger.error('Error creating indexes:', error);
      // Don't throw error, indexes are not critical for basic functionality
    }
  }
}

// Create singleton instance
const dbConnection = new DatabaseConnection();

module.exports = dbConnection;