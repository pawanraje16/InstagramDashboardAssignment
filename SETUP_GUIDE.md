# 🚀 Instagram Dashboard - Complete Setup Guide

This guide will walk you through setting up the Instagram Influencer Dashboard from scratch on your development machine.

## 📋 Prerequisites

### Required Software
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **MongoDB 4.4+** - [Installation guide](https://docs.mongodb.com/manual/installation/)
- **Git** - [Download here](https://git-scm.com/)

### Optional Tools
- **MongoDB Compass** - GUI for MongoDB
- **Postman** - API testing
- **VS Code** - Recommended editor

## 🛠️ Step-by-Step Installation

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/yourusername/instagram-dashboard.git

# Navigate to project directory
cd instagram-dashboard

# Check project structure
ls -la
```

Expected structure:
```
InstagramDashboard/
├── backend/
├── frontend/
├── docs/
├── README.md
├── SETUP_GUIDE.md
└── PROJECT_STRUCTURE.md
```

### 2. Database Setup

#### Option A: Local MongoDB
```bash
# Start MongoDB service
# On Windows (if installed as service)
net start MongoDB

# On macOS (with Homebrew)
brew services start mongodb-community

# On Linux (with systemd)
sudo systemctl start mongod

# Verify MongoDB is running
mongo --eval "db.version()"
```

#### Option B: Docker MongoDB
```bash
# Run MongoDB in Docker
docker run -d \
  --name instagram-mongo \
  -p 27017:27017 \
  -v mongodb_data:/data/db \
  mongo:6.0

# Verify container is running
docker ps
```

#### Option C: MongoDB Atlas (Cloud)
1. Create account at [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a cluster
3. Get connection string
4. Use in backend `.env` file

### 3. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Edit .env file with your configuration
nano .env  # or use your preferred editor
```

#### Configure Backend Environment

Edit `backend/.env`:
```bash
# Server Configuration
NODE_ENV=development
PORT=5000

# Database (choose one)
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/instagram_dashboard

# MongoDB Atlas (if using cloud)
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/instagram_dashboard

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Start Backend Server

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm start

# Check server status
curl http://localhost:5000/health
```

Expected output:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": {
    "status": "connected"
  }
}
```

### 4. Frontend Setup

Open a new terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit frontend environment
nano .env
```

#### Configure Frontend Environment

Edit `frontend/.env`:
```bash
# API Configuration
VITE_API_URL=http://localhost:5000/api

# App Configuration
VITE_APP_NAME=Instagram Dashboard
VITE_APP_VERSION=1.0.0
```

#### Start Frontend Development Server

```bash
# Start development server
npm run dev

# Build for production (optional)
npm run build

# Preview production build
npm run preview
```

### 5. Verify Installation

#### Check Backend API
```bash
# API health check
curl http://localhost:5000/health

# API information
curl http://localhost:5000/api

# Test user endpoint (should return 404 for non-existent user)
curl http://localhost:5000/api/user/nonexistentuser
```

#### Check Frontend
1. Open browser to http://localhost:3000
2. Should see Instagram Dashboard homepage
3. Try searching for a username (e.g., "cristiano")
4. Verify dark/light theme toggle works

### 6. Test the Complete System

#### Test Instagram Data Fetching
```bash
# Use the working Instagram scraper we built earlier
cd InstagramDashboard

# Test basic scraping
node instagram-test.js cristiano

# Test comprehensive scraping
node instagram-posts-fixed.js theboyfrom_maharashtra
```

#### Test API Endpoints
```bash
# Search for a user
curl "http://localhost:5000/api/users/search?q=cristiano"

# Get user profile (this will fetch from Instagram)
curl http://localhost:5000/api/user/cristiano

# Force refresh user data
curl -X POST http://localhost:5000/api/user/cristiano/refresh
```

## 🔧 Configuration Options

### Backend Configuration

#### Rate Limiting
Adjust in `backend/server.js`:
```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // requests per window
});
```

#### Database Indexes
The app automatically creates indexes, but you can manually create them:
```javascript
// In MongoDB shell
db.users.createIndex({ "instagram_username": 1 }, { unique: true })
db.posts.createIndex({ "user_id": 1, "instagram_data.posted_at": -1 })
```

#### Logging Levels
Available levels: `error`, `warn`, `info`, `http`, `debug`

