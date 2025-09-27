import { ChartBarIcon, UserGroupIcon, PhotoIcon, PlayIcon } from '@heroicons/react/24/outline';
import SearchBar from './SearchBar';
import Card from './ui/Card';

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
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20"></div>
        <div className="relative z-10">
          <div className="container mx-auto px-4 py-16">
            <div className="text-center mb-16">
              <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-blue-400 to-green-400 bg-clip-text text-transparent">
                Instagram Analytics
              </h1>
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

              <div className="mt-8">
                <p className="text-gray-400 text-sm">
                  Try searching for: <span className="text-purple-400">cristiano</span>, <span className="text-purple-400">selenagomez</span>, or <span className="text-purple-400">therock</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
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

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
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
                  <h3 className="text-xl font-semibold text-white">Enter Username</h3>
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