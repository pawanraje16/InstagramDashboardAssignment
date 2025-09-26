# Instagram Influencer Dashboard - Backend API 📊

A powerful Node.js backend API for analyzing Instagram influencer profiles, posts, engagement metrics, and influence scores in real-time.

## 🌟 Features

### 📱 **Instagram Data Analysis**
- **Profile Analytics** - Followers, following, post count, verification status
- **Post Metrics** - Likes, comments, engagement rates, media types
- **Reels Analytics** - Views, performance metrics, video content analysis
- **Real-time Data** - Fresh data fetching from Instagram with smart caching

### 📈 **Advanced Analytics**
- **Influence Score** - Proprietary algorithm scoring influencer impact (0-100)
- **Engagement Rate** - Detailed engagement calculations and trends
- **Content Analysis** - Post type breakdown (images, videos, carousels, reels)
- **Hashtag Analytics** - Top performing hashtags and usage patterns

### ⚡ **Performance & Architecture**
- **Smart Caching** - Intelligent data caching and background refreshing
- **Rate Limiting** - Built-in protection against API abuse
- **Error Handling** - Comprehensive error handling and logging
- **MongoDB Integration** - Efficient data storage and retrieval

## 🏗️ Backend Architecture

```
backend/
├── src/
│   ├── controllers/     # API route handlers
│   ├── models/         # MongoDB schemas (User, Post, Analytics)
│   ├── services/       # Business logic & Instagram scraping
│   ├── middleware/     # Authentication, validation, error handling
│   ├── routes/         # API routes
│   └── utils/          # Helper functions & utilities
├── config/             # Database & environment configuration
├── logs/               # Application logs
└── server.js          # Main server file
```

## 🚀 Backend Setup

### Prerequisites
- **Node.js** 18+
- **MongoDB** 4.4+
- **npm** or **yarn**

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Configuration
```bash
# Copy environment file
cp .env.example .env

# Edit .env with your configuration
```

**Backend Environment Variables (.env)**
```bash
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/instagram_dashboard
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Access Points
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api/docs
- **Health Check**: http://localhost:5000/health

## 📡 API Endpoints

### **User Endpoints**
```http
GET    /api/user/:username           # Get user profile & analytics
POST   /api/user/:username/refresh   # Force refresh user data
GET    /api/user/:username/posts     # Get user posts (paginated)
GET    /api/user/:username/analytics # Get detailed analytics
```

### **Search Endpoints**
```http
GET    /api/users/search?q=query     # Search users
GET    /api/users/top?limit=50       # Get top influencers
```

### **Utility Endpoints**
```http
GET    /health                       # Health check
GET    /api                         # API information
GET    /api/docs                    # API documentation
```

## 🛠️ Backend Technology Stack

### **Core Technologies**
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens
- **Validation**: Joi
- **Logging**: Winston
- **Testing**: Jest + Supertest

### **Security & Performance**
- **Helmet.js** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - Express rate limiter
- **Compression** - Gzip compression
- **Morgan** - HTTP request logger

## 🗄️ Database Schema

### **Users Collection**
```javascript
{
  _id: ObjectId,
  instagram_username: String,
  instagram_id: String,
  profile: {
    full_name: String,
    biography: String,
    followers: Number,
    following: Number,
    posts_count: Number,
    is_verified: Boolean,
    is_business: Boolean,
    profile_pic_url: String
  },
  analytics: {
    influence_score: Number,
    engagement_rate: Number,
    avg_likes: Number,
    avg_comments: Number,
    total_likes: Number,
    total_comments: Number
  },
  scraping: {
    last_scraped: Date,
    scrape_count: Number,
    scrape_status: String
  }
}
```

### **Posts Collection**
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  instagram_post_id: String,
  shortcode: String,
  media_type: String,
  caption: String,
  likes: Number,
  comments: Number,
  views: Number,
  hashtags: [String],
  mentions: [Object],
  instagram_data: {
    posted_at: Date,
    taken_at: Date
  }
}
```

## 🎯 Key Services

### **InstagramService** (`src/services/InstagramService.js`)
Core service for scraping Instagram data:
- **getUserProfile()** - Fetch user profile data
- **getUserPosts()** - Fetch user posts with pagination
- **getCompleteUserData()** - Combined profile + posts + analytics
- **Rate limiting** - 30 requests per minute
- **Error handling** - Handles Instagram API errors gracefully

### **DatabaseService** (`src/services/DatabaseService.js`)
Database operations and caching:
- **User management** - CRUD operations for users
- **Post management** - Store and retrieve post data
- **Analytics calculation** - Generate engagement metrics
- **Search functionality** - User search and filtering

### **Influence Score Algorithm**
```javascript
// Proprietary scoring algorithm (0-100)
const influenceScore = calculateScore({
  followerBase: 30,      // Max 30 points
  engagementQuality: 25, // Max 25 points
  contentConsistency: 20, // Max 20 points
  verification: 15,       // Max 15 points
  contentDiversity: 10    // Max 10 points
});
```

## 🔧 Configuration

### **Rate Limiting**
```javascript
const rateLimits = {
  general: '100 requests per 15 minutes',
  instagram: '20 requests per hour',
  search: '50 requests per 10 minutes'
};
```

### **Logging Configuration**
- **Development**: Console + file logging
- **Production**: File-based structured logging
- **Log Levels**: error, warn, info, debug
- **Log Files**: `logs/combined.log`, `logs/error.log`

## 🧪 Testing

```bash
cd backend

# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Linting
npm run lint
npm run lint:fix
```

## 🚀 Production Deployment

### **Build and Start**
```bash
cd backend
npm install --production
npm start
```

### **PM2 Process Manager**
```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start server.js --name "instagram-api"

# Monitor
pm2 monit
```

### **Docker Deployment**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

## 📊 Performance Optimizations

### **Database Optimizations**
- **Indexes** - Optimized MongoDB indexes for fast queries
- **Connection pooling** - Efficient connection management
- **Aggregation pipelines** - Complex analytics queries
- **TTL indexes** - Automatic cleanup of old data

### **API Optimizations**
- **Response compression** - Gzip compression
- **Request validation** - Early request validation
- **Error handling** - Structured error responses
- **Caching headers** - Proper cache control

## 🛡️ Security Features

### **Security Middleware**
- **Helmet.js** - Security headers
- **CORS** - Controlled cross-origin access
- **Rate limiting** - DDoS protection
- **Input validation** - Joi schema validation
- **Error sanitization** - No sensitive data exposure

### **Data Protection**
- **Environment variables** - Secure configuration
- **MongoDB security** - Connection security
- **Request logging** - Audit trail
- **Error monitoring** - Comprehensive error tracking

## 🤝 API Usage Examples

### **Get User Profile**
```javascript
const response = await fetch('/api/user/cristiano');
const data = await response.json();
```

### **Search Users**
```javascript
const response = await fetch('/api/users/search?q=football&limit=10');
const users = await response.json();
```

### **Get Top Influencers**
```javascript
const response = await fetch('/api/users/top?limit=20');
const topUsers = await response.json();
```

## 📞 Support & Documentation

- **API Documentation**: http://localhost:5000/api/docs
- **Health Monitoring**: http://localhost:5000/health
- **Logs**: `backend/logs/` directory

---

**Instagram Dashboard Backend API** - Built with  for powerful Instagram analytics.