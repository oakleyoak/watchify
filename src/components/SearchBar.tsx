import React, { useState } from 'react';
import axios from 'axios';

interface SearchBarProps {
  onSearch: (query: string, category: string, resolution: string) => void;
  onStreamSelect?: (stream: any) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, onStreamSelect }) => {
  const [query, setQuery] = useState<string>('');
  const [category, setCategory] = useState<string>('all');
  const [resolution, setResolution] = useState<string>('all');
  const [streamingMode, setStreamingMode] = useState<'youtube' | 'torrent'>('youtube');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setSearchResults([]);

    try {
      if (streamingMode === 'youtube') {
        // For demo purposes, we'll use a simple YouTube search approach
        // In production, you'd want to use the YouTube Data API with proper authentication
        const searchQuery = encodeURIComponent(`${query} movie full`);
        const youtubeResults = [
          {
            id: 'dQw4w9WgXcQ', // Example video ID
            title: `${query} - Official Movie Trailer`,
            thumbnail: `https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg`,
            channel: 'Movie Studios',
            type: 'youtube'
          },
          {
            id: '9bZkp7q19f0', // Another example
            title: `${query} (2024) - Full Movie`,
            thumbnail: `https://img.youtube.com/vi/9bZkp7q19f0/mqdefault.jpg`,
            channel: 'Free Movies Online',
            type: 'youtube'
          }
        ];

        setSearchResults(youtubeResults);
      } else {
        // Original torrent search
        onSearch(query, category, resolution);
      }
    } catch (error) {
      console.error('Search failed:', error);
      // Fallback to torrent search
      onSearch(query, category, resolution);
    } finally {
      setIsSearching(false);
    }
  };

  const handleStreamSelect = (stream: any) => {
    if (onStreamSelect) {
      if (stream.type === 'youtube') {
        onStreamSelect({
          ...stream,
          magnet: `youtube:${stream.id}` // Special marker for YouTube videos
        });
      } else {
        onStreamSelect(stream);
      }
    }
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-2xl shadow-2xl border border-slate-700/50 backdrop-blur-sm">
      {/* Streaming Mode Toggle */}
      <div className="flex justify-center mb-6">
        <div className="bg-slate-800/50 rounded-lg p-1 border border-slate-600">
          <button
            onClick={() => setStreamingMode('youtube')}
            className={`px-4 py-2 rounded-md transition-all ${
              streamingMode === 'youtube'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            🎥 YouTube
          </button>
          <button
            onClick={() => setStreamingMode('torrent')}
            className={`px-4 py-2 rounded-md transition-all ${
              streamingMode === 'torrent'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            🧲 Torrent
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" role="search" aria-label="Video search">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            id="search-query"
            type="text"
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            placeholder={`Search for ${streamingMode === 'youtube' ? 'movies on YouTube' : 'torrents'}...`}
            className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
            aria-describedby="search-help"
            autoComplete="off"
            disabled={isSearching}
          />
          <div id="search-help" className="sr-only">
            Enter keywords to search for videos. You can filter by category and resolution for torrents.
          </div>
        </div>

        {streamingMode === 'torrent' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label htmlFor="category-select" className="text-sm font-medium text-slate-300">Category</label>
              <select
                id="category-select"
                value={category}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                aria-label="Select torrent category"
              >
                <option value="all">All Categories</option>
                <option value="movies">🎬 Movies</option>
                <option value="tv">📺 TV Shows</option>
                <option value="anime">🎯 Anime</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="resolution-select" className="text-sm font-medium text-slate-300">Resolution</label>
              <select
                id="resolution-select"
                value={resolution}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setResolution(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                aria-label="Select video resolution"
              >
                <option value="all">All Resolutions</option>
                <option value="720p">720p HD</option>
                <option value="1080p">1080p Full HD</option>
                <option value="4k">4K Ultra HD</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                aria-label="Search for videos"
                disabled={!query.trim() || isSearching}
              >
                <span className="flex items-center justify-center space-x-2">
                  {isSearching ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                  <span>{isSearching ? 'Searching...' : 'Search'}</span>
                </span>
              </button>
            </div>
          </div>
        )}

        {streamingMode === 'youtube' && (
          <div className="flex justify-center">
            <button
              type="submit"
              className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              aria-label="Search YouTube"
              disabled={!query.trim() || isSearching}
            >
              <span className="flex items-center justify-center space-x-2">
                {isSearching ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                    <span>{isSearching ? 'Searching YouTube...' : 'Search YouTube'}</span>
                  </>
                )}
              </span>
            </button>
          </div>
        )}
      </form>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="mt-6">
          <h3 className="text-white text-lg font-semibold mb-4">Search Results:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {searchResults.map((result) => (
              <div
                key={result.id}
                onClick={() => handleStreamSelect(result)}
                className="bg-slate-800/50 border border-slate-600 rounded-lg p-4 cursor-pointer hover:bg-slate-700/50 transition-all transform hover:scale-105"
              >
                <img
                  src={result.thumbnail}
                  alt={result.title}
                  className="w-full h-32 object-cover rounded-lg mb-3"
                />
                <h4 className="text-white font-medium text-sm line-clamp-2 mb-2">
                  {result.title}
                </h4>
                <p className="text-slate-400 text-xs">
                  {result.channel}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;