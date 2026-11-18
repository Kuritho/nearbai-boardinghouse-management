import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BedDouble, Users, MessageSquare, ArrowRight, CheckCircle2, UserCheck
} from 'lucide-react';
import { analytics, houses } from '../../services/localDB';
import AnimatedNumber from '../../components/AnimatedNumber';

export default function CaretakerDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    const house = houses.current();
    if (house) {
      setData(analytics.dashboard(house.id));
    }
  }, []);

  if (!data) return <div className="p-8 text-center text-slate-500">Loading dashboard...</div>;

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };
  const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="pb-10">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Caretaker Dashboard
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Manage tenants, inquiries, and bed availability
        </p>
      </div>

      {/* ── TOP STATS ── */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"
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
            {data.occupiedBeds} / {data.totalCapacity} beds occupied
          </p>
        </motion.div>

        <motion.div variants={item} className="card !p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-emerald-50">
              <Users size={14} className="text-emerald-600" />
            </div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Active Tenants
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            <AnimatedNumber value={data.tenantsCount} />
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Currently living in the branch
          </p>
        </motion.div>

        <motion.div variants={item} className="card !p-4 !bg-amber-50 !border-amber-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-amber-100">
              <MessageSquare size={14} className="text-amber-600" />
            </div>
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
              Pending Inquiries
            </span>
          </div>
          <p className="text-2xl font-bold text-amber-700">
            <AnimatedNumber value={data.pendingInquiries} />
          </p>
          <button
            onClick={() => navigate('/caretaker/reservations')}
            className="text-xs text-amber-700 font-semibold mt-1 hover:underline"
          >
            Review now →
          </button>
        </motion.div>
      </motion.div>

      {/* ── QUICK ACTIONS ── */}
      <h2 className="text-base font-bold text-slate-900 mb-3">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        <button
          onClick={() => navigate('/caretaker/reservations')}
          className="card !p-5 text-left hover:shadow-md transition flex items-center justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center mb-2">
              <MessageSquare size={18} className="text-amber-600" />
            </div>
            <p className="font-bold text-slate-900 text-sm">Review Inquiries</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Qualify or reject applicant inquiries
            </p>
          </div>
          <ArrowRight size={18} className="text-slate-400" />
        </button>

        <button
          onClick={() => navigate('/caretaker/tenants')}
          className="card !p-5 text-left hover:shadow-md transition flex items-center justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center mb-2">
              <Users size={18} className="text-indigo-600" />
            </div>
            <p className="font-bold text-slate-900 text-sm">Manage Tenants</p>
            <p className="text-xs text-slate-500 mt-0.5">
              View and manage current occupants
            </p>
          </div>
          <ArrowRight size={18} className="text-slate-400" />
        </button>
      </div>

      {/* ── RECENT INQUIRIES ── */}
      <div className="card !p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Recent Inquiries</h2>
          <button
            onClick={() => navigate('/caretaker/reservations')}
            className="text-xs font-semibold text-indigo-600 hover:underline"
          >
            View All
          </button>
        </div>
        <div className="p-4">
          {data.pendingInquiries === 0 ? (
            <div className="text-center py-6">
              <CheckCircle2 size={32} className="mx-auto text-emerald-400 mb-2" />
              <p className="text-sm text-slate-500">No pending inquiries right now.</p>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <UserCheck size={18} className="text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900">
                  {data.pendingInquiries} inquiry
                  {data.pendingInquiries !== 1 ? 'ies' : ''} waiting for review
                </p>
                <p className="text-xs text-slate-500">
                  Applicants are waiting to be qualified.
                </p>
              </div>
              <button
                onClick={() => navigate('/caretaker/reservations')}
                className="btn-secondary !py-2 !px-3 !text-xs !min-h-0"
              >
                Review
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}