export default function StatusBadge({ status }) {
  const config = {
    paid:          { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', dot: 'bg-emerald-500' },
    partial:       { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-100',   dot: 'bg-amber-500' },
    unpaid:        { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-100',    dot: 'bg-rose-500' },
    vacant:        { bg: 'bg-slate-100',  text: 'text-slate-600',   border: 'border-slate-200',   dot: 'bg-slate-400' },
    reserved:      { bg: 'bg-sky-50',     text: 'text-sky-700',     border: 'border-sky-100',     dot: 'bg-sky-500' },
    occupied:      { bg: 'bg-indigo-50',  text: 'text-indigo-700',  border: 'border-indigo-100',  dot: 'bg-indigo-500' },
    pending:       { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-100',   dot: 'bg-amber-500' },
    overdue:       { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-100',    dot: 'bg-rose-500' },
    rejected:      { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-100',    dot: 'bg-rose-500' },
    approved:      { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', dot: 'bg-emerald-500' },
    // NEW inquiry statuses
    qualified:     { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', dot: 'bg-emerald-500' },
    not_qualified: { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-100',    dot: 'bg-rose-500' },
  };
  const c = config[status] || config.vacant;
  const label = (status || '').replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold capitalize border ${c.bg} ${c.text} ${c.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {label}
    </span>
  );
}