### Frontend Configuration

#### Theme Customization
Edit `frontend/tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Your custom color palette
      }
    }
  }
}
```

#### Chart Configuration
Modify `frontend/src/components/Charts/EngagementChart.jsx` for custom chart styling.

## 🐛 Troubleshooting

### Common Issues

#### Backend Issues

**MongoDB Connection Error**
```bash
# Check if MongoDB is running
mongo --eval "db.version()"

# Check connection string in .env
echo $MONGODB_URI

# Check firewall/network issues
telnet localhost 27017
```

**Port Already in Use**
```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>

# Or use different port in .env
PORT=5001
```

**Instagram Scraping Fails**
- Instagram may have changed their endpoints
- Try different usernames
- Check rate limiting
- Verify network connectivity

#### Frontend Issues

**Build Errors**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
```

**API Connection Issues**
- Verify backend is running on correct port
- Check CORS settings in backend
- Verify API URL in frontend .env

**Theme Not Working**
- Check localStorage for theme preference
- Verify Tailwind CSS is properly configured
- Check for JavaScript errors in browser console

### Debug Mode

#### Enable Debug Logging
Backend `.env`:
```bash
LOG_LEVEL=debug
NODE_ENV=development
```

Frontend debugging:
```bash
# Run with debug info
npm run dev -- --debug

# Check browser console for errors
# Open DevTools > Console
```

## 📊 Performance Optimization

### Backend Optimization

#### Database Performance
```bash
# Create compound indexes
db.posts.createIndex({
  "user_id": 1,
  "instagram_data.posted_at": -1,
  "likes": -1
})

# Monitor slow queries
db.setProfilingLevel(2, { slowms: 100 })
```

#### Memory Management
```bash
# Monitor memory usage
node --inspect backend/server.js

# Use PM2 for production
npm install -g pm2
pm2 start backend/server.js
```

### Frontend Optimization

#### Bundle Analysis
```bash
# Analyze bundle size
npm run build
npm run preview

# Use Vite bundle analyzer
npx vite-bundle-analyzer dist
```

## 🚀 Production Deployment

### Environment Preparation

#### Backend Production Setup
```bash
# Set production environment
NODE_ENV=production

# Use process manager
npm install -g pm2

# Start with PM2
pm2 start server.js --name "instagram-api"

# Enable startup script
pm2 startup
pm2 save
```

#### Frontend Production Build
```bash
# Build for production
npm run build

# Serve with static server
npm install -g serve
serve -s dist -p 3000
```

### Docker Deployment

#### Create Docker Compose
```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  api:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/instagram_dashboard
    depends_on:
      - mongodb

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - api

volumes:
  mongodb_data:
```

#### Deploy with Docker
```bash
# Build and start services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f api
```

## 📋 Final Checklist

- [ ] MongoDB is running and accessible
- [ ] Backend server starts without errors
- [ ] Frontend development server starts
- [ ] API endpoints respond correctly
- [ ] Instagram data fetching works
- [ ] Database operations work
- [ ] Frontend displays data correctly
- [ ] Dark/light theme toggle works
- [ ] Search functionality works
- [ ] Charts render properly
- [ ] No console errors in browser
- [ ] Mobile responsiveness works

## 🎉 Next Steps

After successful setup:

1. **Test with real data** - Try different Instagram usernames
2. **Customize the UI** - Modify colors, layouts, and components
3. **Add features** - Implement additional analytics or visualizations
4. **Deploy to production** - Set up cloud hosting
5. **Monitor performance** - Set up logging and monitoring

## 💡 Tips for Success

1. **Start simple** - Get basic functionality working first
2. **Use the examples** - Test with known Instagram usernames
3. **Check logs** - Monitor backend and frontend logs for issues
4. **Test incrementally** - Verify each component before moving to the next
5. **Document changes** - Keep track of any modifications you make

## 📞 Getting Help

If you encounter issues:

1. **Check the logs** - Backend and frontend console outputs
2. **Review this guide** - Make sure all steps were followed
3. **Test components individually** - Isolate the problematic component
4. **Check dependencies** - Ensure all packages are installed correctly
5. **Create an issue** - Report bugs with detailed information

---

**Happy coding! 🚀**

*You now have a fully functional Instagram analytics dashboard ready for development and customization.*