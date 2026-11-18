import { useState, useEffect } from 'react';
import { Megaphone, Plus, Trash2, Loader2, AlertCircle, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import Modal from '../../components/Modal';
import { useToast } from '../../components/Toast';
import { announcements, houses } from '../../services/localDB';

export default function CaretakerAnnouncements() {
  const [list, setList] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const toast = useToast();
  
  // Form state
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState('normal');

  const load = () => {
    const house = houses.current();
    if (house) setList(announcements.list(house.id));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const house = houses.current();
      if (!house) throw new Error('No property selected');
      if (!title.trim() || !body.trim()) throw new Error('Title and body are required');

      announcements.create({
        houseId: house.id,
        title: title.trim(),
        body: body.trim(),
        priority,
      });

      toast('Announcement posted successfully', 'success');
      setIsOpen(false);
      setTitle(''); setBody(''); setPriority('normal');
      load();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    setDeletingId(id);
    try {
      announcements.remove(id);
      toast('Announcement deleted', 'success');
      load();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'urgent': return { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', icon: AlertCircle };
      case 'important': return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: AlertCircle };
      default: return { bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-700', icon: Info };
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-10">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Megaphone className="text-amber-600" /> Announcements
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Manage notices for tenants
          </p>
        </div>
        <button onClick={() => setIsOpen(true)} className="btn-primary !px-4 !py-2.5 !min-h-0 text-sm">
          <Plus size={16} className="mr-1.5" /> Post New
        </button>
      </div>

      {list.length === 0 ? (
        <div className="card text-center py-16">
          <Megaphone size={48} className="mx-auto text-slate-300 mb-4" />
          <h2 className="text-lg font-bold text-slate-900">No announcements yet</h2>
          <p className="text-sm text-slate-500 mt-1 mb-4">Post a notice to keep your tenants informed.</p>
          <button onClick={() => setIsOpen(true)} className="btn-secondary">
            <Plus size={16} className="mr-1.5" /> Post First Announcement
          </button>
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
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-bold text-base ${style.text}`}>{ann.title}</h3>
                        {ann.priority !== 'normal' && (
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/60 ${style.text}`}>
                            {ann.priority}
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={() => handleDelete(ann.id)}
                        disabled={deletingId === ann.id}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-white/50 transition"
                      >
                        {deletingId === ann.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                    </div>
                    <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">
                      {ann.body}
                    </p>
                    <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-500">
                      <span>
                        Posted {new Date(ann.createdAt).toLocaleDateString('en-PH', {
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

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Post Announcement">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input 
              className="input" 
              required 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="e.g., Water interruption on Saturday"
            />
          </div>
          <div>
            <label className="label">Message</label>
            <textarea 
              className="input" 
              rows={4} 
              required 
              value={body} 
              onChange={(e) => setBody(e.target.value)} 
              placeholder="Write your announcement here..."
            />
          </div>
          <div>
            <label className="label">Priority</label>
            <div className="grid grid-cols-3 gap-2">
              {['normal', 'important', 'urgent'].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`p-2 rounded-xl border text-sm font-semibold capitalize transition ${
                    priority === p ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <Loader2 className="animate-spin" size={16} /> : 'Post'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}