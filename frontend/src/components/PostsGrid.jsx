import { HeartIcon, ChatBubbleLeftIcon, EyeIcon, ShareIcon, PlayIcon, MapPinIcon, TagIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid, ChatBubbleLeftIcon as ChatSolid } from '@heroicons/react/24/solid';
import Card from './ui/Card';

const PostsGrid = ({ posts }) => {
  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getVibeColor = (vibe) => {
    const vibeColors = {
      'serene': 'text-blue-400 bg-blue-400/10',
      'energetic': 'text-orange-400 bg-orange-400/10',
      'cozy': 'text-yellow-400 bg-yellow-400/10',
      'adventurous': 'text-green-400 bg-green-400/10',
      'relaxed': 'text-purple-400 bg-purple-400/10',
      'vibrant': 'text-pink-400 bg-pink-400/10',
      'meditative': 'text-indigo-400 bg-indigo-400/10',
      'homely': 'text-amber-400 bg-amber-400/10'
    };
    return vibeColors[vibe] || 'text-gray-400 bg-gray-400/10';
  };

  const getQualityColor = (quality) => {
    const qualityColors = {
      'excellent': 'text-green-400',
      'great': 'text-blue-400',
      'good': 'text-yellow-400',
      'fair': 'text-orange-400',
      'poor': 'text-red-400'
    };
    return qualityColors[quality] || 'text-gray-400';
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">Recent Posts & Reels</h2>
        <p className="text-gray-400">Latest content with AI-powered analysis and engagement metrics</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Card key={post.id} className="group overflow-hidden">
            <div className="relative mb-4">
              <img
                src={post.type === 'reel' ? post.thumbnail : post.image}
                alt={`Post ${post.id}`}
                className="w-full h-64 object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
              />

              {post.type === 'reel' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl">
                  <PlayIcon className="h-12 w-12 text-white" />
                </div>
              )}

              <div className="absolute top-4 left-4">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  post.type === 'reel'
                    ? 'bg-purple-600/80 text-white'
                    : 'bg-blue-600/80 text-white'
                }`}>
                  {post.type === 'reel' ? 'REEL' : 'POST'}
                </span>
              </div>

              <div className="absolute top-4 right-4 text-xs text-gray-300 bg-black/60 px-2 py-1 rounded-md">
                {formatDate(post.timestamp)}
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-gray-300 text-sm line-clamp-2 leading-relaxed">
                {post.caption}
              </p>

              {post.location && (
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <MapPinIcon className="h-4 w-4" />
                  <span>{post.location}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <HeartSolid className="h-4 w-4 text-red-500" />
                    <span className="text-gray-300">{formatNumber(post.likes)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <ChatSolid className="h-4 w-4 text-blue-500" />
                    <span className="text-gray-300">{formatNumber(post.comments)}</span>
                  </div>
                  {post.views && (
                    <div className="flex items-center space-x-1">
                      <EyeIcon className="h-4 w-4 text-green-500" />
                      <span className="text-gray-300">{formatNumber(post.views)}</span>
                    </div>
                  )}
                  {post.shares && (
                    <div className="flex items-center space-x-1">
                      <ShareIcon className="h-4 w-4 text-purple-500" />
                      <span className="text-gray-300">{formatNumber(post.shares)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-gray-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Vibe & Ambience</span>
                  <div className="flex space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-md ${getVibeColor(post.vibe)}`}>
                      {post.vibe}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-md ${getVibeColor(post.ambience)}`}>
                      {post.ambience}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-gray-500 mb-2 block">Generated Keywords</span>
                  <div className="flex flex-wrap gap-1">
                    {post.generatedKeywords.map((keyword, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded-md">
                        #{keyword}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-xs text-gray-500 mb-2 block">Quality Indicators</span>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className={`font-medium ${getQualityColor(post.qualityIndicator.lighting)}`}>
                        {post.qualityIndicator.lighting}
                      </div>
                      <div className="text-gray-500">Lighting</div>
                    </div>
                    <div className="text-center">
                      <div className={`font-medium ${getQualityColor(post.qualityIndicator.composition)}`}>
                        {post.qualityIndicator.composition}
                      </div>
                      <div className="text-gray-500">Composition</div>
                    </div>
                    <div className="text-center">
                      <div className={`font-medium ${getQualityColor(post.qualityIndicator.clarity)}`}>
                        {post.qualityIndicator.clarity}
                      </div>
                      <div className="text-gray-500">Clarity</div>
                    </div>
                  </div>
                </div>

                {post.tags.length > 0 && (
                  <div>
                    <span className="text-xs text-gray-500 mb-2 block">Tags</span>
                    <div className="flex flex-wrap gap-1">
                      {post.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-purple-900/30 text-purple-300 text-xs rounded-md">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {post.mentionedUsers.length > 0 && (
                  <div>
                    <span className="text-xs text-gray-500 mb-2 block">Mentions</span>
                    <div className="flex flex-wrap gap-1">
                      {post.mentionedUsers.map((user, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-900/30 text-blue-300 text-xs rounded-md">
                          {user}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PostsGrid;