import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, ArrowLeft, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PaymentPending() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);

  useEffect(() => {
    const all = JSON.parse(localStorage.getItem('nb_rent_payments') || '[]');
    setPayment(all.find((p) => p.id === id) || null);
  }, [id]);

  return (
    <div className="max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <div className="inline-flex w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 items-center justify-center mb-4 shadow-lg">
          <Clock size={40} className="text-white" strokeWidth={2.5} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Awaiting Approval</h1>
        <p className="text-sm text-slate-500 mt-1">
          Your payment is being verified by the admin.
        </p>
      </motion.div>

      <div className="card mb-4">
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
            <Wallet size={22} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-slate-500">Amount submitted</p>
            <p className="text-2xl font-bold text-slate-900">
              ₱{(payment?.amountPaid || 0).toLocaleString('en-PH')}
            </p>
          </div>
          <span className="chip bg-amber-100 text-amber-700 border-amber-200">
            PENDING
          </span>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-amber-800 mb-1">
            What happens next?
          </p>
          <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
            <li>Admin reviews your payment</li>
            <li>Once approved, your receipt becomes available</li>
            <li>This page auto-refreshes</li>
          </ul>
        </div>
      </div>

      <button
        onClick={() => navigate('/tenant')}
        className="btn-secondary w-full"
      >
        <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
      </button>
    </div>
  );
}