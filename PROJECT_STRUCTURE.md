# Instagram Dashboard - Project Structure

## 📁 Project Organization

```
InstagramDashboard/
├── backend/                    # Node.js Express API Server
│   ├── src/
│   │   ├── controllers/       # API route handlers
│   │   ├── models/           # MongoDB schemas
│   │   ├── services/         # Business logic & Instagram scraping
│   │   ├── middleware/       # Authentication, validation
│   │   ├── routes/           # API routes
│   │   └── utils/            # Helper functions
│   ├── config/               # Database, environment config
│   ├── tests/                # Backend tests
│   ├── package.json
│   ├── .env.example
│   └── server.js            # Main server file
│
├── frontend/                  # React Vite Application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Route pages
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API calls
│   │   ├── utils/           # Helper functions
│   │   ├── styles/          # Global CSS, themes
│   │   └── assets/          # Images, icons
│   ├── public/              # Static files
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── index.html
│
├── docs/                     # Documentation
│   ├── API.md               # API documentation
│   ├── SETUP.md             # Installation guide
│   ├── DEPLOYMENT.md        # Deployment instructions
│   └── ARCHITECTURE.md      # System architecture
│
├── docker-compose.yml       # Docker setup
├── .env.example            # Environment variables template
├── README.md               # Main project documentation
└── CHANGELOG.md            # Version history
```

## 🔧 Technology Stack

### Backend:
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT tokens
- **Validation:** Joi
- **Logging:** Winston
- **Testing:** Jest + Supertest
- **Documentation:** Swagger/OpenAPI

### Frontend:
- **Framework:** React 18 with Vite
- **Styling:** Tailwind CSS + Headless UI
- **Charts:** Chart.js / Recharts
- **Icons:** Heroicons / Lucide React
- **HTTP Client:** Axios
- **State Management:** React Context / Zustand
- **Routing:** React Router v6
- **Testing:** Vitest + React Testing Library

### DevOps:
- **Containerization:** Docker & Docker Compose
- **Process Manager:** PM2
- **Environment:** dotenv
- **Linting:** ESLint + Prettier
- **Git Hooks:** Husky + lint-staged

## 🗄️ Database Collections

### Users Collection
```javascript
{
  _id: ObjectId,
  instagram_username: String,
  profile_data: Object,
  last_updated: Date,
  scrape_count: Number,
  created_at: Date
}
```

### Posts Collection
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  instagram_post_id: String,
  shortcode: String,
  media_type: String,
  likes: Number,
  comments: Number,
  caption: String,
  hashtags: [String],
  timestamp: Date,
  scraped_at: Date
}
```

### Analytics Collection
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  metrics: Object,
  influence_score: Number,
  analyzed_at: Date
}
```

## 📡 API Endpoints

```
GET    /api/user/:username           # Get user profile & analytics
POST   /api/user/:username/refresh   # Force refresh user data
GET    /api/user/:username/posts     # Get user posts
GET    /api/user/:username/analytics # Get detailed analytics
GET    /api/search                   # Search users
```

## 🎨 UI Components

- **Dashboard:** Main analytics view
- **ProfileCard:** User profile summary
- **PostsGrid:** Instagram posts display
- **AnalyticsCharts:** Engagement metrics
- **SearchBar:** Username search
- **LoadingStates:** Skeleton loaders
- **ErrorBoundary:** Error handling

## 🚀 Development Workflow

1. **Setup:** Clone repo, install dependencies
2. **Database:** Start MongoDB locally/Docker
3. **Backend:** Run Express server on port 5000
4. **Frontend:** Run Vite dev server on port 3000
5. **Testing:** Run test suites
6. **Build:** Create production builds
7. **Deploy:** Docker containers to cloud

## 📦 Key Dependencies

### Backend Dependencies:
```json
{
  "express": "^4.18.0",
  "mongoose": "^8.0.0",
  "axios": "^1.6.0",
  "jsonwebtoken": "^9.0.0",
  "bcryptjs": "^2.4.3",
  "joi": "^17.11.0",
  "winston": "^3.11.0",
  "cors": "^2.8.5",
  "helmet": "^7.1.0",
  "compression": "^1.7.4"
}
```

### Frontend Dependencies:
```json
{
  "react": "^18.2.0",
  "vite": "^5.0.0",
  "tailwindcss": "^3.3.0",
  "react-router-dom": "^6.20.0",
  "axios": "^1.6.0",
  "chart.js": "^4.4.0",
  "react-chartjs-2": "^5.2.0",
  "@headlessui/react": "^1.7.0",
  "lucide-react": "^0.300.0"
}
```