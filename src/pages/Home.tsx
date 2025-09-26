import { useState, useEffect } from 'react';
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

      const { query, category, resolution } = searchParams;

      try {
        // Use YTS public API for movie search
        const params = new URLSearchParams({
          query_term: query,
          limit: '20',
        });
        const ytsResponse = await fetch(`https://yts.mx/api/v2/list_movies.json?${params}`);
        let ytsResults = [];
        if (ytsResponse.ok) {
          const ytsData = await ytsResponse.json();
          if (ytsData.data && ytsData.data.movies) {
            ytsResults = ytsData.data.movies.map(movie => {
              const bestTorrent = movie.torrents && movie.torrents.length > 0 ?
                movie.torrents.reduce((a, b) => (b.seeds > a.seeds ? b : a), movie.torrents[0]) : null;
              return {
                title: movie.title_long,
                size: bestTorrent ? bestTorrent.size : 'Unknown',
                seeders: bestTorrent ? bestTorrent.seeds : 0,
                magnet: bestTorrent ? `magnet:?xt=urn:btih:${bestTorrent.hash}&dn=${encodeURIComponent(movie.title_long)}&tr=udp://tracker.openbittorrent.com:80/announce` : '',
                poster_url: movie.medium_cover_image || '',
              };
            });
          }
        }
        // If YTS found results or user is searching for a movie, return those
        if (ytsResults.length > 0 || (category === 'movies' || !category || category === 'all')) {
          return ytsResults.filter(torrent => !resolution || resolution === 'all' || torrent.title.toLowerCase().includes(resolution.toLowerCase()));
        }
        // Otherwise, fallback to Pirate Bay proxy for TV shows and other content
        const pbResponse = await fetch(`https://apibay.org/q.php?q=${encodeURIComponent(query)}`);
        if (!pbResponse.ok) {
          throw new Error(`Pirate Bay API failed: ${pbResponse.status}`);
        }
        const pbData = await pbResponse.json();
        // Map Pirate Bay results
        const pbTorrents = (Array.isArray(pbData) ? pbData : []).map(item => {
          return {
            title: item.name,
            size: item.size || 'Unknown',
            seeders: item.seeders || 0,
            magnet: item.info_hash ? `magnet:?xt=urn:btih:${item.info_hash}&dn=${encodeURIComponent(item.name)}&tr=udp://tracker.openbittorrent.com:80/announce` : '',
            poster_url: '',
          };
        });
        return pbTorrents.filter(torrent => !resolution || resolution === 'all' || torrent.title.toLowerCase().includes(resolution.toLowerCase()));
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