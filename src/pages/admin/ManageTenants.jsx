import { useState, useEffect } from 'react';
import {
  Plus, Users, Search, Trash2, Phone, Home, CheckCircle2,
  ArrowRight, UserPlus, ListChecks
} from 'lucide-react';
import Modal from '../../components/Modal';
import { useToast } from '../../components/Toast';
import { tenants, rooms, houses, reservations } from '../../services/localDB';

const EMPTY = { name: '', email: '', password: '', phone: '', emergencyContact: '', roomId: '', moveInDate: '' };

export default function ManageTenants() {
  const [list, setList] = useState([]);
  const [pendingList, setPendingList] = useState([]);
  const [roomList, setRoomList] = useState([]);
  const [search, setSearch] = useState('');

  const [isOpen, setIsOpen] = useState(false);
  const [modalMode, setModalMode] = useState('manual'); // 'manual' | 'reservation'
  const [form, setForm] = useState(EMPTY);
  const [selectedRes, setSelectedRes] = useState(null);
  const [saving, setSaving] = useState(false);

  const toast = useToast();

  const load = () => {
    const c = houses.current();
    if (c) {
      const all = tenants.list(c.id);
      setList(all.filter(t => t.status === 'occupied'));
      
      const allRes = reservations.list(c.id);
      setPendingList(allRes.filter(r => r.status === 'approved'));
      
      setRoomList(rooms.list(c.id));
    }
  };
  useEffect(() => { load(); }, []);

  const openModal = () => {
    setForm(EMPTY);
    setSelectedRes(null);
    setModalMode(pendingList.length > 0 ? 'reservation' : 'manual');
    setIsOpen(true);
  };

  const handleSelectReservation = (res) => {
    setSelectedRes(res);
    setForm({
      name: res.fullName,
      email: res.email || `${res.reference.toLowerCase()}@nearbai.local`,
      password: 'Tenant123!',
      phone: res.phone,
      emergencyContact: '',
      roomId: res.roomId || '',
      moveInDate: res.moveInDate,
    });
    setModalMode('manual');
  };

  // NEW: Delete/Reject a pending reservation from the list
  const handleDeleteReservation = (res) => {
    if (!window.confirm(`Are you sure you want to delete the reservation for ${res.fullName}? This cannot be undone.`)) return;
    try {
      // We use reservations.reject to clear it out
      reservations.reject(res.id, 'Deleted by admin from Add Tenant screen', res.type);
      toast('Reservation removed', 'success');
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (selectedRes) {
        if (selectedRes.tenantId) {
          tenants.checkIn(selectedRes.tenantId, form.roomId);
        } else {
          tenants.create(form);
        }
        
        reservations.checkIn(selectedRes.id);
        
        toast(`Reserved tenant "${form.name}" officially checked in.`, 'success');
      } else {
        tenants.create(form);
        toast(`Tenant "${form.name}" added directly.`, 'success');
      }
      setIsOpen(false);
      load();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this tenant? This also removes their rent records.')) return;
    try { tenants.remove(id); toast('Deleted', 'success'); load(); }
    catch (err) { toast(err.message, 'error'); }
  };

  const filtered = list.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-start justify-between mb-5 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Tenants</h1>
          <p className="text-slate-600 text-sm mt-1">{list.length} active tenant{list.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openModal} className="btn-primary !px-4 !py-2.5 !min-h-0 text-sm">
          <Plus size={16} className="mr-1.5" /> Add Tenant
        </button>
      </div>

      {pendingList.length > 0 && (
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <ListChecks size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="font-bold text-amber-900 text-sm">{pendingList.length} approved reservation(s) waiting</p>
              <p className="text-xs text-amber-700">Click "Add Tenant" to check them in.</p>
            </div>
          </div>
          <button onClick={openModal} className="btn-primary !px-3 !py-1.5 !min-h-0 text-xs bg-amber-600 hover:bg-amber-700">
            Check-in Now
          </button>
        </div>
      )}

      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tenants..." className="input pl-11" />
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Users size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-900 font-semibold mb-1">No active tenants</p>
          <p className="text-sm text-slate-500 mb-5">Add someone directly or approve a reservation.</p>
          <button onClick={openModal} className="btn-primary inline-flex"><Plus size={16} className="mr-1.5" /> Add Tenant</button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <div key={t.id} className="card !p-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold shadow shrink-0">
                  {t.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-sm truncate">{t.name}</p>
                  <p className="text-xs text-slate-500 truncate">{t.email}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="chip-violet"><Home size={11} /> Room {t.room?.number || '—'}</span>
                    {t.phone && <span className="chip-emerald"><Phone size={11} /> {t.phone}</span>}
                  </div>
                </div>
                <button onClick={() => handleDelete(t.id)} className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 shrink-0">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD TENANT MODAL */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Add Tenant" size="lg">
        
        {/* Toggle Tabs */}
        <div className="flex gap-2 mb-5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => { setModalMode('reservation'); setSelectedRes(null); setForm(EMPTY); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition ${
              modalMode === 'reservation' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500'
            }`}
          >
            <ListChecks size={16} /> From Reservations ({pendingList.length})
          </button>
          <button
            onClick={() => { setModalMode('manual'); setSelectedRes(null); setForm(EMPTY); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition ${
              modalMode === 'manual' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500'
            }`}
          >
            <UserPlus size={16} /> Manual Entry
          </button>
        </div>

        {/* VIEW 1: Reservation List */}
        {modalMode === 'reservation' && (
          <div>
            {pendingList.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-slate-500">No approved reservations waiting.</p>
                <p className="text-xs text-slate-400 mt-1">Approve a guest request in the Reservations tab first.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingList.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white">
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-slate-900 text-sm truncate">{r.fullName}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {r.reference} · Room {r.roomNumber} · {r.moveInDate}
                      </p>
                    </div>
                    {/* Buttons: Delete & Select */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleDeleteReservation(r)}
                        className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 transition"
                        title="Delete reservation"
                      >
                        <Trash2 size={14} />
                      </button>
                      <button
                        onClick={() => handleSelectReservation(r)}
                        className="btn-primary !px-3 !py-1.5 !min-h-0 text-xs"
                      >
                        Select <ArrowRight size={12} className="ml-1" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: Manual Form */}
        {modalMode === 'manual' && (
          <form onSubmit={handleSubmit} className="space-y-3">
            {selectedRes && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 mb-2 flex items-start gap-2">
                <CheckCircle2 size={16} className="text-indigo-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-indigo-900">Completing Reservation</p>
                  <p className="text-xs text-indigo-700">Fill in the details and confirm the room assignment below.</p>
                </div>
              </div>
            )}

            <div><label className="label">Full Name</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="label">Email</label><input type="email" className="input" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><label className="label">Password</label><input className="input" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><label className="label">Move-in</label><input type="date" className="input" value={form.moveInDate} onChange={(e) => setForm({ ...form, moveInDate: e.target.value })} /></div>
            </div>
            <div><label className="label">Emergency Contact</label><input className="input" value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} /></div>
            <div>
              <label className="label">Assign Room</label>
              <select className="input" required value={form.roomId} onChange={(e) => setForm({ ...form, roomId: e.target.value })}>
                <option value="">Select…</option>
                {roomList.map((r) => (
                  <option key={r.id} value={r.id} disabled={r.occupants >= r.bedCapacity}>Room {r.roomNumber} ({r.occupants}/{r.bedCapacity})</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Saving…' : 'Confirm & Add'}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
