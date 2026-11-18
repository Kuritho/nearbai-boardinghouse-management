import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin, Building2, DoorOpen, ArrowLeft, ArrowRight, Heart,
  MessageSquare, Send, Loader2, AlertTriangle, CalendarDays, X
} from 'lucide-react';
import PublicNavbar from './PublicNavbar';
import BedPicker from './BedPicker';
import PoliciesModal from './PoliciesModal';
import Modal from '../../components/Modal';
import { useToast } from '../../components/Toast';
import { houses, rooms, bookings, favorites, reservations } from '../../services/localDB';
import { useAuth } from '../../context/AuthContext';

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [house, setHouse] = useState(null);
  const [roomList, setRoomList] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedBed, setSelectedBed] = useState(null);
  const [moveIn, setMoveIn] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [showPolicies, setShowPolicies] = useState(false);
  const [error, setError] = useState('');

  // ── NEW: Inquiry modal state ──
  const [showInquiry, setShowInquiry] = useState(false);
  const [inquiryRoom, setInquiryRoom] = useState(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [preferredType, setPreferredType] = useState('Male');
  const [inqMoveIn, setInqMoveIn] = useState('');
  const [savingInquiry, setSavingInquiry] = useState(false);

  useEffect(() => {
    const h = houses.get(id);
    if (!h) {
      navigate('/browse');
      return;
    }
    setHouse(h);
    setRoomList(rooms.list(id));
  }, [id, navigate]);

  // Prefill inquiry form with logged-in user details
  useEffect(() => {
    if (user) {
      setFullName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleBook = () => {
    if (!user) {
      navigate('/login?redirect=' + encodeURIComponent(`/browse/${id}`));
      return;
    }
    if (!selectedRoom || !selectedBed) {
      return setError('Please select a room and bed first.');
    }
    setShowPolicies(true);
  };

  const confirmBooking = () => {
    try {
      bookings.create({
        tenantId: user.id,
        roomId: selectedRoom.id,
        bedNumber: selectedBed,
        moveInDate: moveIn,
        guestName: user.name,
        guestPhone: '',
      });
      navigate('/tenant/bookings');
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleFav = () => {
    if (!user) return;
    favorites.toggle(user.id, id);
    setHouse({ ...house });
  };

  // ── NEW: Open inquiry modal for a FULL room ──
  const openInquiry = (room) => {
    setInquiryRoom(room);
    setPreferredType(room.gender === 'female' ? 'Female' : 'Male');
    setInqMoveIn(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
    if (!user) {
      setFullName('');
      setEmail('');
    }
    setShowInquiry(true);
  };

  // ── NEW: Submit the inquiry ──
  const handleSubmitInquiry = (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login?redirect=' + encodeURIComponent(`/browse/${id}`));
      return;
    }
    setSavingInquiry(true);
    try {
      const res = reservations.create({
        houseId: house.id,
        roomId: inquiryRoom?.id,
        fullName,
        phone,
        email,
        moveInDate: inqMoveIn,
        preferredRoomType: preferredType,
        notes: 'Submitted via Property Detail page (room full).',
      });
      setShowInquiry(false);
      toast(`Inquiry ${res.reference} submitted! We'll review your rental readiness.`, 'success');
      navigate(`/reserve/success/${res.reference}`);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSavingInquiry(false);
    }
  };

  if (!house) return <div className="p-8">Loading…</div>;

  const isFav = user ? favorites.isFavorite(user.id, id) : false;
  const coverImg =
    house.imageUrl ||
    roomList.find((r) => r.imageUrl)?.imageUrl ||
    '';

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <PublicNavbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <Link
          to="/browse"
          className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mb-4"
        >
          <ArrowLeft size={14} /> Back to Browse
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main info */}
          <div className="lg:col-span-2 space-y-4">
            {/* House cover */}
            <div className="aspect-video rounded-3xl overflow-hidden bg-slate-100">
              {coverImg ? (
                <img
                  src={coverImg}
                  alt={house.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                  <Building2 size={64} className="text-white/80" />
                </div>
              )}
            </div>

            {/* House header */}
            <div className="card">
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {house.name}
                </h1>
                {user?.role === 'tenant' && (
                  <button
                    onClick={toggleFav}
                    className={`p-2.5 rounded-xl transition ${
                      isFav
                        ? 'bg-rose-500 text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-rose-50'
                    }`}
                  >
                    <Heart size={18} fill={isFav ? 'currentColor' : 'none'} />
                  </button>
                )}
              </div>
              <p className="text-slate-600 flex items-center gap-1.5 mb-1">
                <MapPin size={14} /> {house.address || 'Location not set'}
              </p>
              {house.contactNumber && (
                <p className="text-sm text-slate-500">Contact: {house.contactNumber}</p>
              )}
            </div>

            {/* Rooms */}
            <div className="card">
              <h2 className="font-bold text-slate-900 mb-3">Rooms & Bed Availability</h2>
              {roomList.length === 0 ? (
                <p className="text-sm text-slate-500">No rooms listed yet.</p>
              ) : (
                <div className="space-y-2">
                  {roomList.map((r) => {
                    const taken = bookings.takenBeds(r.id);
                    const available = r.bedCapacity - r.occupants - taken.length;
                    const isFull = available <= 0;
                    return (
                      <div
                        key={r.id}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition ${
                          !isFull && selectedRoom?.id === r.id
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-slate-200'
                        }`}
                      >
                        {/* Room thumbnail */}
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                          {r.imageUrl ? (
                            <img
                              src={r.imageUrl}
                              alt={`Room ${r.roomNumber}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-indigo-100 flex items-center justify-center">
                              <DoorOpen size={18} className="text-indigo-500" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 text-sm">
                            Room {r.roomNumber}
                          </p>
                          <p className="text-xs text-slate-500">
                            ₱{r.monthlyRate.toLocaleString('en-PH')}/mo ·{" "}
                            {isFull ? 'No beds available' : `${available} bed${available !== 1 ? 's' : ''} available`}
                          </p>
                          <p className="text-[10px] text-slate-400 capitalize mt-0.5">
                            {r.gender === 'mixed' ? 'Mixed dorm' : `${r.gender} only`}
                          </p>
                        </div>

                        {/* Action button: Inquire (full) or Select (open) */}
                        {isFull ? (
                          <button
                            onClick={() => openInquiry(r)}
                            className="btn-secondary !text-xs !py-2 !px-3 !min-h-0 shrink-0"
                          >
                            <MessageSquare size={12} className="mr-1" /> Inquire
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedRoom(r);
                              setSelectedBed(null);
                              setError('');
                            }}
                            className={`text-xs font-semibold px-3 py-2 rounded-lg transition shrink-0 ${
                              selectedRoom?.id === r.id
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {selectedRoom?.id === r.id ? 'Selected' : 'Select'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bed picker (only if a non-full room is selected) */}
            {selectedRoom && (
              <div className="card">
                <h2 className="font-bold text-slate-900 mb-3">
                  Select Your Bed in Room {selectedRoom.roomNumber}
                </h2>

                {selectedRoom.imageUrl && (
                  <div className="rounded-xl overflow-hidden mb-4">
                    <img
                      src={selectedRoom.imageUrl}
                      alt={`Room ${selectedRoom.roomNumber}`}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}

                <BedPicker
                  totalBeds={selectedRoom.bedCapacity}
                  takenBeds={bookings.takenBeds(selectedRoom.id)}
                  selected={selectedBed}
                  onSelect={setSelectedBed}
                />
              </div>
            )}
          </div>

          {/* Sidebar booking card */}
          <div>
            <div className="card sticky top-24">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Monthly Rate
              </p>
              <p className="text-3xl font-extrabold text-slate-900 mb-4">
                {selectedRoom
                  ? `₱${selectedRoom.monthlyRate.toLocaleString('en-PH')}`
                  : '—'}
              </p>

              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-xl text-xs mb-3">
                  {error}
                </div>
              )}

              <div className="space-y-3 mb-4">
                <div>
                  <label className="label text-[10px]">Move-in Date</label>
                  <input
                    type="date"
                    value={moveIn}
                    onChange={(e) => setMoveIn(e.target.value)}
                    className="input text-sm"
                  />
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-500">Room</span>
                    <span className="font-semibold">
                      {selectedRoom?.roomNumber || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bed</span>
                    <span className="font-semibold">
                      {selectedBed ? `Bed ${selectedBed}` : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {user ? (
                <button
                  onClick={handleBook}
                  disabled={!selectedRoom || !selectedBed}
                  className="btn-primary w-full disabled:opacity-40"
                >
                  {selectedRoom && selectedBed ? (
                    <>
                      Book Bed {selectedBed} <ArrowRight size={16} />
                    </>
                  ) : (
                    'Select a bed first'
                  )}
                </button>
              ) : (
                <Link to="/signup" className="btn-primary w-full">
                  Sign up to book
                </Link>
              )}

              <p className="text-[11px] text-slate-500 text-center mt-3">
                You won't be charged until the owner approves.
              </p>
            </div>
          </div>
        </div>
      </div>

      <PoliciesModal
        isOpen={showPolicies}
        onClose={() => setShowPolicies(false)}
        onAccept={confirmBooking}
        houseName={house.name}
      />

      {/* ── NEW: Inquiry Modal (Step 2) ── */}
      <Modal
        isOpen={showInquiry}
        onClose={() => setShowInquiry(false)}
        title={`Inquire About Room ${inquiryRoom?.roomNumber || ''}`}
      >
        {!user ? (
          <div className="text-center py-6">
            <AlertTriangle size={32} className="mx-auto text-amber-500 mb-3" />
            <p className="text-sm text-slate-600 mb-4">
              Please log in or sign up to submit an inquiry.
            </p>
            <Link
              to={'/login?redirect=' + encodeURIComponent(`/browse/${id}`)}
              className="btn-primary w-full"
            >
              Log In / Sign Up
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmitInquiry} className="space-y-4">
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800">
                This room is currently <strong>full</strong>. Your inquiry will be reviewed and you'll be added to the waitlist if you are qualified.
              </p>
            </div>

            <div>
              <label className="label">Full Name</label>
              <input
                className="input"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Phone</label>
                <input
                  className="input"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09XX XXX XXXX"
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="label">Preferred Room Type</label>
              <div className="grid grid-cols-2 gap-2">
                {['Male', 'Female'].map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setPreferredType(t)}
                    className={`p-3 rounded-xl border-2 text-sm font-semibold transition ${
                      preferredType === t
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">
                <CalendarDays size={12} className="inline mr-1" /> Preferred Move-in Date
              </label>
              <input
                className="input"
                type="date"
                required
                value={inqMoveIn}
                onChange={(e) => setInqMoveIn(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowInquiry(false)}
                className="btn-secondary flex-1"
              >
                <X size={16} /> Cancel
              </button>
              <button
                type="submit"
                disabled={savingInquiry}
                className="btn-primary flex-1"
              >
                {savingInquiry ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Send size={16} />
                )}
                Submit Inquiry
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}