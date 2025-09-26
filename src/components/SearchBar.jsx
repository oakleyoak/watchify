import { useState } from 'react';

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [resolution, setResolution] = useState('all');
  const [minSeeders, setMinSeeders] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query, category, resolution, minSeeders);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search torrents..."
        className="w-full p-2 mb-2 bg-gray-800 text-white rounded"
      />
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="p-2 bg-gray-800 text-white rounded">
          <option value="all">All Categories</option>
          <option value="movies">Movies</option>
          <option value="tv">TV</option>
          <option value="anime">Anime</option>
        </select>
        <select value={resolution} onChange={(e) => setResolution(e.target.value)} className="p-2 bg-gray-800 text-white rounded">
          <option value="all">All Resolutions</option>
          <option value="720p">720p</option>
          <option value="1080p">1080p</option>
        </select>
        <input
          type="number"
          value={minSeeders}
          onChange={(e) => setMinSeeders(e.target.value)}
          placeholder="Min Seeders"
          className="p-2 bg-gray-800 text-white rounded"
        />
        <button type="submit" className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700">Search</button>
      </div>
    </form>
  );
};

export default SearchBar;