import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Building2, MessageSquare, UserCheck, XCircle } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { bookings, houses, rooms, reservations } from '../../services/localDB';

export default function MyBookings() {
  const { user } = useAuth();
  const [bookingsList, setBookingsList] = useState([]);
  const [inquiriesList, setInquiriesList] = useState([]);

  const load = useCallback(() => {
    // 1. Load actual bed bookings
    const allBookings = bookings.listForTenant(user.id);
    const allHouses = houses.list();
    const allRooms = rooms.list();
    setBookingsList(
      allBookings.map((b) => {
        const room = allRooms.find((r) => r.id === b.roomId);
        const house = allHouses.find((h) => h.id === room?.houseId);
        return { ...b, house, room };
      })
    );

    // 2. Load inquiries (match by email or name)
    const allInquiries = reservations.list();
    const mine = allInquiries.filter(
      (i) =>
        (i.email && i.email.toLowerCase() === (user.email || '').toLowerCase()) ||
        (i.fullName && i.fullName.toLowerCase() === (user.name || '').toLowerCase())
    );
    setInquiriesList(mine);
  }, [user.id, user.email, user.name]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCancel = (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      bookings.cancel(id, true);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          My Bookings
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Track your reservation requests and room inquiries
        </p>
      </div>

      {/* ── SECTION 1: BED BOOKINGS ── */}
      <div className="mb-8">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Building2 size={16} /> Bed Reservations
        </h2>

        {bookingsList.length === 0 ? (
          <div className="card text-center py-10">
            <Clock size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-900 font-bold mb-1">No bookings yet</p>
            <p className="text-sm text-slate-500 mb-4">
              Browse houses and reserve a bed to get started.
            </p>
            <Link to="/browse" className="btn-primary inline-flex">
              <Building2 size={16} className="mr-1.5" /> Browse Houses
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {bookingsList.map((b) => (
              <div key={b.id} className="card !p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">
                      {b.house?.name || 'House'}
                    </p>
                    <p className="text-xs text-slate-500">
                      Room {b.roomNumber} · Bed {b.bedNumber}
                      {b.room?.gender ? ` · ${b.room.gender}` : ''}
                    </p>
                    <p className="text-xs text-slate-500 font-mono mt-1">
                      {b.reference}
                    </p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
                <div className="flex items-center justify-between text-sm mt-3 pt-3 border-t border-slate-100">
                  <span className="text-slate-500 text-xs">
                    Move-in: {b.moveInDate}
                  </span>
                  {b.status === 'pending' && (
                    <button
                      onClick={() => handleCancel(b.id)}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                    >
                      Cancel booking
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── SECTION 2: ROOM INQUIRIES (NEW) ── */}
      <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <MessageSquare size={16} /> My Room Inquiries
        </h2>

        {inquiriesList.length === 0 ? (
          <div className="card text-center py-8">
            <MessageSquare size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">
              You haven't submitted any room inquiries yet.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {inquiriesList.map((inq) => {
              // Determine icon based on status
              const StatusIcon =
                inq.status === 'qualified'
                  ? UserCheck
                  : inq.status === 'not_qualified'
                  ? XCircle
                  : Clock;
              const iconColor =
                inq.status === 'qualified'
                  ? 'text-emerald-600 bg-emerald-50'
                  : inq.status === 'not_qualified'
                  ? 'text-rose-600 bg-rose-50'
                  : 'text-amber-600 bg-amber-50';

              return (
                <div key={inq.id} className="card !p-4">
                  <div className="flex items-start gap-3 mb-2">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}
                    >
                      <StatusIcon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-sm font-mono truncate">
                            {inq.reference}
                          </p>
                          <p className="text-xs text-slate-500">
                            Prefers {inq.preferredRoomType} · Move-in{' '}
                            {inq.moveInDate}
                          </p>
                        </div>
                        <StatusBadge status={inq.status} />
                      </div>
                    </div>
                  </div>

                  {/* Qualification feedback */}
                  {inq.status === 'qualified' && (
                    <div className="mt-3 pt-3 border-t border-emerald-100 text-xs text-emerald-800 bg-emerald-50 rounded-lg p-2">
                      🎉 Good news! Your inquiry is qualified. Staff will contact
                      you for the next steps.
                    </div>
                  )}
                  {inq.status === 'not_qualified' && (
                    <div className="mt-3 pt-3 border-t border-rose-100 text-xs text-rose-800 bg-rose-50 rounded-lg p-2">
                      <strong>Not qualified.</strong>{' '}
                      {inq.qualificationReason || 'No reason provided.'}
                    </div>
                  )}
                  {inq.status === 'pending' && (
                    <div className="mt-3 pt-3 border-t border-amber-100 text-xs text-amber-800 bg-amber-50 rounded-lg p-2">
                      ⏳ Your inquiry is being reviewed by our staff.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}