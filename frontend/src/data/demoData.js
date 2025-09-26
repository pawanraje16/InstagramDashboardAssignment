export const demoUserData = {
  profile: {
    username: "john_photographer",
    displayName: "John Smith",
    bio: "Professional photographer 📸 | Travel enthusiast ✈️ | Coffee lover ☕",
    profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    isVerified: true,
    followers: 125430,
    following: 892,
    totalPosts: 1247,
    totalLikes: 2856742,
    totalComments: 89324,
    totalViews: 8924531,
    avgLikes: 2291,
    avgComments: 72,
    engagementRate: 4.8
  },

  analytics: {
    likesVsComments: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      likes: [245000, 289000, 312000, 298000, 335000, 356000],
      comments: [8200, 9100, 9800, 9400, 10200, 11000],
      views: [1200000, 1450000, 1580000, 1420000, 1680000, 1890000]
    },
    engagementTrend: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      engagement: [4.2, 4.8, 5.1, 4.9]
    },
    postPerformance: {
      labels: ['Photos', 'Reels', 'Carousels'],
      data: [55, 35, 10]
    }
  },

  recentPosts: [
    {
      id: 1,
      type: "reel",
      thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop",
      videoUrl: "https://example.com/reel1.mp4",
      caption: "Golden hour magic in the mountains ✨ #landscape #photography",
      likes: 8247,
      comments: 189,
      views: 45230,
      shares: 67,
      location: "Swiss Alps, Switzerland",
      tags: ["landscape", "mountains", "golden hour"],
      mentionedUsers: ["@alpine_adventures"],
      generatedKeywords: ["outdoor", "nature", "scenic"],
      vibe: "serene",
      ambience: "peaceful",
      qualityIndicator: {
        lighting: "excellent",
        composition: "great",
        clarity: "high"
      },
      timestamp: "2024-01-15T14:30:00Z"
    },
    {
      id: 2,
      type: "image",
      image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=400&fit=crop",
      caption: "Street photography vibes in Tokyo 🏙️ #street #urban",
      likes: 2891,
      comments: 156,
      location: "Shibuya, Tokyo",
      tags: ["street", "urban", "city"],
      mentionedUsers: [],
      generatedKeywords: ["urban", "nightlife", "neon"],
      vibe: "energetic",
      ambience: "vibrant",
      qualityIndicator: {
        lighting: "good",
        composition: "excellent",
        clarity: "high"
      },
      timestamp: "2024-01-14T19:45:00Z"
    },
    {
      id: 3,
      type: "reel",
      thumbnail: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=400&fit=crop",
      videoUrl: "https://example.com/reel3.mp4",
      caption: "Morning coffee brewing process ☕ Perfect start to the day",
      likes: 3967,
      comments: 167,
      views: 28450,
      shares: 89,
      location: "Local Café, NYC",
      tags: ["coffee", "morning", "lifestyle"],
      mentionedUsers: ["@localcafenyc"],
      generatedKeywords: ["indoor", "food", "lifestyle"],
      vibe: "cozy",
      ambience: "intimate",
      qualityIndicator: {
        lighting: "warm",
        composition: "good",
        clarity: "high"
      },
      timestamp: "2024-01-13T08:15:00Z"
    },
    {
      id: 4,
      type: "image",
      image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=400&fit=crop",
      caption: "Lost in nature 🌲 Sometimes you need to disconnect to reconnect",
      likes: 4156,
      comments: 203,
      location: "Pacific Northwest",
      tags: ["nature", "forest", "hiking"],
      mentionedUsers: [],
      generatedKeywords: ["outdoor", "forest", "adventure"],
      vibe: "adventurous",
      ambience: "mystical",
      qualityIndicator: {
        lighting: "natural",
        composition: "excellent",
        clarity: "high"
      },
      timestamp: "2024-01-12T16:20:00Z"
    },
    {
      id: 5,
      type: "reel",
      thumbnail: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=400&fit=crop",
      videoUrl: "https://example.com/reel5.mp4",
      caption: "Sunset beach timelapse 🏖️ Watch the magic unfold",
      likes: 9234,
      comments: 287,
      views: 67840,
      shares: 156,
      location: "Malibu Beach, CA",
      tags: ["beach", "sunset", "ocean", "timelapse"],
      mentionedUsers: [],
      generatedKeywords: ["outdoor", "beach", "sunset"],
      vibe: "relaxed",
      ambience: "romantic",
      qualityIndicator: {
        lighting: "golden",
        composition: "great",
        clarity: "high"
      },
      timestamp: "2024-01-11T18:30:00Z"
    },
    {
      id: 6,
      type: "image",
      image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=400&fit=crop",
      caption: "Homemade pasta night 🍝 Nothing beats fresh ingredients",
      likes: 2456,
      comments: 98,
      location: "Home Kitchen",
      tags: ["food", "cooking", "homemade"],
      mentionedUsers: [],
      generatedKeywords: ["indoor", "food", "cooking"],
      vibe: "homely",
      ambience: "warm",
      qualityIndicator: {
        lighting: "warm",
        composition: "good",
        clarity: "high"
      },
      timestamp: "2024-01-10T19:00:00Z"
    },
    {
      id: 7,
      type: "reel",
      thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop",
      videoUrl: "https://example.com/reel7.mp4",
      caption: "City lights come alive at night ✨ #cityvibes",
      likes: 6789,
      comments: 234,
      views: 42350,
      shares: 123,
      location: "Downtown NYC",
      tags: ["city", "night", "lights"],
      mentionedUsers: [],
      generatedKeywords: ["urban", "nightlife", "cityscape"],
      vibe: "vibrant",
      ambience: "electric",
      qualityIndicator: {
        lighting: "dramatic",
        composition: "excellent",
        clarity: "high"
      },
      timestamp: "2024-01-09T21:30:00Z"
    },
    {
      id: 8,
      type: "image",
      image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=400&fit=crop",
      caption: "Forest therapy session 🌿 #mindfulness #nature",
      likes: 3421,
      comments: 145,
      location: "Redwood National Park",
      tags: ["nature", "mindfulness", "forest"],
      mentionedUsers: [],
      generatedKeywords: ["outdoor", "nature", "peaceful"],
      vibe: "meditative",
      ambience: "tranquil",
      qualityIndicator: {
        lighting: "natural",
        composition: "great",
        clarity: "high"
      },
      timestamp: "2024-01-08T10:15:00Z"
    }
  ],

  audienceData: {
    demographics: {
      ageGroups: {
        labels: ['18-24', '25-34', '35-44', '45-54', '55+'],
        data: [25, 35, 20, 15, 5]
      },
      gender: {
        labels: ['Male', 'Female', 'Other'],
        data: [45, 52, 3]
      },
      topLocations: [
        { country: 'United States', percentage: 42 },
        { country: 'Canada', percentage: 18 },
        { country: 'United Kingdom', percentage: 12 },
        { country: 'Australia', percentage: 8 },
        { country: 'Germany', percentage: 7 }
      ]
    },
    engagement: {
      bestPostTimes: ['6-8 AM', '12-2 PM', '6-9 PM'],
      mostActiveDay: 'Wednesday',
      avgSessionDuration: '2m 34s'
    }
  }
};