import { useState } from 'react';
import { XMarkIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

const InstagramViewer = ({ isOpen, onClose, post, type = 'post' }) => {
  if (!isOpen || !post) return null;

  const instagramUrl = type === 'reel'
    ? `https://instagram.com/reel/${post.shortcode}`
    : `https://instagram.com/p/${post.shortcode}`;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">
            Instagram {type === 'reel' ? 'Reel' : 'Post'}
          </h3>
          <div className="flex items-center space-x-2">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded-lg text-white text-sm font-medium transition-colors"
            >
              <span>Open on Instagram</span>
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
        <div className="p-6 space-y-6">
          {/* Instagram Embed */}
          <div className="aspect-square max-w-lg mx-auto bg-gray-800 rounded-lg overflow-hidden">
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
          <div className="grid md:grid-cols-2 gap-6">
            {/* Stats */}
            <div className="space-y-4">
              <h4 className="text-white font-medium">Engagement Stats</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-400">{post.likes?.toLocaleString() || 0}</div>
                  <div className="text-gray-400 text-sm">Likes</div>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-400">{post.comments?.toLocaleString() || 0}</div>
                  <div className="text-gray-400 text-sm">Comments</div>
                </div>
                {type === 'reel' && post.views && (
                  <div className="bg-gray-800 p-4 rounded-lg text-center col-span-2">
                    <div className="text-2xl font-bold text-green-400">{post.views?.toLocaleString()}</div>
                    <div className="text-gray-400 text-sm">Views</div>
                  </div>
                )}
              </div>
            </div>

            {/* Caption & Details */}
            <div className="space-y-4">
              <h4 className="text-white font-medium">Post Details</h4>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-400 text-sm">Type:</span>
                  <span className="text-white ml-2 capitalize">{post.media_type || type}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Posted:</span>
                  <span className="text-white ml-2">
                    {post.posted_at ? new Date(post.posted_at).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
                {post.caption && (
                  <div>
                    <span className="text-gray-400 text-sm block mb-2">Caption:</span>
                    <div className="bg-gray-800 p-3 rounded-lg text-white text-sm max-h-32 overflow-y-auto">
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