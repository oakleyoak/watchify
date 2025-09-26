import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import SearchBar from '../components/SearchBar';
import ContinueWatching from '../components/ContinueWatching';
import TorrentCard from '../components/TorrentCard';

const Home = () => {
  const [searchParams, setSearchParams] = useState(null);
  const [error, setError] = useState('');

  const { data: results = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: ['torrents', searchParams],
    queryFn: async () => {
      if (!searchParams) return [];

      const { query, category, resolution, minSeeders } = searchParams;

      try {
        // Call Netlify Function for torrent search
        const params = new URLSearchParams({
          query,
          category,
          limit: '50'
        });

        const response = await fetch(`/.netlify/functions/search?${params}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error(`Search failed: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        // Filter and map results
        const mappedTorrents = (data.results || [])
          .filter(torrent => !minSeeders || (torrent.seeders || 0) >= minSeeders)
          .filter(torrent => !resolution || resolution === 'all' || torrent.title.toLowerCase().includes(resolution.toLowerCase()))
          .map(torrent => ({
            title: torrent.title || 'Unknown Title',
            size: torrent.size || 'Unknown',
            seeders: torrent.seeders || 0,
            magnet: torrent.magnet || '',
            poster_url: torrent.poster_url || ''
          }))
          .slice(0, 20); // Limit to 20 results

        return mappedTorrents;
      } catch (error) {
        console.error('Search API Error:', error);
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