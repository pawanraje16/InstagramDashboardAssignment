import { CheckBadgeIcon, HeartIcon, ChatBubbleLeftIcon, PhotoIcon, EyeIcon } from '@heroicons/react/24/solid';
import Card from './ui/Card';

const ProfileHeader = ({ profile }) => {
  const formatNumber = (num) => {
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
      value: formatNumber(profile.totalPosts),
      icon: <PhotoIcon className="h-6 w-6" />,
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      label: 'Total Likes',
      value: formatNumber(profile.totalLikes),
      icon: <HeartIcon className="h-6 w-6" />,
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      label: 'Total Comments',
      value: formatNumber(profile.totalComments),
      icon: <ChatBubbleLeftIcon className="h-6 w-6" />,
      gradient: 'from-yellow-500 to-orange-500'
    },
    {
      label: 'Total Views',
      value: formatNumber(profile.totalViews || 0),
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
              <img
                src={profile.profileImage}
                alt={profile.displayName}
                className="w-32 h-32 rounded-full border-4 border-gray-700 shadow-xl"
              />
              {profile.isVerified && (
                <CheckBadgeIcon className="absolute -bottom-2 -right-2 h-8 w-8 text-blue-500 bg-black rounded-full" />
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {profile.displayName}
                </h1>
                <p className="text-purple-400 text-lg">@{profile.username}</p>
              </div>

              <p className="text-gray-300 text-lg leading-relaxed max-w-2xl">
                {profile.bio}
              </p>

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center space-x-2 bg-gray-800/50 px-4 py-2 rounded-full">
                  <span className="text-gray-400">Avg Likes:</span>
                  <span className="text-green-400 font-semibold">{formatNumber(profile.avgLikes)}</span>
                </div>
                <div className="flex items-center space-x-2 bg-gray-800/50 px-4 py-2 rounded-full">
                  <span className="text-gray-400">Avg Comments:</span>
                  <span className="text-blue-400 font-semibold">{formatNumber(profile.avgComments)}</span>
                </div>
                <div className="flex items-center space-x-2 bg-gray-800/50 px-4 py-2 rounded-full">
                  <span className="text-gray-400">Engagement Rate:</span>
                  <span className="text-purple-400 font-semibold">{profile.engagementRate}%</span>
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