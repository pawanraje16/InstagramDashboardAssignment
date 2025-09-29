import { useState } from 'react';
import { XMarkIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

const InstagramViewer = ({ isOpen, onClose, post, type = 'post' }) => {
  if (!isOpen || !post) return null;

  const instagramUrl = type === 'reel'
    ? `https://instagram.com/reel/${post.shortcode}`
    : `https://instagram.com/p/${post.shortcode}`;

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toLocaleString() || '0';
  };

  return (
    <>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
        .hide-scrollbar {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none; /* Chrome, Safari and Opera */
        }
        /* Hide scrollbars globally within the modal */
        .instagram-viewer * {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }
        .instagram-viewer *::-webkit-scrollbar {
          display: none; /* Chrome, Safari and Opera */
        }
        /* Force iframe to hide scrollbars but keep functionality */
        .instagram-iframe {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        .instagram-iframe::-webkit-scrollbar {
          display: none !important;
        }
      `}</style>
      <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
        <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-xl w-full max-w-lg h-[95vh] overflow-hidden flex flex-col shadow-2xl border border-gray-700/50 transform animate-slideUp instagram-viewer">
        {/* Attractive Header with Gradient */}
        <div className="relative flex items-center justify-between px-6 py-3 bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur border-b border-gray-600/30 flex-shrink-0">
          {/* Decorative gradient line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-50"></div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-3 h-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-ping opacity-20"></div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text font-bold text-sm">
                Instagram
              </div>
              <span className="px-2 py-1 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-400/20 rounded-full text-white text-xs font-medium">
                {type === 'reel' ? '🎬 Reel' : '📸 Post'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex items-center space-x-2 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600 px-4 py-2 rounded-full text-white text-xs font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
            >
              <span>Open on Instagram</span>
              <ArrowTopRightOnSquareIcon className="h-4 w-4 group-hover:rotate-12 transition-transform duration-200" />
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </a>
            <button
              onClick={onClose}
              className="group relative p-2 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-full transition-all duration-200 hover:scale-110"
            >
              <XMarkIcon className="h-5 w-5 text-gray-400 group-hover:text-red-400 transition-colors" />
            </button>
          </div>
        </div>

        {/* Content - Clean Instagram Display */}
        <div className="flex flex-1 overflow-hidden justify-center">
          {/* Instagram Embed - Hidden Scrollbar */}
          <div className="relative bg-black w-full h-full overflow-hidden">
            <iframe
              src={`https://www.instagram.com/p/${post.shortcode}/embed`}
              className="border-0"
              frameBorder="0"
              scrolling="yes"
              allowTransparency="true"
              loading="lazy"
              style={{
                width: 'calc(100% + 17px)',
                height: '100%',
                minHeight: type === 'reel' ? '500px' : '400px',
                marginRight: '-17px'
              }}
            />
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default InstagramViewer;