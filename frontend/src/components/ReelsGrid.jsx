import { useState } from 'react';
import { HeartIcon, ChatBubbleLeftIcon, EyeIcon, PlayIcon } from '@heroicons/react/24/outline';
import Card from './ui/Card';
import InstagramViewer from './InstagramViewer';
import { getProxiedImageUrl } from '../utils/imageProxy';

const ReelsGrid = ({ reels }) => {
  const [selectedReel, setSelectedReel] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const handleImageError = (e) => {
    // Hide broken image and show fallback
    e.target.style.display = 'none';
    e.target.nextElementSibling.style.display = 'flex';
  };

  const openViewer = (reel) => {
    setSelectedReel(reel);
    setViewerOpen(true);
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setSelectedReel(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTagColor = (tag) => {
    const tagColors = {
      'dance': 'text-pink-400 bg-pink-400/10',
      'music': 'text-purple-400 bg-purple-400/10',
      'food': 'text-orange-400 bg-orange-400/10',
      'travel': 'text-blue-400 bg-blue-400/10',
      'fitness': 'text-green-400 bg-green-400/10',
      'fashion': 'text-yellow-400 bg-yellow-400/10',
      'comedy': 'text-red-400 bg-red-400/10',
      'education': 'text-indigo-400 bg-indigo-400/10'
    };
    return tagColors[tag] || 'text-gray-400 bg-gray-400/10';
  };

  if (!reels || reels.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="text-gray-400">
          <PlayIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No reels found</p>
          <p className="text-sm">This user hasn't posted any reels yet</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {reels.map((reel, index) => (
        <Card key={reel.shortcode || index} className="group hover:bg-gray-800/50 transition-colors duration-200">
          {/* Reel Thumbnail Preview */}
          <div className="relative aspect-[9/16] rounded-lg overflow-hidden mb-4 group cursor-pointer" onClick={() => openViewer(reel)}>
            {/* Instagram Reel Thumbnail */}
            {reel.thumbnail_url || reel.display_url ? (
              <img
                src={getProxiedImageUrl(reel.thumbnail_url || reel.display_url, reel.display_url_cloudinary)}
                alt="Instagram reel"
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-pink-600 via-purple-600 to-indigo-600 flex items-center justify-center">
                <PlayIcon className="h-20 w-20 text-white/90" />
              </div>
            )}

            {/* Fallback for broken images */}
            <div className="hidden w-full h-full bg-gradient-to-br from-pink-600 via-purple-600 to-indigo-600 flex-col items-center justify-center text-white">
              <PlayIcon className="h-20 w-20 text-white/90 mb-2" />
              <span className="text-sm font-medium opacity-90">Instagram Reel</span>
            </div>

            {/* Play Button Overlay */}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/60 transition-all duration-200 flex items-center justify-center">
              <div className="text-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <PlayIcon className="h-12 w-12 mx-auto mb-1" />
                <span className="text-xs font-medium">Play Reel</span>
              </div>
            </div>

            {/* Duration Badge */}
            {reel.duration && (
              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs text-white font-medium">
                {formatDuration(reel.duration)}
              </div>
            )}

            {/* View on Instagram Button */}
            <a
              href={`https://instagram.com/reel/${reel.shortcode}`}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-white transition-all duration-200 hover:scale-105 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              View ↗
            </a>

            {/* Engagement Stats Overlay */}
            <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-sm rounded px-2 py-1 flex justify-between text-xs text-white">
              <span>❤ {formatNumber(reel.likes || 0)}</span>
              <span>👁 {formatNumber(reel.views || 0)}</span>
            </div>
          </div>

          {/* Reel Content */}
          <div className="space-y-3">
            {/* Caption */}
            {reel.caption && (
              <p className="text-white text-sm line-clamp-2">
                {reel.caption}
              </p>
            )}

            {/* Engagement Stats */}
            <div className="flex items-center justify-between text-gray-400 text-sm">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <HeartIcon className="h-4 w-4" />
                  <span>{formatNumber(reel.likes || 0)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <ChatBubbleLeftIcon className="h-4 w-4" />
                  <span>{formatNumber(reel.comments || 0)}</span>
                </div>
                {reel.views && (
                  <div className="flex items-center space-x-1">
                    <EyeIcon className="h-4 w-4" />
                    <span>{formatNumber(reel.views)}</span>
                  </div>
                )}
              </div>
              <span className="text-xs">
                {reel.posted_at ? formatDate(reel.posted_at) : 'Unknown date'}
              </span>
            </div>

            {/* Hashtags */}
            {reel.hashtags && reel.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {reel.hashtags.slice(0, 3).map((hashtag, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2 py-1 bg-blue-400/10 text-blue-400 rounded"
                  >
                    #{hashtag}
                  </span>
                ))}
                {reel.hashtags.length > 3 && (
                  <span className="text-xs px-2 py-1 bg-gray-400/10 text-gray-400 rounded">
                    +{reel.hashtags.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Content Tags */}
            {reel.tags && reel.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {reel.tags.slice(0, 2).map((tag, idx) => (
                  <span
                    key={idx}
                    className={`text-xs px-2 py-1 rounded ${getTagColor(tag)}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Card>
      ))}

      {/* Instagram Viewer Modal */}
      <InstagramViewer
        isOpen={viewerOpen}
        onClose={closeViewer}
        post={selectedReel}
        type="reel"
      />
    </div>
  );
};

export default ReelsGrid;