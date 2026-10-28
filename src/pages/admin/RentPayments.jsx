import { useState, useEffect } from 'react';
import { Plus, Wallet, Search, CheckCircle2, Users } from 'lucide-react';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import { useToast } from '../../components/Toast';
import { rentPayments, rooms, houses } from '../../services/localDB';

export default function RentPayments() {
  const [items, setItems] = useState([]);
  const [roomList, setRoomList] = useState([]);
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  // Form state for Room Billing
  const [selectedRoom, setSelectedRoom] = useState('');
  const [billingMonth, setBillingMonth] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const load = () => {
    const c = houses.current();
    if (c) {
      setItems(rentPayments.listForHouse(c.id));
      setRoomList(rooms.list(c.id));
    }
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setSelectedRoom('');
    setBillingMonth(new Date().toLocaleString('en-PH', { month: 'long', year: 'numeric' }));
    setCustomAmount('');
    setIsOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const room = roomList.find(r => r.id === selectedRoom);
      if (!room) throw new Error('Please select a room');
      
      const result = rentPayments.generateRoomBills({
        roomId: selectedRoom,
        billingMonth,
        customAmount: customAmount ? Number(customAmount) : room.monthlyRate
      });

      toast(`Generated ${result.count} bills for Room ${room.roomNumber}. ₱${result.perPerson.toLocaleString('en-PH')} each.`, 'success');
      setIsOpen(false);
      load();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkPaid = (r) => {
    if (!window.confirm(`Mark ${r.tenantName}'s rent as paid?`)) return;
    try { rentPayments.markPaid(r.id); toast('Paid', 'success'); load(); }
    catch (err) { toast(err.message, 'error'); }
  };

  const filtered = items.filter((r) => r.tenantName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex items-start justify-between mb-5 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Rent Payments</h1>
          <p className="text-slate-600 text-sm mt-1">{items.length} record{items.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate} className="btn-primary !px-4 !py-2.5 !min-h-0 text-sm">
          <Plus size={16} className="mr-1.5" /> Bill a Room
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tenant name…" className="input pl-11" />
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Wallet size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-900 font-semibold">No rent records</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <div key={r.id} className="card !p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="font-bold text-slate-900 text-sm">{r.tenantName}</p>
                  <p className="text-xs text-slate-500">Room {r.roomNumber} · {r.billingMonth}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold text-slate-900">₱{r.amountPaid.toLocaleString('en-PH')}</p>
                  <p className="text-xs text-slate-500">of ₱{r.amountDue.toLocaleString('en-PH')}</p>
                </div>
                {r.status !== 'paid' && (
                  <button onClick={() => handleMarkPaid(r)} className="flex items-center gap-1 text-sm py-2 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-medium">
                    <CheckCircle2 size={14} /> Paid
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Bill a Room (Auto-Split)">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="label">Select Room</label>
            <select className="input" required value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)}>
              <option value="">Choose a room…</option>
              {roomList.map((r) => (
                <option key={r.id} value={r.id} disabled={r.occupants === 0}>
                  Room {r.roomNumber} — {r.occupants} tenant(s) (₱{r.monthlyRate.toLocaleString('en-PH')}/mo)
                </option>
              ))}
            </select>
          </div>

          {/* Show split preview */}
          {selectedRoom && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users size={16} className="text-indigo-600" />
                <p className="text-xs font-bold text-indigo-900 uppercase">Auto-Split Preview</p>
              </div>
              {(() => {
                const room = roomList.find(r => r.id === selectedRoom);
                const amt = customAmount ? Number(customAmount) : room.monthlyRate;
                const split = Math.ceil(amt / (room.occupants || 1));
                return (
                  <p className="text-sm text-indigo-800">
                    <strong>{room.occupants}</strong> tenant(s) will be billed <strong>₱{split.toLocaleString('en-PH')}</strong> each.
                  </p>
                );
              })()}
            </div>
          )}

          <div>
            <label className="label">Billing Month</label>
            <input className="input" required value={billingMonth} onChange={(e) => setBillingMonth(e.target.value)} />
          </div>
          <div>
            <label className="label">Custom Total Amount (₱) — Optional</label>
            <input type="number" className="input" value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} placeholder="Leave blank to use default room rate" />
            <p className="text-[10px] text-slate-500 mt-1">If you leave this blank, it uses the room's monthly rate.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Generating…' : 'Generate Bills'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
