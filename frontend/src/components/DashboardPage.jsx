import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import SearchBar from './SearchBar';
import ProfileHeader from './ProfileHeader';
import AnalyticsCharts from './AnalyticsCharts';
import PostsGrid from './PostsGrid';
import AudienceAnalytics from './AudienceAnalytics';
import Button from './ui/Button';

const DashboardPage = ({ userData, onBackToHome, onNewSearch }) => {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-gray-800 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToHome}
              className="flex items-center space-x-2"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>Back to Home</span>
            </Button>
            <div className="text-sm text-gray-400">
              Analyzing: <span className="text-purple-400 font-medium">@{userData.profile.username}</span>
            </div>
          </div>
          <SearchBar onSearch={onNewSearch} placeholder="Search another user..." />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-12">
        <ProfileHeader profile={userData.profile} />
        <AnalyticsCharts analytics={userData.analytics} />
        <PostsGrid posts={userData.recentPosts} />
        <AudienceAnalytics audienceData={userData.audienceData} />
      </div>

      <footer className="bg-gray-900/50 border-t border-gray-800 py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            Instagram Analytics Dashboard - Powered by AI
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Advanced insights for content creators and marketers
          </p>
        </div>
      </footer>
    </div>
  );
};

export default DashboardPage;