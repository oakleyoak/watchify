import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string, category: string, resolution: string, minSeeders: number) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState<string>('');
  const [category, setCategory] = useState<string>('all');
  const [resolution, setResolution] = useState<string>('all');
  const [minSeeders, setMinSeeders] = useState<number>(0);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearch(query, category, resolution, minSeeders);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4" role="search" aria-label="Torrent search">
      <div className="mb-2">
        <label htmlFor="search-query" className="sr-only">Search torrents</label>
        <input
          id="search-query"
          type="text"
          value={query}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          placeholder="Search torrents..."
          className="w-full p-2 bg-gray-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-describedby="search-help"
          autoComplete="off"
        />
        <div id="search-help" className="sr-only">
          Enter keywords to search for torrents. You can filter by category, resolution, and minimum seeders.
        </div>
      </div>

      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <div className="flex-1">
          <label htmlFor="category-select" className="sr-only">Category</label>
          <select
            id="category-select"
            value={category}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value)}
            className="w-full p-2 bg-gray-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Select torrent category"
          >
            <option value="all">All Categories</option>
            <option value="movies">Movies</option>
            <option value="tv">TV Shows</option>
            <option value="anime">Anime</option>
          </select>
        </div>

        <div className="flex-1">
          <label htmlFor="resolution-select" className="sr-only">Resolution</label>
          <select
            id="resolution-select"
            value={resolution}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setResolution(e.target.value)}
            className="w-full p-2 bg-gray-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Select video resolution"
          >
            <option value="all">All Resolutions</option>
            <option value="720p">720p</option>
            <option value="1080p">1080p</option>
            <option value="4k">4K</option>
          </select>
        </div>

        <div className="flex-1">
          <label htmlFor="min-seeders" className="sr-only">Minimum seeders</label>
          <input
            id="min-seeders"
            type="number"
            value={minSeeders}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMinSeeders(Number(e.target.value))}
            placeholder="Min Seeders"
            min="0"
            className="w-full p-2 bg-gray-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Minimum number of seeders"
            aria-describedby="seeders-help"
          />
          <div id="seeders-help" className="sr-only">
            Only show torrents with at least this many seeders
          </div>
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          aria-label="Search for torrents"
          disabled={!query.trim()}
        >
          🔍 Search
        </button>
      </div>
    </form>
  );
};

export default SearchBar;