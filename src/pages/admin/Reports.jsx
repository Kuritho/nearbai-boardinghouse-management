import { useState, useMemo } from 'react';
import { 
  Download, Calendar, Wallet, Receipt, Users, Home, 
  Zap, FileSpreadsheet, Clock, FileArchive
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  rentPayments, utilityCharges, expenses, tenants, 
  reservations, houses 
} from '../../services/localDB';
import { exportToCSV, exportMultipleToCSV } from '../../services/exportService';

export default function Reports() {
  const [range, setRange] = useState('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const house = houses.current();
  
  const allData = useMemo(() => {
    if (!house) return { rents: [], utils: [], expenses: [], tenants: [], reservations: [] };
    return {
      rents: rentPayments.listForHouse(house.id),
      utils: utilityCharges.listForHouse(house.id),
      expenses: expenses.list(house.id),
      tenants: tenants.list(house.id),
      reservations: reservations.list(house.id),
    };
  }, [house]);

  const filterByDate = (list, dateField) => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (range === 'today') {
      start.setHours(0,0,0,0);
      end.setHours(23,59,59,999);
    } else if (range === 'this_week') {
      const day = now.getDay();
      start.setDate(now.getDate() - day);
      start.setHours(0,0,0,0);
    } else if (range === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (range === 'this_year') {
      start = new Date(now.getFullYear(), 0, 1);
    } else if (range === 'custom') {
      if (!customStart || !customEnd) return list;
      start = new Date(customStart);
      end = new Date(customEnd);
      end.setHours(23,59,59,999);
    }

    return list.filter(item => {
      const itemDate = new Date(item[dateField] || item.createdAt);
      return itemDate >= start && itemDate <= end;
    });
  };

  const filteredRents = filterByDate(allData.rents, 'createdAt');
  const filteredUtils = filterByDate(allData.utils, 'createdAt');
  const filteredExpenses = filterByDate(allData.expenses, 'dateLogged');
  const filteredTenants = filterByDate(allData.tenants, 'createdAt');
  const filteredRes = filterByDate(allData.reservations, 'createdAt');

  // Format helpers
  const formatRents = () => filteredRents.map(r => ({
    'Date': new Date(r.createdAt).toLocaleDateString(),
    'Tenant Name': r.tenantName,
    'Room': r.roomNumber,
    'Billing Month': r.billingMonth,
    'Amount Due': r.amountDue,
    'Amount Paid': r.amountPaid,
    'Balance': r.balance,
    'Status': r.status,
    'Due Date': r.dueDate || 'N/A',
    'Method': r.paymentMethod || 'N/A',
    'OR Number': r.orNumber || 'N/A'
  }));

  const formatUtils = () => filteredUtils.map(c => ({
    'Date': new Date(c.createdAt).toLocaleDateString(),
    'Tenant Name': c.tenantName,
    'Room': c.roomNumber,
    'Type': c.chargeType,
    'Amount Billed': c.amountBilled,
    'Period': c.billingPeriod,
    'Status': c.status,
  }));

  const formatExpenses = () => filteredExpenses.map(e => ({
    'Date': e.dateLogged,
    'Description': e.description,
    'Category': e.category,
    'Amount': e.amount,
  }));

  const formatTenants = () => filteredTenants.map(t => ({
    'Name': t.name,
    'Email': t.email,
    'Phone': t.phone,
    'Room': t.room?.number || 'N/A',
    'Status': t.status,
    'Move-in Date': t.moveInDate,
    'Date Added': new Date(t.createdAt).toLocaleDateString(),
  }));

  const formatReservations = () => filteredRes.map(r => ({
    'Reference': r.reference,
    'Name': r.fullName,
    'Phone': r.phone,
    'Email': r.email,
    'Room': r.roomNumber,
    'Move-in Date': r.moveInDate,
    'Status': r.status,
    'Type': r.type,
    'Date Submitted': new Date(r.createdAt).toLocaleDateString(),
  }));

  // Individual exports
  const handleExportRents = () => exportToCSV(`rent-payments-${range}`, formatRents());
  const handleExportUtils = () => exportToCSV(`utility-charges-${range}`, formatUtils());
  const handleExportExpenses = () => exportToCSV(`expenses-${range}`, formatExpenses());
  const handleExportTenants = () => exportToCSV(`tenants-${range}`, formatTenants());
  const handleExportReservations = () => exportToCSV(`reservations-${range}`, formatReservations());

  // NEW: Export everything to one file
  const handleExportAll = () => {
    const sections = [
      { title: 'RENT PAYMENTS', rows: formatRents() },
      { title: 'UTILITY CHARGES', rows: formatUtils() },
      { title: 'EXPENSES', rows: formatExpenses() },
      { title: 'TENANTS', rows: formatTenants() },
      { title: 'RESERVATIONS', rows: formatReservations() },
    ];

    // Filter out empty sections
    const nonEmpty = sections.filter(s => s.rows.length > 0);
    if (nonEmpty.length === 0) {
      alert('No data to export for this date range.');
      return;
    }

    const dateLabel = range === 'custom' 
      ? `${customStart}-to-${customEnd}` 
      : range;
    
    exportMultipleToCSV(`nearbai-full-report-${dateLabel}`, sections);
  };

  return (
    <div className="pb-10">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Reports & Exports</h1>
          <p className="text-slate-600 text-sm mt-1 flex items-center gap-1.5">
            <Home size={13} /> {house?.name || 'No property'}
          </p>
        </div>
        <button 
          onClick={handleExportAll}
          className="btn-primary !px-5 !py-3 !min-h-0"
        >
          <FileArchive size={18} className="mr-2" /> Export All Data
        </button>
      </div>

      {/* Date Filter */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-indigo-50">
            <Calendar size={18} className="text-indigo-600" />
          </div>
          <h2 className="font-bold text-slate-900">Select Date Range</h2>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { id: 'today', label: 'Today' },
            { id: 'this_week', label: 'This Week' },
            { id: 'this_month', label: 'This Month' },
            { id: 'this_year', label: 'This Year' },
            { id: 'custom', label: 'Custom Range' },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setRange(opt.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                range === opt.id 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {range === 'custom' && (
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div>
              <label className="label">Start Date</label>
              <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">End Date</label>
              <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="input" />
            </div>
          </div>
        )}
      </div>

      {/* Tables */}
      <div className="grid lg:grid-cols-2 gap-4">
        
        {/* RENTS */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card !p-0 overflow-hidden">
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
            {filteredRents.slice(0, 5).map(r => (
              <div key={r.id} className="flex justify-between items-center text-sm py-1 border-b border-slate-50 last:border-0">
                <div><p className="font-semibold">{r.tenantName}</p><p className="text-xs text-slate-500">{r.billingMonth}</p></div>
                <p className="font-bold">₱{r.amountPaid.toLocaleString()}</p>
              </div>
            ))}
            {filteredRents.length > 5 && <p className="text-xs text-center text-slate-400 pt-2">+{filteredRents.length - 5} more…</p>}
          </div>
        </motion.div>

        {/* UTILITIES */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card !p-0 overflow-hidden">
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
            {filteredUtils.slice(0, 5).map(c => (
              <div key={c.id} className="flex justify-between items-center text-sm py-1 border-b border-slate-50 last:border-0">
                <div><p className="font-semibold capitalize">{c.chargeType} — {c.tenantName}</p><p className="text-xs text-slate-500">{c.billingPeriod}</p></div>
                <p className="font-bold">₱{c.amountBilled.toLocaleString()}</p>
              </div>
            ))}
            {filteredUtils.length > 5 && <p className="text-xs text-center text-slate-400 pt-2">+{filteredUtils.length - 5} more…</p>}
          </div>
        </motion.div>

        {/* EXPENSES */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card !p-0 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <Receipt size={16} className="text-rose-600" />
              <h3 className="font-bold text-slate-900">Expenses</h3>
            </div>
            <button onClick={handleExportExpenses} className="btn-secondary !py-1.5 !px-3 !min-h-0 text-xs">
              <Download size={12} className="mr-1" /> Export
            </button>
          </div>
          <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto">
            <p className="text-xs text-slate-500 mb-2">{filteredExpenses.length} records</p>
            {filteredExpenses.slice(0, 5).map(e => (
              <div key={e.id} className="flex justify-between items-center text-sm py-1 border-b border-slate-50 last:border-0">
                <div><p className="font-semibold truncate max-w-[180px]">{e.description}</p><p className="text-xs text-slate-500">{e.category} · {e.dateLogged}</p></div>
                <p className="font-bold">₱{e.amount.toLocaleString()}</p>
              </div>
            ))}
            {filteredExpenses.length > 5 && <p className="text-xs text-center text-slate-400 pt-2">+{filteredExpenses.length - 5} more…</p>}
          </div>
        </motion.div>

        {/* TENANTS */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card !p-0 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-emerald-600" />
              <h3 className="font-bold text-slate-900">Tenants</h3>
            </div>
            <button onClick={handleExportTenants} className="btn-secondary !py-1.5 !px-3 !min-h-0 text-xs">
              <Download size={12} className="mr-1" /> Export
            </button>
          </div>
          <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto">
            <p className="text-xs text-slate-500 mb-2">{filteredTenants.length} records</p>
            {filteredTenants.slice(0, 5).map(t => (
              <div key={t.id} className="flex justify-between items-center text-sm py-1 border-b border-slate-50 last:border-0">
                <div><p className="font-semibold">{t.name}</p><p className="text-xs text-slate-500">Room {t.room?.number || '—'}</p></div>
                <p className="text-xs font-medium text-slate-600">{new Date(t.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
            {filteredTenants.length > 5 && <p className="text-xs text-center text-slate-400 pt-2">+{filteredTenants.length - 5} more…</p>}
          </div>
        </motion.div>

        {/* RESERVATIONS */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card !p-0 overflow-hidden lg:col-span-2">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-amber-600" />
              <h3 className="font-bold text-slate-900">Reservations & Bookings</h3>
            </div>
            <button onClick={handleExportReservations} className="btn-secondary !py-1.5 !px-3 !min-h-0 text-xs">
              <Download size={12} className="mr-1" /> Export
            </button>
          </div>
          <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto">
            <p className="text-xs text-slate-500 mb-2">{filteredRes.length} records</p>
            {filteredRes.slice(0, 5).map(r => (
              <div key={r.id} className="flex justify-between items-center text-sm py-1 border-b border-slate-50 last:border-0">
                <div><p className="font-semibold">{r.fullName}</p><p className="text-xs text-slate-500">{r.reference} · {r.status}</p></div>
                <p className="text-xs font-medium text-slate-600">{new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
            {filteredRes.length > 5 && <p className="text-xs text-center text-slate-400 pt-2">+{filteredRes.length - 5} more…</p>}
          </div>
        </motion.div>

        {/* Empty State if nothing exists */}
        {filteredRents.length === 0 && filteredUtils.length === 0 && filteredExpenses.length === 0 && filteredTenants.length === 0 && filteredRes.length === 0 && (
          <div className="card text-center py-12 lg:col-span-2">
            <FileSpreadsheet size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-900 font-semibold mb-1">No data for this period</p>
            <p className="text-sm text-slate-500">Try changing the date range above.</p>
          </div>
        )}
      </div>
    </div>
  );
}