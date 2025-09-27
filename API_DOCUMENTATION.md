# Instagram Dashboard API Documentation

## Overview
This API provides endpoints to fetch Instagram influencer profile data, posts, reels, and analytics. The API automatically separates content into posts (images/carousels) and reels (videos) for optimized data handling.

## Base URL
```
http://localhost:8000/api
```

## Authentication
Currently, no authentication is required for public endpoints.

---

## Endpoints

### 1. Get User Profile (Basic Info)
Get basic profile information for an Instagram user.

**Endpoint:** `GET /user/{username}`

**Description:** Returns essential profile data including follower metrics and engagement analytics.

**Parameters:**
- `username` (string, required) - Instagram username (without @)

**Response:**
```json
{
  "status": "success",
  "data": {
    "username": "theboyfrom_maharashtra",
    "full_name": "User Full Name",
    "profile_pic_url": "https://instagram.com/profile.jpg",
    "followers": 150000,
    "following": 1200,
    "posts_count": 245,
    "is_verified": false,
    "engagement_rate": 3.8,
    "avg_likes": 2500,
    "avg_comments": 125
  },
  "message": "Profile data for @theboyfrom_maharashtra",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Example:**
```bash
curl http://localhost:8000/api/user/theboyfrom_maharashtra
```

---

### 2. Get User Posts
Get paginated list of user's posts (images and carousels only).

**Endpoint:** `GET /user/{username}/posts`

**Description:** Returns image and carousel posts with engagement metrics.

**Parameters:**
- `username` (string, required) - Instagram username
- `page` (number, optional) - Page number (default: 1)
- `limit` (number, optional) - Posts per page (default: 20, max: 50)
- `sortBy` (string, optional) - Sort field (default: '-posted_at')
  - Options: `-posted_at`, `posted_at`, `-likes`, `likes`, `-comments`, `comments`

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "type": "post",
      "shortcode": "ABC123XYZ",
      "media_type": "image",
      "caption": "Beautiful sunset at the beach! 🌅",
      "display_url": "https://instagram.com/image.jpg",
      "likes": 3420,
      "comments": 87,
      "posted_at": "2024-01-15T08:30:00Z"
    },
    {
      "type": "post",
      "media_type": "carousel",
      "shortcode": "DEF456ABC",
      "caption": "Weekend vibes with friends",
      "display_url": "https://instagram.com/carousel1.jpg",
      "likes": 2890,
      "comments": 156,
      "posted_at": "2024-01-14T16:45:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 87,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  },
  "message": "Posts for @theboyfrom_maharashtra"
}
```

**Example:**
```bash
curl "http://localhost:8000/api/user/theboyfrom_maharashtra/posts?page=1&limit=10&sortBy=-likes"
```

---

### 3. Get User Reels
Get paginated list of user's reels with extended metadata.

**Endpoint:** `GET /user/{username}/reels`

**Description:** Returns video reels with views, hashtags, tags, and engagement metrics.

