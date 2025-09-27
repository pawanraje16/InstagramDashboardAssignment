import { CheckBadgeIcon, HeartIcon, ChatBubbleLeftIcon, PhotoIcon, EyeIcon, UserIcon } from '@heroicons/react/24/solid';
import Card from './ui/Card';
import { getProxiedImageUrl } from '../utils/imageProxy';

const ProfileHeader = ({ profile }) => {
  const handleImageError = (e) => {
    // Replace broken image with fallback
    e.target.style.display = 'none';
    e.target.nextElementSibling.style.display = 'flex';
  };
  const formatNumber = (num) => {
    if (!num && num !== 0) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const statCards = [
    {
      label: 'Followers',
      value: formatNumber(profile.followers),
      icon: <HeartIcon className="h-6 w-6" />,
      gradient: 'from-pink-500 to-rose-500'
    },
    {
      label: 'Following',
      value: formatNumber(profile.following),
      icon: <HeartIcon className="h-6 w-6" />,
      gradient: 'from-purple-500 to-violet-500'
    },
    {
      label: 'Total Posts',
      value: formatNumber(profile.posts_count),
      icon: <PhotoIcon className="h-6 w-6" />,
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      label: 'Avg Likes',
      value: formatNumber(profile.avg_likes),
      icon: <HeartIcon className="h-6 w-6" />,
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      label: 'Avg Comments',
      value: formatNumber(profile.avg_comments),
      icon: <ChatBubbleLeftIcon className="h-6 w-6" />,
      gradient: 'from-yellow-500 to-orange-500'
    },
    {
      label: 'Engagement Rate',
      value: `${formatNumber(profile.engagement_rate)}%`,
      icon: <EyeIcon className="h-6 w-6" />,
      gradient: 'from-indigo-500 to-purple-500'
    }
  ];

  return (
    <div className="space-y-8">
      <Card gradient className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-blue-600/10"></div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
            <div className="relative">
              {profile.profile_pic_url ? (
                <>
                  <img
                    src={getProxiedImageUrl(profile.profile_pic_url, profile.profile_pic_cloudinary)}
                    alt={profile.full_name}
                    className="w-32 h-32 rounded-full border-4 border-gray-700 shadow-xl"
                    onError={handleImageError}
                  />
                  <div className="w-32 h-32 rounded-full border-4 border-gray-700 shadow-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center hidden">
                    <UserIcon className="h-16 w-16 text-white/80" />
                  </div>
                </>
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-gray-700 shadow-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <UserIcon className="h-16 w-16 text-white/80" />
                </div>
              )}
              {profile.is_verified && (
                <CheckBadgeIcon className="absolute -bottom-2 -right-2 h-8 w-8 text-blue-500 bg-black rounded-full" />
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {profile.full_name}
                </h1>
                <p className="text-purple-400 text-lg">@{profile.username}</p>
              </div>

              {profile.bio && (
                <p className="text-gray-300 text-lg leading-relaxed max-w-2xl">
                  {profile.bio}
                </p>
              )}

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center space-x-2 bg-gray-800/50 px-4 py-2 rounded-full">
                  <span className="text-gray-400">Avg Likes:</span>
                  <span className="text-green-400 font-semibold">{formatNumber(profile.avg_likes)}</span>
                </div>
                <div className="flex items-center space-x-2 bg-gray-800/50 px-4 py-2 rounded-full">
                  <span className="text-gray-400">Avg Comments:</span>
                  <span className="text-blue-400 font-semibold">{formatNumber(profile.avg_comments)}</span>
                </div>
                <div className="flex items-center space-x-2 bg-gray-800/50 px-4 py-2 rounded-full">
                  <span className="text-gray-400">Engagement Rate:</span>
                  <span className="text-purple-400 font-semibold">{formatNumber(profile.engagement_rate)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="text-center group hover:scale-105 transition-transform duration-200">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${stat.gradient} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200`}>
              <div className="text-white">
                {stat.icon}
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-2">
              {stat.value}
            </div>
            <div className="text-gray-400 text-sm">
              {stat.label}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProfileHeader;