import { useState, useEffect } from 'react';
import {
  Search, CheckCircle2, XCircle, Loader2, Phone, Home, Clock,
  CalendarDays, ThumbsUp, ThumbsDown, UserCheck
} from 'lucide-react';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import { useToast } from '../../components/Toast';
import { reservations, houses } from '../../services/localDB';

export default function Reservations() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [review, setReview] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [showNotQualified, setShowNotQualified] = useState(false);
  const toast = useToast();

  const load = () => {
    const c = houses.current();
    if (c) setItems(reservations.list(c.id));
  };
  useEffect(() => {
    load();
  }, []);

  const openReview = (r) => {
    setReview(r);
    setReason('');
    setShowNotQualified(false);
  };

  const handleQualify = () => {
    setActionLoading(true);
    try {
      reservations.qualify(review.id, true, '');
      toast('Inquiry marked as Qualified', 'success');
      setReview(null);
      load();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleNotQualified = () => {
    if (!reason.trim()) return toast('Please provide a reason', 'error');
    setActionLoading(true);
    try {
      reservations.qualify(review.id, false, reason);
      toast('Inquiry marked as Not Qualified', 'success');
      setReview(null);
      load();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = items.filter((r) => {
    const term = search.toLowerCase();
    const nameMatch = (r.fullName || '').toLowerCase().includes(term);
    const refMatch = (r.reference || '').toLowerCase().includes(term);
    return (
      (nameMatch || refMatch) &&
      (filterStatus === 'all' || r.status === filterStatus)
    );
  });

  // Group by Week for the UI (matches dataset Table H)
  const getWeekLabel = (dateString) => {
    const d = new Date(dateString);
    const day = d.getDate();
    if (day <= 7) return 'Week 1 (Nov 1-7)';
    if (day <= 14) return 'Week 2 (Nov 8-14)';
    if (day <= 21) return 'Week 3 (Nov 15-21)';
    return 'Week 4 (Nov 22-30)';
  };
  const grouped = filtered.reduce((acc, curr) => {
    const week = getWeekLabel(curr.createdAt);
    if (!acc[week]) acc[week] = [];
    acc[week].push(curr);
    return acc;
  }, {});

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Inquiries & Reservations
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Review applicant rental readiness and qualify inquiries.
        </p>
      </div>

      <div className="space-y-2 mb-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or reference…"
            className="input pl-11"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {['pending', 'qualified', 'not_qualified', 'approved', 'all'].map(
            (s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`chip capitalize ${
                  filterStatus === s
                    ? 'bg-indigo-600 text-white border-indigo-700'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                {s.replace('_', ' ')}
              </button>
            )
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Clock size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-900 font-semibold">No inquiries found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([week, records]) => (
            <div key={week}>
              <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                <CalendarDays size={16} className="text-slate-400" /> {week}
              </h3>
              <div className="space-y-2">
                {records.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => openReview(r)}
                    className="w-full text-left card !p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold shadow shrink-0">
                        {r.fullName?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-sm truncate">
                              {r.fullName}
                            </p>
                            <p className="text-xs text-slate-500 font-mono">
                              {r.reference}
                            </p>
                          </div>
                          <StatusBadge status={r.status} />
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="chip-violet">
                            <Home size={11} /> Prefers: {r.preferredRoomType || '—'}
                          </span>
                          <span className="chip-slate">
                            <Phone size={11} /> {r.phone}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!review}
        onClose={() => setReview(null)}
        title={review?.status === 'pending' ? 'Review Inquiry' : 'Inquiry Details'}
        size="lg"
      >
        {review && (
          <div className="space-y-4">
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
              <p className="text-xs font-bold text-indigo-700 uppercase mb-1">
                Reference
              </p>
              <p className="text-2xl font-extrabold text-slate-900 font-mono">
                {review.reference}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <StatusBadge status={review.status} />
                {review.preferredRoomType && (
                  <span className="chip-violet text-xs">
                    Prefers: {review.preferredRoomType}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p>
                <span className="text-slate-500 w-24 inline-block">Name:</span>{' '}
                <strong>{review.fullName}</strong>
              </p>
              <p>
                <span className="text-slate-500 w-24 inline-block">Phone:</span>{' '}
                {review.phone}
              </p>
              {review.email && (
                <p>
                  <span className="text-slate-500 w-24 inline-block">Email:</span>{' '}
                  {review.email}
                </p>
              )}
              <p>
                <span className="text-slate-500 w-24 inline-block">Move-in:</span>{' '}
                {review.moveInDate}
              </p>
              <p>
                <span className="text-slate-500 w-24 inline-block">
                  Inquiry for:
                </span>{' '}
                {review.roomNumber
                  ? `Room ${review.roomNumber}`
                  : 'Any available room'}
              </p>
            </div>

            {review.notes && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs font-bold text-amber-800 uppercase mb-1">
                  Notes
                </p>
                <p className="text-sm text-amber-900">{review.notes}</p>
              </div>
            )}

            {review.status === 'pending' && (
              <>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2">
                  <UserCheck size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-emerald-800">
                    <strong>Assess rental readiness.</strong> Mark as{' '}
                    <strong>Qualified</strong> to add this applicant to the Room
                    Demand waitlist. Mark as <strong>Not Qualified</strong> if they
                    cannot proceed.
                  </p>
                </div>

                {showNotQualified && (
                  <div>
                    <label className="label">Reason for Not Qualified</label>
                    <textarea
                      className="input"
                      rows={2}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g. Incomplete requirements, room mismatch..."
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-2 border-t border-slate-100">
                  {!showNotQualified ? (
                    <>
                      <button
                        onClick={() => setShowNotQualified(true)}
                        className="btn-danger flex-1"
                        disabled={actionLoading}
                      >
                        <ThumbsDown size={16} /> Not Qualified
                      </button>
                      <button
                        onClick={handleQualify}
                        className="btn-success flex-1"
                        disabled={actionLoading}
                      >
                        {actionLoading ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          <ThumbsUp size={16} />
                        )}{' '}
                        Qualified
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setShowNotQualified(false)}
                        className="btn-secondary flex-1"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleNotQualified}
                        className="btn-danger flex-1"
                        disabled={actionLoading || !reason.trim()}
                      >
                        Confirm Not Qualified
                      </button>
                    </>
                  )}
                </div>
              </>
            )}

            {review.status === 'qualified' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle2 size={24} className="text-emerald-600" />
                <div>
                  <p className="font-bold text-emerald-900 text-sm">
                    Qualified Applicant
                  </p>
                  <p className="text-xs text-emerald-700">
                    This applicant now counts toward Room Demand statistics.
                  </p>
                </div>
              </div>
            )}

            {review.status === 'not_qualified' && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3">
                <XCircle size={24} className="text-rose-600" />
                <div>
                  <p className="font-bold text-rose-900 text-sm">
                    Not Qualified
                  </p>
                  <p className="text-xs text-rose-700">
                    Reason: {review.qualificationReason || 'No reason provided'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}