**Parameters:**
- `username` (string, required) - Instagram username
- `page` (number, optional) - Page number (default: 1)
- `limit` (number, optional) - Reels per page (default: 20, max: 50)
- `sortBy` (string, optional) - Sort field (default: '-posted_at')
  - Options: `-posted_at`, `posted_at`, `-likes`, `likes`, `-comments`, `comments`, `-views`, `views`

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "type": "reel",
      "shortcode": "XYZ789ABC",
      "caption": "Dancing to the latest trend! 💃 #viral #dance",
      "display_url": "https://instagram.com/reel_thumb.jpg",
      "video_url": "https://instagram.com/reel_video.mp4",
      "likes": 15420,
      "comments": 892,
      "views": 125000,
      "hashtags": ["viral", "dance", "trending", "music"],
      "tags": ["dance", "music"],
      "posted_at": "2024-01-15T12:00:00Z",
      "duration": 28
    },
    {
      "type": "reel",
      "shortcode": "GHI123DEF",
      "caption": "Cooking my favorite recipe! 👨‍🍳 #food #recipe",
      "display_url": "https://instagram.com/cooking_thumb.jpg",
      "video_url": "https://instagram.com/cooking_video.mp4",
      "likes": 8750,
      "comments": 234,
      "views": 67000,
      "hashtags": ["food", "recipe", "cooking"],
      "tags": ["food", "recipe"],
      "posted_at": "2024-01-14T19:30:00Z",
      "duration": 45
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 34,
    "totalPages": 2,
    "hasNext": true,
    "hasPrev": false
  },
  "message": "Reels for @theboyfrom_maharashtra"
}
```

**Example:**
```bash
curl "http://localhost:8000/api/user/theboyfrom_maharashtra/reels?page=1&limit=5&sortBy=-views"
```

---

### 4. Get User Analytics
Get detailed analytics for a user's account.

**Endpoint:** `GET /user/{username}/analytics`

**Description:** Returns engagement metrics and performance analytics.

**Parameters:**
- `username` (string, required) - Instagram username

**Response:**
```json
{
  "status": "success",
  "data": {
    "engagement_rate": 3.8,
    "avg_likes": 2500,
    "avg_comments": 125
  },
  "message": "Analytics for @theboyfrom_maharashtra"
}
```

**Example:**
```bash
curl http://localhost:8000/api/user/theboyfrom_maharashtra/analytics
```

---

### 5. Refresh User Data
Force refresh user data from Instagram (subject to rate limits).

**Endpoint:** `POST /user/{username}/refresh`

**Description:** Fetches fresh data from Instagram and updates the database.

**Parameters:**
- `username` (string, required) - Instagram username

**Rate Limits:**
- Maximum 1 refresh every 4 hours per user

**Response:**
```json
{
  "status": "success",
  "data": {
    "username": "theboyfrom_maharashtra",
    "full_name": "User Full Name",
    "profile_pic_url": "https://instagram.com/profile.jpg",
    "followers": 150000,
    "following": 1200,
    "posts_count": 245,
    "is_verified": false,
    "engagement_rate": 3.8,
    "avg_likes": 2500,
    "avg_comments": 125
  },
  "message": "Profile refreshed for @theboyfrom_maharashtra"
}
```

**Error Response (Rate Limited):**
```json
{
  "status": "error",
  "message": "Rate limit exceeded. Next refresh available at 2024-01-15T16:30:00Z",
  "code": 429
}
```

**Example:**
```bash
curl -X POST http://localhost:8000/api/user/theboyfrom_maharashtra/refresh
```

---

### 6. Search Users
Search for users by username or full name.

**Endpoint:** `GET /users/search`

**Description:** Search for Instagram users in the database.

**Parameters:**
- `q` (string, required) - Search query (minimum 2 characters)
- `limit` (number, optional) - Number of results (default: 20, max: 100)

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "username": "theboyfrom_maharashtra",
      "full_name": "User Full Name",
      "profile_pic_url": "https://instagram.com/profile.jpg",
      "followers": 150000,
      "is_verified": false
    }
  ],
  "message": "Found 1 users matching \"maharashtra\""
}
```

**Example:**
```bash
curl "http://localhost:8000/api/users/search?q=maharashtra&limit=10"
```

---

## Data Models

### Post Object
```typescript
interface Post {
  type: "post";
  shortcode: string;
  media_type: "image" | "carousel";
  caption: string;
  display_url: string;
  likes: number;
  comments: number;
  posted_at: string; // ISO 8601 timestamp
}
```

### Reel Object
```typescript
interface Reel {
  type: "reel";
  shortcode: string;
  caption: string;
  display_url: string;    // Thumbnail
  video_url: string;      // Video file
  likes: number;
  comments: number;
  views: number;
  hashtags: string[];     // Extracted from caption
  tags: string[];         // Content categories
  posted_at: string;      // ISO 8601 timestamp
  duration: number;       // Duration in seconds
}
```

### Profile Object
```typescript
interface Profile {
  username: string;
  full_name: string;
  profile_pic_url: string;
  followers: number;
  following: number;
  posts_count: number;
  is_verified: boolean;
  engagement_rate: number;  // Percentage
  avg_likes: number;
  avg_comments: number;
}
```

---

## Error Handling

### Error Response Format
```json
{
  "status": "error",
  "message": "Error description",
  "code": 400,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Common Error Codes
- `400` - Bad Request (invalid parameters)
- `404` - User not found
- `429` - Rate limit exceeded
- `500` - Internal server error

---

## Rate Limits
- User data refresh: 1 request per 4 hours per user
- Other endpoints: No specific limits (subject to server capacity)

---

## Content Categories (Tags)
Reels are automatically tagged with content categories:
- `fashion`, `food`, `travel`, `fitness`, `beauty`, `lifestyle`
- `music`, `art`, `dance`, `comedy`, `tech`, `sports`, `nature`
- `motivation`, `education`, `business`, `diy`, `recipe`, `tutorial`

---

## Notes
1. **Data Consistency**: All endpoints return data from the database to ensure consistency
2. **Automatic Separation**: Posts and reels are automatically separated based on media type
3. **Caching**: Profile data is cached and refreshed periodically or on-demand
4. **Pagination**: Use pagination for large datasets to improve performance
5. **Rate Limiting**: Respect rate limits to avoid service disruption

---

## Support
For API support or questions, please refer to the project documentation or contact the development team.