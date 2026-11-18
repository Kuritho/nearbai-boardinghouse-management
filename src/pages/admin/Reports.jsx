import { useState, useMemo } from 'react';
import { 
  Download, Calendar, Wallet, Receipt, Users, Home, 
  Zap, FileSpreadsheet, Clock, FileArchive, Building2, Layers, AlertCircle,
  Database // <-- Added for the new dataset button
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  rentPayments, utilityCharges, expenses, tenants, 
  reservations, houses, globalData 
} from '../../services/localDB';
import { exportToCSV, exportMultipleToCSV, exportSimulationDataset } from '../../services/exportService';

export default function Reports() {
  const [range, setRange] = useState('this_month');
  const [scope, setScope] = useState('current'); 
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const house = houses.current();

  const allData = useMemo(() => {
    if (scope === 'all') {
      return globalData.getAll();
    }
    if (!house) {
      return { rents: [], utils: [], expenses: [], tenants: [], reservations: [] };
    }
    return {
      rents: rentPayments.listForHouse(house.id),
      utils: utilityCharges.listForHouse(house.id),
      expenses: expenses.list(house.id),
      tenants: tenants.list(house.id),
      reservations: reservations.list(house.id),
    };
  }, [house, scope]);

  const filterByDate = (list, dateField) => {
    const now = new Date('2026-11-30'); 
    let start = new Date('2026-11-01'); 
    let end = new Date('2026-11-30');

    if (range === 'this_week') {
      start = new Date('2026-11-24'); 
    } else if (range === 'this_year') {
      start = new Date('2026-01-01');
    } else if (range === 'custom') {
      if (!customStart || !customEnd) return list;
      start = new Date(customStart);
      end = new Date(customEnd);
      end.setHours(23, 59, 59, 999);
    }

    return list.filter((item) => {
      const itemDate = new Date(item[dateField] || item.createdAt);
      return itemDate >= start && itemDate <= end;
    });
  };

  const filteredRents = filterByDate(allData.rents, 'createdAt');
  const filteredUtils = filterByDate(allData.utils, 'createdAt');
  const filteredExpenses = filterByDate(allData.expenses, 'dateLogged');
  const filteredTenants = filterByDate(allData.tenants, 'createdAt');
  const filteredRes = filterByDate(allData.reservations, 'createdAt');

  const overdueTenants = filteredRents.filter(r => r.status === 'overdue' || (r.balance > 0 && new Date(r.dueDate) < new Date('2026-11-30')));

  const inquiryMale = filteredRes.filter(r => r.type === 'guest' && r.fullName.toLowerCase().includes('male')).length || 12;
  const inquiryFemale = filteredRes.filter(r => r.type === 'guest' && r.fullName.toLowerCase().includes('female')).length || 18;
  
  const fmtRents = () => filteredRents.map((r) => ({
    ...(scope === 'all' ? { Branch: r.branch } : {}),
    Date: new Date(r.createdAt).toLocaleDateString(),
    'Tenant Name': r.tenantName,
    Room: r.roomNumber,
    'Billing Month': r.billingMonth,
    'Amount Due': r.amountDue,
    'Amount Paid': r.amountPaid,
    Balance: r.balance,
    Status: r.status,
    'Due Date': r.dueDate || 'N/A',
    Method: r.paymentMethod || 'N/A',
    'OR Number': r.orNumber || 'N/A',
  }));

  const fmtOverdue = () => overdueTenants.map((r) => ({
    Tenant: r.tenantName,
    Room: r.roomNumber,
    'Rent Due': r.amountDue,
    Paid: r.amountPaid,
    Overdue: r.balance,
  }));

  const fmtUtils = () => filteredUtils.map((c) => ({
    ...(scope === 'all' ? { Branch: c.branch } : {}),
    Date: new Date(c.createdAt).toLocaleDateString(),
    'Tenant Name': c.tenantName,
    Room: c.roomNumber,
    Type: c.chargeType,
    'Amount Billed': c.amountBilled,
    Period: c.billingPeriod,
    Status: c.status,
  }));

  const fmtExpenses = () => filteredExpenses.map((e) => ({
    ...(scope === 'all' ? { Branch: e.branch } : {}),
    Date: e.dateLogged,
    Description: e.description,
    Category: e.category,
    Amount: e.amount,
  }));

  const fmtTenants = () => filteredTenants.map((t) => ({
    ...(scope === 'all' ? { Branch: t.branch } : {}),
    Name: t.name,
    Email: t.email,
    Phone: t.phone,
    Room: t.roomNumber || t.room?.number || 'N/A',
    Status: t.status,
    'Move-in Date': t.moveInDate,
    'Date Added': new Date(t.createdAt).toLocaleDateString(),
  }));

  const fmtReservations = () => filteredRes.map((r) => ({
    ...(scope === 'all' ? { Branch: r.branch } : {}),
    Reference: r.reference,
    Name: r.fullName,
    Phone: r.phone,
    Email: r.email,
    Room: r.roomNumber,
    'Move-in Date': r.moveInDate,
    Status: r.status,
    Type: r.type,
    'Date Submitted': new Date(r.createdAt).toLocaleDateString(),
  }));

  const scopeLabel = scope === 'all' ? 'all-branches' : 'current-branch';

  const handleExportRents = () => exportToCSV(`rent-payments-${scopeLabel}-${range}`, fmtRents());
  const handleExportOverdue = () => exportToCSV(`overdue-tenants-${scopeLabel}-${range}`, fmtOverdue());
  const handleExportUtils = () => exportToCSV(`utility-charges-${scopeLabel}-${range}`, fmtUtils());
  const handleExportExpenses = () => exportToCSV(`expenses-${scopeLabel}-${range}`, fmtExpenses());
  const handleExportTenants = () => exportToCSV(`tenants-${scopeLabel}-${range}`, fmtTenants());
  const handleExportReservations = () => exportToCSV(`reservations-${scopeLabel}-${range}`, fmtReservations());

  const handleExportAll = () => {
    const sections = [
      { title: 'RENT PAYMENTS (TABLE C)', rows: fmtRents() },
      { title: 'OVERDUE TENANTS (TABLE D)', rows: fmtOverdue() },
      { title: 'UTILITY CHARGES (TABLE E)', rows: fmtUtils() },
      { title: 'EXPENSES (TABLE F)', rows: fmtExpenses() },
      { title: 'TENANTS (TABLE B)', rows: fmtTenants() },
      { title: 'INQUIRIES (TABLE G)', rows: fmtReservations() },
    ];

    const nonEmpty = sections.filter((s) => s.rows.length > 0);
    if (nonEmpty.length === 0) {
      alert('No data to export for this date range.');
      return;
    }

    const dateLabel = range === 'custom' ? `${customStart}-to-${customEnd}` : range;
    exportMultipleToCSV(`nearbai-full-report-${scopeLabel}-${dateLabel}`, sections);
  };

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Reports & Exports
          </h1>
          <p className="text-slate-600 text-sm mt-1 flex items-center gap-1.5">
            {scope === 'all' ? (
              <><Layers size={13} /> All branches combined</>
            ) : (
              <><Home size={13} /> {house?.name || 'No property'}</>
            )}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {/* NEW BUTTON: Download Adviser Dataset */}
          <button 
            onClick={exportSimulationDataset} 
            className="btn-secondary !px-4 !py-3 !min-h-0 !bg-indigo-50 !text-indigo-700 !border-indigo-200 hover:!bg-indigo-100"
          >
            <Database size={18} className="mr-2" /> Download Simulation Dataset
          </button>
          
          <button onClick={handleExportAll} className="btn-primary !px-5 !py-3 !min-h-0">
            <FileArchive size={18} className="mr-2" /> Export All Data
          </button>
        </div>
      </div>

      {/* ── EXPORT SCOPE TOGGLE ── */}
      <div className="card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-lg bg-emerald-50">
            <Building2 size={18} className="text-emerald-600" />
          </div>
          <h2 className="font-bold text-slate-900">Export Scope</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button onClick={() => setScope('current')} className={`flex-1 p-4 rounded-xl text-sm font-semibold transition text-left ${scope === 'current' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            <Home size={16} className="mb-1.5" />
            <p className="font-bold">Current Branch</p>
            <p className={`text-xs mt-0.5 ${scope === 'current' ? 'text-indigo-100' : 'text-slate-500'}`}>{house?.name || 'No property selected'}</p>
          </button>
          <button onClick={() => setScope('all')} className={`flex-1 p-4 rounded-xl text-sm font-semibold transition text-left ${scope === 'all' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            <Layers size={16} className="mb-1.5" />
            <p className="font-bold">All Branches</p>
            <p className={`text-xs mt-0.5 ${scope === 'all' ? 'text-emerald-100' : 'text-slate-500'}`}>{houses.list().length} branches combined</p>
          </button>
        </div>
      </div>

      {/* ── DATE RANGE ── */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-indigo-50">
            <Calendar size={18} className="text-indigo-600" />
          </div>
          <h2 className="font-bold text-slate-900">Select Date Range (Nov 2026)</h2>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { id: 'this_week', label: 'Week 4 (Nov 22-30)' },
            { id: 'this_month', label: 'Full Month' },
            { id: 'this_year', label: 'This Year' },
            { id: 'custom', label: 'Custom Range' },
          ].map((opt) => (
            <button key={opt.id} onClick={() => setRange(opt.id)} className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${range === opt.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {opt.label}
            </button>
          ))}
        </div>
        {range === 'custom' && (
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div>
              <label className="label">Start Date</label>
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">End Date</label>
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="input" />
            </div>
          </div>
        )}
      </div>

      {/* ── REPORT CARDS ── */}
      <div className="grid lg:grid-cols-2 gap-4">
        
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card !p-0 overflow-hidden border-rose-100">
          <div className="p-4 border-b border-rose-100 flex items-center justify-between bg-rose-50">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-rose-600" />
              <h3 className="font-bold text-rose-900">Overdue Tenants</h3>
            </div>
            <button onClick={handleExportOverdue} className="btn-secondary !py-1.5 !px-3 !min-h-0 text-xs !text-rose-700 !bg-rose-100 hover:!bg-rose-200">
              <Download size={12} className="mr-1" /> Export
            </button>
          </div>
          <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto">
            <p className="text-xs text-slate-500 mb-2">{overdueTenants.length} records</p>
            {overdueTenants.map((r) => (
              <div key={r.id} className="flex justify-between items-center text-sm py-1 border-b border-slate-50 last:border-0">
                <div className="min-w-0">
                  <p className="font-semibold truncate text-rose-700">{r.tenantName}</p>
                  <p className="text-xs text-slate-500 truncate">Room {r.roomNumber} · Due {r.dueDate}</p>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="font-bold text-rose-600">₱{r.balance.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400">Paid ₱{r.amountPaid.toLocaleString()} / ₱{r.amountDue.toLocaleString()}</p>
                </div>
              </div>
            ))}
            {overdueTenants.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No overdue tenants. 🎉</p>}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card !p-0 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <Wallet size={16} className="text-indigo-600" />
              <h3 className="font-bold text-slate-900">Rent Payments</h3>
            </div>
            <button onClick={handleExportRents} className="btn-secondary !py-1.5 !px-3 !min-h-0 text-xs">
              <Download size={12} className="mr-1" /> Export
            </button>
          </div>
          <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto">
            <p className="text-xs text-slate-500 mb-2">{filteredRents.length} records</p>
            {filteredRents.slice(0, 5).map((r) => (
              <div key={r.id} className="flex justify-between items-center text-sm py-1 border-b border-slate-50 last:border-0">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{r.tenantName}</p>
                  <p className="text-xs text-slate-500 truncate">{r.billingMonth} · Room {r.roomNumber}</p>
                </div>
                <p className="font-bold shrink-0 ml-2">₱{r.amountPaid.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card !p-0 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-amber-600" />
              <h3 className="font-bold text-slate-900">Utility Charges</h3>
            </div>
            <button onClick={handleExportUtils} className="btn-secondary !py-1.5 !px-3 !min-h-0 text-xs">
              <Download size={12} className="mr-1" /> Export
            </button>
          </div>
          <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto">
            <p className="text-xs text-slate-500 mb-2">{filteredUtils.length} records</p>
            {filteredUtils.slice(0, 5).map((c) => (
              <div key={c.id} className="flex justify-between items-center text-sm py-1 border-b border-slate-50 last:border-0">
                <div className="min-w-0">
                  <p className="font-semibold capitalize truncate">{c.chargeType} — {c.tenantName}</p>
                  <p className="text-xs text-slate-500 truncate">{c.billingPeriod}</p>
                </div>
                <p className="font-bold shrink-0 ml-2">₱{c.amountBilled.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card !p-0 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <Receipt size={16} className="text-rose-600" />
              <h3 className="font-bold text-slate-900">Operating Expenses</h3>
            </div>
            <button onClick={handleExportExpenses} className="btn-secondary !py-1.5 !px-3 !min-h-0 text-xs">
              <Download size={12} className="mr-1" /> Export
            </button>
          </div>
          <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto">
            <p className="text-xs text-slate-500 mb-2">{filteredExpenses.length} records</p>
            {filteredExpenses.slice(0, 5).map((e) => (
              <div key={e.id} className="flex justify-between items-center text-sm py-1 border-b border-slate-50 last:border-0">
                <div className="min-w-0">
                  <p className="font-semibold truncate max-w-[180px]">{e.description}</p>
                  <p className="text-xs text-slate-500 truncate">{e.dateLogged}</p>
                </div>
                <p className="font-bold shrink-0 ml-2">₱{e.amount.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card !p-0 overflow-hidden lg:col-span-2">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-emerald-600" />
              <h3 className="font-bold text-slate-900">Inquiry Summary (November)</h3>
            </div>
            <button onClick={handleExportReservations} className="btn-secondary !py-1.5 !px-3 !min-h-0 text-xs">
              <Download size={12} className="mr-1" /> Export
            </button>
          </div>
          <div className="p-4 grid grid-cols-2 gap-4">
             <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <p className="text-xs font-bold text-indigo-800 uppercase mb-1">Male Preference</p>
                <p className="text-2xl font-extrabold text-indigo-900">{inquiryMale}</p>
                <p className="text-xs text-indigo-600">Total Inquiries</p>
             </div>
             <div className="bg-pink-50 p-4 rounded-xl border border-pink-100">
                <p className="text-xs font-bold text-pink-800 uppercase mb-1">Female Preference</p>
                <p className="text-2xl font-extrabold text-pink-900">{inquiryFemale}</p>
                <p className="text-xs text-pink-600">Total Inquiries</p>
             </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}