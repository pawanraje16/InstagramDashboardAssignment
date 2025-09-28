import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { UserIcon } from '@heroicons/react/24/solid';
import { getProxiedImageUrl } from '../utils/imageProxy';

const ProfilePictureViewer = ({ profile, isOpen, onClose }) => {
  if (!isOpen) return null;

  const imageUrl = getProxiedImageUrl(profile.profile_pic_url, profile.profile_pic_cloudinary);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleDownload = async () => {
    if (!imageUrl) return;

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${profile.username}_profile_picture.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative bg-gray-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-700">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{profile.full_name}</h3>
              <p className="text-sm text-gray-400">@{profile.username}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {imageUrl && (
              <button
                onClick={handleDownload}
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                title="Download Image"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
              title="Close"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Image Container */}
        <div className="p-6">
          <div className="flex items-center justify-center">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={`${profile.full_name}'s profile picture`}
                className="max-w-full max-h-[70vh] object-contain rounded-xl"
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mb-4">
                  <UserIcon className="h-20 w-20 text-white/80" />
                </div>
                <p className="text-lg font-medium">No profile picture</p>
                <p className="text-sm text-gray-500">This user hasn't set a profile picture</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        {imageUrl && (
          <div className="px-6 pb-4 border-t border-gray-700 pt-4">
            <div className="flex justify-between items-center text-sm text-gray-400">
              <div>
                <span className="text-gray-300">Profile picture for </span>
                <span className="text-purple-400 font-medium">@{profile.username}</span>
              </div>
              {profile.profile_pic_cloudinary && (
                <div className="text-xs">
                  <span className="text-blue-400">Optimized via Cloudinary</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePictureViewer;