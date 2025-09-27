import { useState } from 'react';
import { XMarkIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

const InstagramViewer = ({ isOpen, onClose, post, type = 'post' }) => {
  if (!isOpen || !post) return null;

  const instagramUrl = type === 'reel'
    ? `https://instagram.com/reel/${post.shortcode}`
    : `https://instagram.com/p/${post.shortcode}`;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-gray-900 rounded-2xl max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-700">
          <h3 className="text-base sm:text-lg font-semibold text-white">
            Instagram {type === 'reel' ? 'Reel' : 'Post'}
          </h3>
          <div className="flex items-center space-x-2">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 sm:space-x-2 bg-purple-600 hover:bg-purple-700 px-2 sm:px-3 py-2 rounded-lg text-white text-xs sm:text-sm font-medium transition-colors"
            >
              <span className="hidden sm:inline">Open on Instagram</span>
              <span className="sm:hidden">Open</span>
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            </a>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
          {/* Instagram Embed */}
          <div className={`w-full mx-auto bg-gray-800 rounded-lg overflow-hidden ${
            type === 'reel'
              ? 'aspect-[9/16] max-w-sm sm:max-w-md'
              : 'aspect-square max-w-md sm:max-w-lg'
          }`}>
            <iframe
              src={`https://www.instagram.com/p/${post.shortcode}/embed`}
              className="w-full h-full"
              frameBorder="0"
              scrolling="no"
              allowTransparency="true"
              loading="lazy"
            />
          </div>

          {/* Post Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Stats */}
            <div className="space-y-4">
              <h4 className="text-white font-medium text-sm sm:text-base">Engagement Stats</h4>
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div className="bg-gray-800 p-3 sm:p-4 rounded-lg text-center">
                  <div className="text-lg sm:text-2xl font-bold text-red-400">{post.likes?.toLocaleString() || 0}</div>
                  <div className="text-gray-400 text-xs sm:text-sm">Likes</div>
                </div>
                <div className="bg-gray-800 p-3 sm:p-4 rounded-lg text-center">
                  <div className="text-lg sm:text-2xl font-bold text-blue-400">{post.comments?.toLocaleString() || 0}</div>
                  <div className="text-gray-400 text-xs sm:text-sm">Comments</div>
                </div>
                {type === 'reel' && post.views && (
                  <div className="bg-gray-800 p-3 sm:p-4 rounded-lg text-center col-span-2">
                    <div className="text-lg sm:text-2xl font-bold text-green-400">{post.views?.toLocaleString()}</div>
                    <div className="text-gray-400 text-xs sm:text-sm">Views</div>
                  </div>
                )}
              </div>
            </div>

            {/* Caption & Details */}
            <div className="space-y-4">
              <h4 className="text-white font-medium text-sm sm:text-base">Post Details</h4>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-400 text-xs sm:text-sm">Type:</span>
                  <span className="text-white ml-2 capitalize">{post.media_type || type}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-xs sm:text-sm">Posted:</span>
                  <span className="text-white ml-2">
                    {post.posted_at ? new Date(post.posted_at).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
                {post.caption && (
                  <div>
                    <span className="text-gray-400 text-xs sm:text-sm block mb-2">Caption:</span>
                    <div className="bg-gray-800 p-3 rounded-lg text-white text-xs sm:text-sm max-h-24 sm:max-h-32 overflow-y-auto">
                      {post.caption}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstagramViewer;