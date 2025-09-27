import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import ContinueWatching from '../components/ContinueWatching';
import TorrentCard from '../components/TorrentCard';

const Home = () => {
  const [searchParams, setSearchParams] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const { data: results = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: ['torrents', searchParams],
    queryFn: async () => {
      if (!searchParams) return [];

      try {
        // Use Electron IPC to search torrents
        const response = await window.electronAPI.searchTorrents(searchParams);

        if (!response.success) {
          throw new Error(response.error || 'Search failed');
        }

        return response.results || [];
      } catch (error) {
        console.error('Search error:', error);
        throw error;
      }
    },
    enabled: !!searchParams,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Handle query errors in useEffect to avoid infinite re-renders
  useEffect(() => {
    if (queryError) {
      setError(queryError.message || 'Search failed. Please try again.');
    }
  }, [queryError]);

  const handleStreamSelect = (stream) => {
    // Navigate to player with the selected stream
    navigate(`/player?magnet=${encodeURIComponent(stream.magnet)}&title=${encodeURIComponent(stream.title)}`);
  };

  const handleSearch = (query, category, resolution) => {
    if (!query.trim()) {
      setError('Please enter a search query');
      setSearchParams(null);
      return;
    }

    setError('');
    setSearchParams({ query, category, resolution });
  };

  return (
    <main className="container mx-auto p-4" id="main-content">
      <section aria-labelledby="search-section">
        <h2 id="search-section" className="sr-only">Torrent Search</h2>
        <div id="search">
          <SearchBar onSearch={handleSearch} onStreamSelect={handleStreamSelect} />
        </div>
      </section>

      <ContinueWatching />

      {error && (
        <div className="text-center py-8">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-white mb-2">Search Failed</h3>
          <p className="text-slate-400 mb-4 max-w-md mx-auto">{error}</p>
          <button
            onClick={() => {
              setError('');
              // Trigger a new search if we have search params
              if (searchParams) {
                const { query, category, resolution } = searchParams;
                setSearchParams({ query, category, resolution });
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {loading && (
        <div className="text-center text-white" aria-live="polite">
          Loading search results...
        </div>
      )}

      <section aria-labelledby="results-section">
        <h2 id="results-section" className="sr-only">Search Results</h2>
        {results.length === 0 && searchParams ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">No results found</h3>
            <p className="text-slate-400">
              Try adjusting your search terms or filters. You can also try searching for YouTube videos instead.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {results.map((torrent, index) => (
              <TorrentCard key={index} torrent={torrent} onDelete={() => {}} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default Home;