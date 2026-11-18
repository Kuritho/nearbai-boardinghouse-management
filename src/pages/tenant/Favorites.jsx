import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Building2, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { favorites } from '../../services/localDB';

export default function Favorites() {
  const { user } = useAuth();
  const [list, setList] = useState([]);

  const load = useCallback(() => setList(favorites.list(user.id)), [user.id]);
  useEffect(() => {
    load();
  }, [load]);

  const remove = (houseId) => {
    favorites.toggle(user.id, houseId);
    load();
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Favorites
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Boarding houses you saved
        </p>
      </div>

      {list.length === 0 ? (
        <div className="card text-center py-12">
          <Heart size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-900 font-bold mb-1">No favorites yet</p>
          <p className="text-sm text-slate-500 mb-4">
            Tap the heart on any house to save it.
          </p>
          <Link to="/browse" className="btn-primary inline-flex">
            Browse Houses
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {list.map((f) => (
            <div key={f.id} className="card">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                  <Building2 size={20} className="text-white" />
                </div>
                <button
                  onClick={() => remove(f.houseId)}
                  className="p-2 rounded-xl text-rose-500 hover:bg-rose-50"
                >
                  <Heart size={16} fill="currentColor" />
                </button>
              </div>
              <p className="font-bold text-slate-900 truncate">
                {f.house?.name || 'Unknown'}
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <MapPin size={11} /> {f.house?.address || 'No location'}
              </p>
              <Link
                to={`/browse/${f.houseId}`}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 mt-3 inline-block"
              >
                View house →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}