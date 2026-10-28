import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, DoorOpen, Wallet, AlertTriangle, TrendingUp, ArrowRight,
  Receipt, Home, Clock, Zap, DollarSign
} from 'lucide-react';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import { analytics, houses } from '../../services/localDB';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [house, setHouse] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const current = houses.current();
    setHouse(current);
    if (current) setData(analytics.dashboard(current.id));
  }, []);

  if (!data) return <p className="p-8 text-slate-500">Loading dashboard…</p>;

  const fmt = (n) => `₱${Number(n).toLocaleString('en-PH')}`;

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-slate-600 text-sm mt-1 flex items-center gap-1.5">
          <Home size={13} /> {house?.name || 'No property'}
        </p>
      </div>

      {/* Pending Reservations Alert */}
      {data.pendingReservations > 0 && (
        <button
          onClick={() => navigate('/admin/reservations')}
          className="w-full mb-5 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-4 flex items-center justify-between text-left hover:shadow-md transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shrink-0">
              <Clock size={20} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-amber-900 text-sm">
                {data.pendingReservations} reservation{data.pendingReservations > 1 ? 's' : ''} awaiting review
              </p>
              <p className="text-xs text-amber-700">Click to review guest requests</p>
            </div>
          </div>
          <ArrowRight size={20} className="text-amber-600 shrink-0" />
        </button>
      )}

      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={DoorOpen} label="Rooms" value={data.roomsCount} color="indigo" />
        <StatCard icon={Users} label="Tenants" value={data.tenantsCount} color="emerald" />
        <StatCard icon={TrendingUp} label="Occupancy" value={`${data.occupancyRate}%`} color="sky" />
        <StatCard icon={AlertTriangle} label="Overdue" value={data.overdueList.length} color="rose" />
      </div>

      {/* Financial Summary Row */}
      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <div className="card-gradient bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-white/60">
              <Wallet size={16} className="text-indigo-600" />
            </div>
            <p className="text-xs font-bold text-slate-600 uppercase">Collections</p>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{fmt(data.totalCollections)}</p>
          <p className="text-xs text-slate-500 mt-1">
            Rent {fmt(data.totalRentPaid)} + Utils {fmt(data.totalUtilPaid)}
          </p>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-rose-100">
              <Receipt size={16} className="text-rose-600" />
            </div>
            <p className="text-xs font-bold text-slate-600 uppercase">Expenses</p>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{fmt(data.totalExpenses)}</p>
        </div>

        <div className="card border-emerald-200 bg-emerald-50/30">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-emerald-100">
              <DollarSign size={16} className="text-emerald-600" />
            </div>
            <p className="text-xs font-bold text-slate-600 uppercase">Net Income</p>
          </div>
          <p className={`text-2xl font-extrabold ${data.netIncome >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {fmt(data.netIncome)}
          </p>
        </div>
      </div>

      {/* Who Owes Money (Actionable Lists) */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        
        {/* Overdue List */}
        <div className="card !p-0 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle size={16} className="text-rose-500" />
              Overdue Rent
            </h2>
            <span className="chip-rose">{data.overdueList.length}</span>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {data.overdueList.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">No overdue payments. 🎉</div>
            ) : (
              data.overdueList.map((r) => (
                <div key={r.id} className="p-3 border-b border-slate-50 last:border-0 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{r.tenantName}</p>
                    <p className="text-xs text-slate-500">Room {r.roomNumber} · {r.billingMonth}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-rose-600">{fmt(r.balance)}</p>
                    <button onClick={() => navigate('/admin/rent')} className="text-[10px] font-bold text-rose-500 hover:underline">Collect</button>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* Unpaid / Partial List */}
        <div className="card !p-0 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-amber-50/50">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <Clock size={16} className="text-amber-500" />
              Pending / Partial Rent
            </h2>
            <span className="chip-amber">{data.unpaidList.length}</span>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {data.unpaidList.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">Everyone is paid up! 🎉</div>
            ) : (
              data.unpaidList.map((r) => (
                <div key={r.id} className="p-3 border-b border-slate-50 last:border-0 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{r.tenantName}</p>
                    <p className="text-xs text-slate-500">Room {r.roomNumber} · {r.billingMonth}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-amber-600">{fmt(r.balance)}</p>
                    <StatusBadge status={r.status} />
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* Utility Breakdown & Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-1 card bg-gradient-to-br from-sky-50 to-blue-50 border-sky-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-white/60">
              <Zap size={18} className="text-sky-600" />
            </div>
            <h2 className="font-bold text-slate-900">Utilities</h2>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Total Billed</p>
              <p className="text-xl font-bold text-slate-900">{fmt(data.totalUtilBilled)}</p>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">Collected</p>
                <p className="text-sm font-bold text-emerald-600">{fmt(data.totalUtilPaid)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-500 uppercase">Unpaid</p>
                <p className="text-sm font-bold text-rose-600">{fmt(data.totalUtilUnpaid)}</p>
              </div>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full mt-2 overflow-hidden flex">
              <div 
                className="h-full bg-emerald-500" 
                style={{ width: `${(data.totalUtilPaid / (data.totalUtilBilled || 1)) * 100}%` }} 
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 card">
          <h2 className="text-base font-bold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => navigate('/admin/rooms')} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left hover:bg-slate-100 transition">
              <DoorOpen size={20} className="text-indigo-500 mb-2" />
              <p className="font-bold text-slate-900 text-sm">Setup Rooms</p>
            </button>
            <button onClick={() => navigate('/admin/tenants')} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left hover:bg-slate-100 transition">
              <Users size={20} className="text-emerald-500 mb-2" />
              <p className="font-bold text-slate-900 text-sm">Add Tenant</p>
            </button>
            <button onClick={() => navigate('/admin/rent')} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left hover:bg-slate-100 transition">
              <Wallet size={20} className="text-sky-500 mb-2" />
              <p className="font-bold text-slate-900 text-sm">Log Payment</p>
            </button>
            <button onClick={() => navigate('/admin/expenses')} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left hover:bg-slate-100 transition">
              <Receipt size={20} className="text-rose-500 mb-2" />
              <p className="font-bold text-slate-900 text-sm">Log Expense</p>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900">Recent Rent Payments</h2>
          <button onClick={() => navigate('/admin/rent')} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            View all <ArrowRight size={12} />
          </button>
        </div>
        {data.recentRent.length === 0 ? (
          <div className="text-center py-8">
            <Wallet size={24} className="text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No rent records yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.recentRent.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900 text-sm truncate">{p.tenantName}</p>
                  <p className="text-xs text-slate-500">Room {p.roomNumber} · {p.billingMonth}</p>
                </div>
                <div className="text-right ml-3">
                  <p className="font-bold text-slate-900 text-sm">₱{p.amountPaid.toLocaleString('en-PH')}</p>
                  <StatusBadge status={p.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
