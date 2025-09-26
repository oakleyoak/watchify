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
      let url = `https://yts.mx/api/v2/list_movies.json?query_term=${encodeURIComponent(query)}&limit=20`;

      // Add filters if provided
      if (category && category !== 'all') {
        // Map categories to YTS genres
        const genreMap = {
          movies: 'action', // YTS doesn't have a generic movies category
          tv: '', // YTS is primarily movies
          anime: 'animation'
        };
        if (genreMap[category]) {
          url += `&genre=${genreMap[category]}`;
        }
      }
      if (resolution && resolution !== 'all') {
        url += `&quality=${resolution}`;
      }
      if (minSeeders > 0) {
        url += `&minimum_rating=${minSeeders}`;
      }

      try {
        const response = await fetch(url, {
          mode: 'cors',
          headers: {
            'Accept': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error(`Search failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        if (data.status !== 'ok') {
          throw new Error('Search API returned an error');
        }

        const torrents = data.data.movies?.map(movie => ({
          title: movie.title,
          size: movie.torrents[0]?.size || 'Unknown',
          seeders: movie.torrents[0]?.seeds || 0,
          magnet: movie.torrents[0]?.hash ? `magnet:?xt=urn:btih:${movie.torrents[0].hash}` : '',
          poster_url: movie.medium_cover_image
        })).filter(t => !minSeeders || t.seeders >= minSeeders) || [];

        return torrents;
      } catch (error) {
        console.error('YTS API Error:', error);
        throw new Error('Unable to connect to torrent search service. The service may be temporarily unavailable.');
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