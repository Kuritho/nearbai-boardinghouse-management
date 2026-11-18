import { useState, useEffect } from 'react';
import { Megaphone, Clock, AlertCircle, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { announcements, houses } from '../../services/localDB';

export default function TenantAnnouncements() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const house = houses.current();
    if (house) {
      setList(announcements.list(house.id));
    }
    setLoading(false);
  }, []);

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'urgent': return { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', icon: AlertCircle };
      case 'important': return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: AlertCircle };
      default: return { bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-700', icon: Info };
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading announcements...</div>;

  return (
    <div className="max-w-3xl mx-auto pb-10">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Megaphone className="text-indigo-600" /> Announcements
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Updates and notices from the management
        </p>
      </div>

      {list.length === 0 ? (
        <div className="card text-center py-16">
          <Megaphone size={48} className="mx-auto text-slate-300 mb-4" />
          <h2 className="text-lg font-bold text-slate-900">No announcements yet</h2>
          <p className="text-sm text-slate-500 mt-1">Check back later for updates from the admin or caretaker.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((ann, i) => {
            const style = getPriorityStyle(ann.priority);
            const Icon = style.icon;

            return (
              <motion.div
                key={ann.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`card !p-5 border ${style.border} ${style.bg}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-white/60 ${style.text}`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-bold text-base ${style.text}`}>{ann.title}</h3>
                      {ann.priority !== 'normal' && (
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/60 ${style.text}`}>
                          {ann.priority}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">
                      {ann.body}
                    </p>
                    <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-500">
                      <Clock size={12} />
                      <span>
                        {new Date(ann.createdAt).toLocaleDateString('en-PH', {
                          month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}