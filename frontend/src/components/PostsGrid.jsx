import { useState } from 'react';
import { HeartIcon, ChatBubbleLeftIcon, PhotoIcon } from '@heroicons/react/24/outline';
import Card from './ui/Card';
import InstagramViewer from './InstagramViewer';
import { getProxiedImageUrl } from '../utils/imageProxy';

const PostsGrid = ({ posts }) => {
  const [selectedPost, setSelectedPost] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const openViewer = (post) => {
    setSelectedPost(post);
    setViewerOpen(true);
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setSelectedPost(null);
  };

  const handleImageError = (e) => {
    // Hide broken image and show fallback
    e.target.style.display = 'none';
    e.target.nextElementSibling.style.display = 'flex';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!posts || posts.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="text-gray-400">
          <PhotoIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No posts found</p>
          <p className="text-sm">This user hasn't posted any images or carousels yet</p>
          <div className="mt-4 p-2 bg-yellow-900/20 border border-yellow-600/30 rounded text-yellow-400 text-xs">
            Debug: posts={JSON.stringify(posts)}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {posts.map((post, index) => (
        <Card key={post.shortcode || index} className="group hover:bg-gray-800/50 transition-colors duration-200">
          {/* Post Thumbnail Preview */}
          <div className="relative aspect-square rounded-lg overflow-hidden mb-4 group cursor-pointer" onClick={() => openViewer(post)}>
            {/* Instagram Post Thumbnail */}
            {post.thumbnail_url || post.display_url ? (
              <img
                src={getProxiedImageUrl(post.thumbnail_url || post.display_url, post.display_url_cloudinary)}
                alt="Instagram post"
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-600 via-blue-600 to-green-600 flex items-center justify-center">
                <PhotoIcon className="h-16 w-16 text-white/90" />
              </div>
            )}

            {/* Fallback for broken images */}
            <div className="hidden w-full h-full bg-gradient-to-br from-purple-600 via-blue-600 to-green-600 flex-col items-center justify-center text-white">
              <PhotoIcon className="h-16 w-16 text-white/90 mb-2" />
              <span className="text-sm font-medium opacity-90">Instagram Post</span>
            </div>

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/60 transition-all duration-200 flex items-center justify-center">
              <div className="text-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <PhotoIcon className="h-8 w-8 mx-auto mb-1" />
                <span className="text-xs font-medium">View Post</span>
              </div>
            </div>

            {/* Media Type Badge */}
            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs text-white font-medium">
              {post.media_type?.toUpperCase() || 'POST'}
            </div>

            {/* View on Instagram Button */}
            <a
              href={`https://instagram.com/p/${post.shortcode}`}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-white transition-all duration-200 hover:scale-105 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              View ↗
            </a>

            {/* Engagement Stats Overlay */}
            <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-sm rounded px-2 py-1 flex justify-between text-xs text-white">
              <span>❤ {formatNumber(post.likes || 0)}</span>
              <span>💬 {formatNumber(post.comments || 0)}</span>
            </div>
          </div>

          {/* Post Content */}
          <div className="space-y-3">
            {/* Caption */}
            {post.caption && (
              <p className="text-white text-sm line-clamp-2">
                {post.caption}
              </p>
            )}

            {/* Engagement Stats */}
            <div className="flex items-center justify-between text-gray-400 text-sm">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <HeartIcon className="h-4 w-4" />
                  <span>{formatNumber(post.likes || 0)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <ChatBubbleLeftIcon className="h-4 w-4" />
                  <span>{formatNumber(post.comments || 0)}</span>
                </div>
              </div>
              <span className="text-xs">
                {post.posted_at ? formatDate(post.posted_at) : 'Unknown date'}
              </span>
            </div>
          </div>
        </Card>
      ))}

      {/* Instagram Viewer Modal */}
      <InstagramViewer
        isOpen={viewerOpen}
        onClose={closeViewer}
        post={selectedPost}
        type="post"
      />
    </div>
  );
};

export default PostsGrid;