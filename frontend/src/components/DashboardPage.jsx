import { ArrowLeftIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useSelector, useDispatch } from 'react-redux';
import SearchBar from './SearchBar';
import ProfileHeader from './ProfileHeader';
import AnalyticsCharts from './AnalyticsCharts';
import PostsGrid from './PostsGrid';
import ReelsGrid from './ReelsGrid';
import Button from './ui/Button';
import { refreshUserData } from '../store/slices/userSlice';

const DashboardPage = ({ onBackToHome, onNewSearch }) => {
  const dispatch = useDispatch();
  const { profile, posts, reels, loading, currentUser } = useSelector((state) => state.user);

  // Debug logging
  console.log('🔍 DashboardPage Debug:', {
    reduxState: { profile: profile?.username, posts, reels, loading, currentUser },
    postsLength: posts?.length,
    reelsLength: reels?.length,
    profileExists: !!profile
  });

  const handleRefresh = () => {
    if (currentUser) {
      dispatch(refreshUserData(currentUser));
    }
  };

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

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-400">
                Analyzing: <span className="text-purple-400 font-medium">@{profile.username}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center space-x-2"
              >
                <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
            </div>
          </div>
          <SearchBar onSearch={onNewSearch} placeholder="Search another user..." />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-12">
        {/* Profile Section */}
        <ProfileHeader profile={profile || {}} />

        {/* Analytics Section */}
        <AnalyticsCharts profile={profile || {}} posts={posts || []} reels={reels || []} />

        {/* Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Posts Section */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">
              Recent Posts ({posts?.length || 0})
            </h2>
            <PostsGrid posts={posts || []} />
          </div>

          {/* Reels Section */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">
              Recent Reels ({reels?.length || 0})
            </h2>
            <ReelsGrid reels={reels || []} />
          </div>
        </div>
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