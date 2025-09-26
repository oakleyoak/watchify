import { Link } from 'react-router-dom';
import { supabase } from '../supabase';

const TorrentCard = ({ torrent }) => {
  const addToHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('magnet_history').insert({
        user_id: user.id,
        magnet_uri: torrent.magnet,
        title: torrent.title
      });
    }
  };

  const addToFavorites = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('favorites').insert({
        user_id: user.id,
        magnet_uri: torrent.magnet,
        title: torrent.title
      });
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded">
      <h3 className="text-lg font-bold">{torrent.title}</h3>
      <p>Size: {torrent.size}</p>
      <p>Seeders: {torrent.seeders}</p>
      <div className="flex space-x-2 mt-2">
        <Link to={`/player/${encodeURIComponent(torrent.magnet)}`} onClick={addToHistory} className="text-blue-400">Watch</Link>
        <button onClick={addToFavorites} className="text-yellow-400">Favorite</button>
      </div>
    </div>
  );
};

export default TorrentCard;