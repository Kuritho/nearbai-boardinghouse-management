import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Wallet, TrendingUp, AlertCircle, Activity, FileText, CheckCircle2,
  BedDouble, Users, ArrowRight, Database, Trash2
} from 'lucide-react';
import { analytics, houses } from '../../services/localDB';
import { seedDemoData, wipeAllData } from '../../services/seedData';
import AnimatedNumber from '../../components/AnimatedNumber';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [demand, setDemand] = useState([]);

  useEffect(() => {
    const house = houses.current();
    if (house) {
      setData(analytics.dashboard(house.id));
      setDemand(analytics.roomDemand(house.id));
    }
  }, []);

  if (!data) return <div className="p-8 text-center text-slate-500">Loading dashboard...</div>;

  const maxDemand = Math.max(...demand.map((d) => d.inquiries), 1);

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };
  const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

  // Weekly Inquiry Trend (Table H)
  const inquiryTrendData = [
    { name: 'W1', total: 5, qualified: 2 },
    { name: 'W2', total: 7, qualified: 3 },
    { name: 'W3', total: 8, qualified: 4 },
    { name: 'W4', total: 10, qualified: 6 },
  ];
  const maxVal = 12;
  const chartHeight = 180;
  const chartWidth = 400;
  const xStep = chartWidth / (inquiryTrendData.length - 1);
  const makePath = (key) =>
    inquiryTrendData
      .map((d, i) => {
        const x = i * xStep;
        const y = chartHeight - (d[key] / maxVal) * chartHeight;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');

  const handleLoadData = () => {
    if (!window.confirm('Load randomized demo tenants, payments, utilities, expenses, and inquiries? Existing data will be replaced.')) return;
    try {
      const result = seedDemoData();
      alert(`Demo data loaded: ${result.rooms} rooms, ${result.tenants} tenants, ${result.inquiries} inquiries.`);
      window.location.reload();
    } catch (error) {
      alert(error.message || 'Unable to load demo data.');
    }
  };

  const handleClearData = () => {
    if (!window.confirm('Clear all application data? This cannot be undone.')) return;
    wipeAllData();
    window.location.href = '/login';
  };

  return (
    <div className="pb-10">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-slate-600 text-sm mt-1">November 2026 Overview</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button onClick={handleLoadData} className="btn-primary !px-3 !py-2">
            <Database size={16} className="mr-2" /> Load All Data
          </button>
          <button onClick={handleClearData} className="btn-secondary !px-3 !py-2 !border-rose-200 !text-rose-600">
            <Trash2 size={16} className="mr-2" /> Clear Data
          </button>
          <button
            onClick={() => navigate('/admin/reports')}
            className="btn-secondary hidden sm:flex"
          >
            <FileText size={16} className="mr-2" /> Generate Report
          </button>
        </div>
      </div>

      {/* ── TOP STATS ── */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      >
        <motion.div variants={item} className="card !p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-indigo-50">
              <BedDouble size={14} className="text-indigo-600" />
            </div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Occupancy
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            <AnimatedNumber value={data.occupancyRate} suffix="%" />
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {data.occupiedBeds} / {data.totalCapacity} beds
          </p>
        </motion.div>

        <motion.div variants={item} className="card !p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-emerald-50">
              <Wallet size={14} className="text-emerald-600" />
            </div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Rent Collected
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            <AnimatedNumber value={data.totalRentPaid} prefix="₱" />
          </p>
          <p className="text-xs text-slate-500 mt-1">
            of ₱{data.totalRentDue.toLocaleString()} billed
          </p>
        </motion.div>

        <motion.div variants={item} className="card !p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-sky-50">
              <TrendingUp size={14} className="text-sky-600" />
            </div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Net Cash Flow
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            <AnimatedNumber value={data.netIncome} prefix="₱" />
          </p>
          <p className="text-xs text-slate-500 mt-1">
            after ₱{data.totalExpenses.toLocaleString()} expenses
          </p>
        </motion.div>

        <motion.div
          variants={item}
          className="card !p-4 !bg-rose-50 !border-rose-100"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-rose-100">
              <AlertCircle size={14} className="text-rose-600" />
            </div>
            <span className="text-xs font-semibold text-rose-800 uppercase tracking-wide">
              Overdue
            </span>
          </div>
          <p className="text-2xl font-bold text-rose-700">
            <AnimatedNumber value={data.overdueList.length} /> tenants
          </p>
          <button
            onClick={() => navigate('/admin/rent')}
            className="text-xs text-rose-600 font-semibold mt-1 hover:underline"
          >
            View Details →
          </button>
        </motion.div>
      </motion.div>

      {/* ── STEP 4: ROOM DEMAND STATISTICS ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="card !p-0 overflow-hidden mb-6"
      >
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <Users size={18} className="text-indigo-600" /> Room Demand Statistics
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Matches qualified inquiries against available beds
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/reservations')}
            className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
          >
            Manage Inquiries <ArrowRight size={12} />
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
          {demand.map((room) => (
            <div
              key={room.id}
              className="border border-slate-100 rounded-xl p-3 bg-white"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-bold text-slate-900 text-sm">
                    Room {room.roomNumber}
                  </p>
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">
                    {room.type} · {room.capacity} beds
                  </p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    room.vacant === 0
                      ? 'bg-rose-50 text-rose-600'
                      : 'bg-emerald-50 text-emerald-600'
                  }`}
                >
                  {room.vacant === 0 ? 'FULL' : `${room.vacant} VACANT`}
                </span>
              </div>

              <div className="mb-2">
                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                  <span>Qualified Inquiries</span>
                  <span className="font-bold text-slate-700">
                    {room.qualified}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{
                      width: `${(room.qualified / maxDemand) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-50">
                <span>
                  Total Inquiries:{' '}
                  <strong className="text-slate-700">{room.inquiries}</strong>
                </span>
                <span>
                  Pending:{' '}
                  <strong className="text-amber-600">{room.pending}</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── WEEKLY INQUIRY TREND + KEY RESULTS ── */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card lg:col-span-2 !p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <Activity size={18} className="text-indigo-600" /> Weekly Inquiry Trend
            </h2>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-indigo-500" /> Total
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-violet-400" /> Qualified
              </div>
            </div>
          </div>

          <div className="w-full flex justify-center">
            <svg
              viewBox={`-30 -10 ${chartWidth + 60} ${chartHeight + 60}`}
              className="w-full max-w-lg"
            >
              {[0, 2, 4, 6, 8, 10, 12].map((v) => {
                const y = chartHeight - (v / maxVal) * chartHeight;
                return (
                  <g key={v}>
                    <line
                      x1="0"
                      y1={y}
                      x2={chartWidth}
                      y2={y}
                      stroke="#f1f5f9"
                      strokeWidth="1"
                    />
                    <text
                      x="-10"
                      y={y + 4}
                      textAnchor="end"
                      fontSize="10"
                      fill="#94a3b8"
                    >
                      {v}
                    </text>
                  </g>
                );
              })}

              <path
                d={makePath('total')}
                fill="none"
                stroke="#6366f1"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={makePath('qualified')}
                fill="none"
                stroke="#a78bfa"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {inquiryTrendData.map((d, i) => {
                const x = i * xStep;
                const yT = chartHeight - (d.total / maxVal) * chartHeight;
                const yQ = chartHeight - (d.qualified / maxVal) * chartHeight;
                return (
                  <g key={d.name}>
                    <circle
                      cx={x}
                      cy={yT}
                      r="4"
                      fill="#6366f1"
                      stroke="#fff"
                      strokeWidth="2"
                    />
                    <circle
                      cx={x}
                      cy={yQ}
                      r="4"
                      fill="#a78bfa"
                      stroke="#fff"
                      strokeWidth="2"
                    />
                    <text
                      x={x}
                      y={chartHeight + 20}
                      textAnchor="middle"
                      fontSize="11"
                      fill="#64748b"
                      fontWeight="600"
                    >
                      {d.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="card !p-5"
        >
          <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600" /> Key Results
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-1 border-b border-slate-50 last:border-0">
              <span className="text-slate-500">Occupancy Rate</span>
              <span className="font-bold text-slate-900">
                {data.occupancyRate}%
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-50 last:border-0">
              <span className="text-slate-500">Rent Collection Rate</span>
              <span className="font-bold text-slate-900">
                {Math.round((data.totalRentPaid / data.totalRentDue) * 100)}%
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-50 last:border-0">
              <span className="text-slate-500">Utility Collection Rate</span>
              <span className="font-bold text-slate-900">
                {Math.round((data.totalUtilPaid / data.totalUtilBilled) * 100)}%
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-50 last:border-0">
              <span className="text-slate-500">Overdue Tenants</span>
              <span className="font-bold text-rose-600">
                {data.overdueList.length}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-50 last:border-0">
              <span className="text-slate-500">Uncollected Bills</span>
              <span className="font-bold text-rose-600">
                ₱
                {(
                  data.totalRentDue -
                  data.totalRentPaid +
                  data.totalUtilUnpaid
                ).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <span className="text-slate-900 font-bold">Net Cash Flow</span>
              <span className="font-extrabold text-emerald-600">
                ₱{data.netIncome.toLocaleString()}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── OVERDUE TENANTS TABLE ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card !p-0 overflow-hidden"
      >
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">
            Action Required: Overdue Tenants
          </h2>
          <button
            onClick={() => navigate('/admin/rent')}
            className="text-xs font-semibold text-indigo-600 hover:underline"
          >
            View All
          </button>
        </div>
        {data.overdueList.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            <CheckCircle2 size={32} className="mx-auto text-emerald-400 mb-2" />
            No overdue tenants. Great job!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 font-semibold">Tenant</th>
                  <th className="px-4 py-3 font-semibold">Room</th>
                  <th className="px-4 py-3 font-semibold text-right">Rent Due</th>
                  <th className="px-4 py-3 font-semibold text-right">Paid</th>
                  <th className="px-4 py-3 font-semibold text-right text-rose-600">
                    Overdue
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.overdueList.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {r.tenantName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.roomNumber}</td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      ₱{r.amountDue.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      ₱{r.amountPaid.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-rose-600">
                      ₱{r.balance.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* ── DASHBOARD CONTROLS ── */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={handleLoadData}
          className="card p-4 flex items-center justify-between bg-indigo-50 border border-indigo-200"
        >
          <div className="flex items-center gap-3">
            <Database size={24} className="text-indigo-600" />
            <div className="text-sm">
              <p className="font-semibold text-slate-900">
                Load Demo Data
              </p>
              <p className="text-slate-500">
                Populate dashboard with sample data
              </p>
            </div>
          </div>
          <ArrowRight size={16} className="text-indigo-600" />
        </button>

        <button
          onClick={handleClearData}
          className="card p-4 flex items-center justify-between bg-rose-50 border border-rose-200"
        >
          <div className="flex items-center gap-3">
            <Trash2 size={24} className="text-rose-600" />
            <div className="text-sm">
              <p className="font-semibold text-slate-900">
                Clear All Data
              </p>
              <p className="text-slate-500">
                Remove all data and reset dashboard
              </p>
            </div>
          </div>
          <ArrowRight size={16} className="text-rose-600" />
        </button>
      </div>
    </div>
  );
}