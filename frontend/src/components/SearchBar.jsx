import { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Button from './ui/Button';

const SearchBar = ({ onSearch, placeholder = "Enter Instagram username..." }) => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsLoading(true);
    try {
      await onSearch(username.trim());
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-12 pr-32 py-4 bg-gray-900 border-2 border-gray-800 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
            disabled={isLoading}
          />
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
            <Button
              type="submit"
              size="md"
              disabled={!username.trim() || isLoading}
              className="min-w-[100px]"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading</span>
                </div>
              ) : (
                'Analyze'
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SearchBar;