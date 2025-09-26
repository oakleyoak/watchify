import { useState, useEffect } from 'react';
import SearchBar from '../components/SearchBar';
import ContinueWatching from '../components/ContinueWatching';
import TorrentCard from '../components/TorrentCard';
import { supabase } from '../supabase';

const Home = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (query, category, resolution, minSeeders) => {
    setLoading(true);
    try {
      const response = await fetch(`https://yts.mx/api/v2/list_movies.json?query_term=${query}&limit=20`);
      const data = await response.json();
      const torrents = data.data.movies?.map(movie => ({
        title: movie.title,
        size: movie.torrents[0]?.size || 'Unknown',
        seeders: movie.torrents[0]?.seeds || 0,
        magnet: movie.torrents[0]?.hash ? `magnet:?xt=urn:btih:${movie.torrents[0].hash}` : ''
      })).filter(t => t.seeders >= minSeeders) || [];
      setResults(torrents);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-4">
      <SearchBar onSearch={handleSearch} />
      <ContinueWatching />
      {loading && <div className="text-center">Loading...</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {results.map((torrent, index) => (
          <TorrentCard key={index} torrent={torrent} />
        ))}
      </div>
    </div>
  );
};

export default Home;