import { ChartBarIcon, UserGroupIcon, PhotoIcon, PlayIcon } from '@heroicons/react/24/outline';
import SearchBar from './SearchBar';
import Card from './ui/Card';

// Instagram Icon Component
const InstagramIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const LandingPage = ({ onUserSearch, error }) => {
  const handleSearch = async (username) => {
    onUserSearch(username);
  };

  const features = [
    {
      icon: <ChartBarIcon className="h-8 w-8" />,
      title: "Advanced Analytics",
      description: "Get deep insights into engagement patterns, audience behavior, and content performance"
    },
    {
      icon: <UserGroupIcon className="h-8 w-8" />,
      title: "Audience Insights",
      description: "Understand your followers' demographics, locations, and optimal posting times"
    },
    {
      icon: <PhotoIcon className="h-8 w-8" />,
      title: "Content Analysis",
      description: "AI-powered analysis of posts and reels with automatic keyword generation and vibe detection"
    },
    {
      icon: <PlayIcon className="h-8 w-8" />,
      title: "Video Intelligence",
      description: "Advanced video analysis for reels including object detection and ambience classification"
    }
  ];

  const stats = [
    { label: "Users Analyzed", value: "50K+", color: "text-purple-400" },
    { label: "Posts Processed", value: "2M+", color: "text-blue-400" },
    { label: "AI Tags Generated", value: "10M+", color: "text-green-400" },
    { label: "Accuracy Rate", value: "94%", color: "text-yellow-400" }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/40 via-black to-gray-900/40"></div>
        <div className="relative z-10">
          <div className="container mx-auto px-4 py-16">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text">
                  <InstagramIcon className="w-16 h-16 text-purple-400" />
                </div>
                <h1 className="text-6xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-300 bg-clip-text text-transparent">
                  Instagram Analytics
                </h1>
              </div>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Unlock powerful insights from Instagram profiles with AI-powered analysis,
                engagement metrics, and audience intelligence
              </p>

              <SearchBar onSearch={handleSearch} />

              {error && (
                <div className="mt-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm">
                    {error}
                  </p>
                </div>
              )}

              <div className="mt-8 flex items-center justify-center gap-2">
                <InstagramIcon className="w-4 h-4 text-purple-400" />
                <p className="text-gray-400 text-sm">
                  Try searching for: <span className="text-purple-400">cristiano</span>, <span className="text-purple-400">selenagomez</span>, or <span className="text-purple-400">therock</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 mb-16">
              {stats.map((stat, index) => (
                <Card key={index} className="text-center" hover={false}>
                  <div className={`text-3xl font-bold mb-2 ${stat.color}`}>
                    {stat.value}
                  </div>
                  <div className="text-gray-400 text-sm">
                    {stat.label}
                  </div>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 mb-16">
              {features.map((feature, index) => (
                <Card key={index} gradient className="text-center group">
                  <div className="text-purple-400 mb-4 group-hover:text-purple-300 transition-colors flex justify-center">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-white">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                    {feature.description}
                  </p>
                </Card>
              ))}
            </div>

            <Card gradient className="text-center">
              <h2 className="text-3xl font-bold mb-4 text-white">
                How It Works
              </h2>
              <div className="grid md:grid-cols-3 gap-8 mt-8">
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto text-white font-bold text-xl">
                    1
                  </div>
                  <h3 className="text-xl font-semibold text-white flex items-center justify-center gap-2">
                    <InstagramIcon className="w-5 h-5 text-purple-400" />
                    Enter Username
                  </h3>
                  <p className="text-gray-400">Simply enter any public Instagram username in the search bar</p>
                </div>
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto text-white font-bold text-xl">
                    2
                  </div>
                  <h3 className="text-xl font-semibold text-white">AI Analysis</h3>
                  <p className="text-gray-400">Our AI analyzes posts, reels, and engagement patterns</p>
                </div>
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-purple-500 rounded-full flex items-center justify-center mx-auto text-white font-bold text-xl">
                    3
                  </div>
                  <h3 className="text-xl font-semibold text-white">Get Insights</h3>
                  <p className="text-gray-400">Receive detailed analytics and actionable insights</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;