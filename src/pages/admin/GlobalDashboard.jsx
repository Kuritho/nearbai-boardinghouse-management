import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Users, DoorOpen, Wallet, TrendingUp, ArrowRight,
  Receipt, AlertTriangle, Layers, MapPin
} from 'lucide-react';
import { motion } from 'framer-motion';
import StatCard from '../../components/StatCard';
import { globalAnalytics, houses } from '../../services/localDB';

export default function GlobalDashboard() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setData(globalAnalytics.dashboard());
  }, []);

  if (!data) return <p className="p-8 text-slate-500">Loading global analytics…</p>;

  const fmt = (n) => `₱${Number(n).toLocaleString('en-PH')}`;

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Layers className="text-emerald-600" /> Global Dashboard
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Summary of all {data.totalProperties} branches
        </p>
      </div>

      {/* Pending Alerts */}
      {data.totalPendingReservations > 0 && (
        <button
          onClick={() => navigate('/admin/reservations')}
          className="w-full mb-5 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-4 flex items-center justify-between text-left hover:shadow-md transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shrink-0">
              <AlertTriangle size={20} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-amber-900 text-sm">
                {data.totalPendingReservations} reservation{data.totalPendingReservations > 1 ? 's' : ''} awaiting review across all branches
              </p>
              <p className="text-xs text-amber-700">Click to review guest requests</p>
            </div>
          </div>
          <ArrowRight size={20} className="text-amber-600 shrink-0" />
        </button>
      )}

      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Building2} label="Branches" value={data.totalProperties} color="emerald" />
        <StatCard icon={DoorOpen} label="Total Rooms" value={data.totalRooms} color="indigo" />
        <StatCard icon={Users} label="Total Tenants" value={data.totalTenants} color="sky" />
        <StatCard icon={TrendingUp} label="Global Occupancy" value={`${data.overallOccupancy}%`} color="violet" />
      </div>

      {/* Financials */}
      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <div className="card bg-indigo-50 border-indigo-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-white">
              <Wallet size={16} className="text-indigo-600" />
            </div>
            <p className="text-xs font-bold text-slate-600 uppercase">Total Collections</p>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{fmt(data.totalCollections)}</p>
        </div>
        <div className="card bg-rose-50 border-rose-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-white">
              <Receipt size={16} className="text-rose-600" />
            </div>
            <p className="text-xs font-bold text-slate-600 uppercase">Total Expenses</p>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{fmt(data.totalExpenses)}</p>
        </div>
        <div className="card bg-emerald-50 border-emerald-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-white">
              <TrendingUp size={16} className="text-emerald-600" />
            </div>
            <p className="text-xs font-bold text-slate-600 uppercase">Global Net Income</p>
          </div>
          <p className={`text-2xl font-extrabold ${data.totalNetIncome >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {fmt(data.totalNetIncome)}
          </p>
        </div>
      </div>

      {/* Branch Leaderboard */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900">Branch Leaderboard</h2>
          <p className="text-xs text-slate-500">Sorted by Net Income</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="pb-3 font-semibold">Branch</th>
                <th className="pb-3 font-semibold">Tenants</th>
                <th className="pb-3 font-semibold">Occupancy</th>
                <th className="pb-3 font-semibold">Collections</th>
                <th className="pb-3 font-semibold">Net Income</th>
                <th className="pb-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.branchStats.map((b, i) => (
                <motion.tr 
                  key={b.id} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50"
                >
                  <td className="py-3">
                    <p className="font-bold text-slate-900">{b.name}</p>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1">
                      <MapPin size={10} /> {b.city}
                    </p>
                  </td>
                  <td className="py-3">{b.tenants}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: `${b.occupancyRate}%` }} />
                      </div>
                      <span className="text-xs text-slate-600">{b.occupancyRate}%</span>
                    </div>
                  </td>
                  <td className="py-3 font-medium">{fmt(b.collections)}</td>
                  <td className={`py-3 font-bold ${b.netIncome >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {fmt(b.netIncome)}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => {
                        houses.setCurrent(b.id);
                        navigate('/admin');
                        window.location.reload(); // Quick reload to switch property
                      }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
                    >
                      Manage →
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}