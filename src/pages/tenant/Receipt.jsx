import { useRef, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Download } from 'lucide-react';
import { downloadReceipt } from '../../services/pdfService';

export default function Receipt() {
  const { id } = useParams();
  const [payment, setPayment] = useState(null);
  const receiptRef = useRef();

  useEffect(() => {
    const all = JSON.parse(localStorage.getItem('nb_rent_payments') || '[]');
    setPayment(all.find((p) => p.id === id) || null);
  }, [id]);

  if (!payment)
    return <p className="text-slate-500 text-center py-8">Loading…</p>;

  return (
    <div className="max-w-md mx-auto">
      <div
        ref={receiptRef}
        className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
      >
        <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 p-6 text-white">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold tracking-tight">NearBai</p>
            <p className="text-[10px] uppercase tracking-wider opacity-80">
              Official Receipt
            </p>
          </div>
          <p className="text-xs font-semibold uppercase opacity-80 mb-1">
            Total Paid
          </p>
          <p className="text-4xl font-bold">
            ₱{payment.amountPaid.toLocaleString('en-PH')}
          </p>
          <p className="text-xs mt-1 font-mono">{payment.orNumber || '—'}</p>
        </div>
        <div className="p-6 space-y-3 text-sm">
          <Row label="Billing Month" value={payment.billingMonth} />
          <Row
            label="Amount Due"
            value={`₱${payment.amountDue.toLocaleString('en-PH')}`}
          />
          <Row
            label="Amount Paid"
            value={`₱${payment.amountPaid.toLocaleString('en-PH')}`}
          />
          <Row
            label="Payment Method"
            value={(payment.paymentMethod || '—').toUpperCase()}
          />
          <Row
            label="OR Number"
            value={payment.orNumber || '—'}
            mono
          />
        </div>
      </div>

      <button
        onClick={() =>
          downloadReceipt(
            receiptRef.current,
            `receipt-${payment.orNumber || payment.id}.pdf`
          )
        }
        className="btn-primary w-full mt-4"
      >
        <Download size={18} className="mr-2" /> Download PDF
      </button>
    </div>
  );
}

function Row({ label, value, mono }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-slate-500 text-xs shrink-0">{label}</span>
      <span
        className={`font-semibold text-slate-900 text-right text-sm ${
          mono ? 'font-mono text-xs' : ''
        }`}
      >
        {value}
      </span>
    </div>
  );
}