import { useState, useEffect } from 'react';
import SearchBar from '../components/SearchBar';
import ContinueWatching from '../components/ContinueWatching';
import TorrentCard from '../components/TorrentCard';
import { supabase } from '../supabase';

const Home = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (query, category, resolution, minSeeders) => {
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError('');
    try {
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

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
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

      setResults(torrents);
      if (torrents.length === 0) {
        setError('No results found. Try different search terms.');
      }
    } catch (error) {
      console.error('Search failed:', error);
      setError(error.message || 'Search failed. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <SearchBar onSearch={handleSearch} />
      <ContinueWatching />
      {error && <div className="text-center text-red-500 mb-4">{error}</div>}
      {loading && <div className="text-center text-white">Loading...</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {results.map((torrent, index) => (
          <TorrentCard key={index} torrent={torrent} />
        ))}
      </div>
    </div>
  );
};

export default Home;