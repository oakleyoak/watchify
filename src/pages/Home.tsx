import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import TorrentSearchApi from 'torrent-search-api';
import SearchBar from '../components/SearchBar';
import ContinueWatching from '../components/ContinueWatching';
import TorrentCard from '../components/TorrentCard';

const Home = () => {
  const [searchParams, setSearchParams] = useState(null);
  const [error, setError] = useState('');

  // Initialize Torrent Search API with public providers
  useEffect(() => {
    TorrentSearchApi.enablePublicProviders();
  }, []);

  const { data: results = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: ['torrents', searchParams],
    queryFn: async () => {
      if (!searchParams) return [];

      const { query, category, resolution, minSeeders } = searchParams;

      try {
        // Use Torrent-Search-API for comprehensive search
        const torrents = await TorrentSearchApi.search(query, category === 'all' ? undefined : category, 50);

        // Map and filter results to match our format
        const mappedTorrents = torrents
          .filter(torrent => !minSeeders || (torrent.seeds || 0) >= minSeeders)
          .filter(torrent => !resolution || resolution === 'all' || torrent.title.toLowerCase().includes(resolution.toLowerCase()))
          .map(torrent => ({
            title: torrent.title || 'Unknown Title',
            size: torrent.size || 'Unknown',
            seeders: torrent.seeds || 0,
            magnet: torrent.magnet || '',
            poster_url: torrent.desc || '' // Some providers might have poster URLs
          }))
          .slice(0, 20); // Limit to 20 results

        return mappedTorrents;
      } catch (error) {
        console.error('Torrent Search API Error:', error);
        throw new Error('Unable to search torrents. The search service may be temporarily unavailable.');
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

  const handleSearch = (query, category, resolution, minSeeders) => {
    if (!query.trim()) {
      setError('Please enter a search query');
      setSearchParams(null);
      return;
    }

    setError('');
    setSearchParams({ query, category, resolution, minSeeders });
  };

  return (
    <main className="container mx-auto p-4" id="main-content">
      <section aria-labelledby="search-section">
        <h2 id="search-section" className="sr-only">Torrent Search</h2>
        <div id="search">
          <SearchBar onSearch={handleSearch} />
        </div>
      </section>

      <ContinueWatching />

      {error && (
        <div className="text-center text-red-500 mb-4" role="alert" aria-live="polite">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center text-white" aria-live="polite">
          Loading search results...
        </div>
      )}

      <section aria-labelledby="results-section">
        <h2 id="results-section" className="sr-only">Search Results</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {results.map((torrent, index) => (
            <TorrentCard key={index} torrent={torrent} onDelete={() => {}} />
          ))}
        </div>
      </section>
    </main>
  );
};

export default Home;