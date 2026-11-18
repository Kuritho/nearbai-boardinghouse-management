import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Loader2, CheckCircle2, AlertCircle, Copy, Check, ArrowLeft, Smartphone,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { rentPayments, utilityCharges, settings as settingsDB } from '../../services/localDB';
import { runOCR } from '../../services/ocrService';

const PAYMENT_METHODS = [
  { id: 'gcash', label: 'GCash', sub: 'Pay via GCash app', emoji: '💙', grad: 'from-blue-500 to-blue-600' },
  { id: 'bank', label: 'Bank Transfer', sub: 'BPI / BDO / etc.', emoji: '🏦', grad: 'from-emerald-500 to-teal-600' },
];

export default function PayBill() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState([]);
  const [fetching, setFetching] = useState(true);

  const [step, setStep] = useState(1);
  const [method, setMethod] = useState(null);
  const [ownerAccounts, setOwnerAccounts] = useState(null);

  const [ocrPreview, setOcrPreview] = useState(null);
  const [ocrText, setOcrText] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [manualRef, setManualRef] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [copiedField, setCopiedField] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const rents = rentPayments.listForTenant(user.id)
      .filter((r) => r.status !== 'paid')
      .map((r) => ({
        id: 'rent-' + r.id,
        kind: 'rent',
        refId: r.id,
        label: `Rent — ${r.billingMonth}`,
        amount: r.balance,
      }));
    const utils = utilityCharges.listForTenant(user.id)
      .filter((u) => u.status === 'unpaid')
      .map((u) => ({
        id: 'util-' + u.id,
        kind: 'utility',
        refId: u.id,
        label: `${u.chargeType} — ${u.billingPeriod}`,
        amount: u.amountBilled,
      }));
    setItems([...rents, ...utils]);
    setOwnerAccounts(settingsDB.get());
    setFetching(false);
  }, [user.id]);

  const toggleItem = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const selectedItems = items.filter((i) => selected.includes(i.id));
  const total = selectedItems.reduce((s, i) => s + i.amount, 0);

  // Resolve active account fields based on method
  const activeAccount =
    method && ownerAccounts ? ownerAccounts[method] : null;

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1500);
    } catch { /* ignore */ }
  };

  const handleChooseMethod = (id) => {
    if (!selected.length) return setErrorMsg('Select at least one bill first.');
    setMethod(id);
    setErrorMsg('');
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setMethod(null);
    clearProof();
  };

  const clearProof = () => {
    setOcrPreview(null);
    setOcrText('');
    setManualRef('');
    setManualAmount('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleOCRUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg('');
    setOcrText('');

    const reader = new FileReader();
    reader.onload = (ev) => setOcrPreview(ev.target.result);
    reader.readAsDataURL(file);

    setOcrLoading(true);
    try {
      const text = await runOCR(file);
      setOcrText(text);
      const refMatch = text.match(/\b\d{10,13}\b/);
      if (refMatch) setManualRef(refMatch[0]);
      const amountMatch = text.match(/(?:PHP|₱|P)\s*([\d,]+(?:\.\d{2})?)/i);
      if (amountMatch) setManualAmount(amountMatch[1].replace(/,/g, ''));
      else setManualAmount(String(total));
    } catch {
      setErrorMsg('Could not read the receipt. Try a clearer screenshot.');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!method) return setErrorMsg('Choose a payment method first.');
    if (!selected.length) return setErrorMsg('Select at least one bill.');
    if (!ocrPreview) return setErrorMsg('Upload your receipt first.');
    if (!manualRef.trim()) return setErrorMsg('Enter the reference number.');
    if (!manualAmount) return setErrorMsg('Enter the amount you sent.');

    setErrorMsg('');
    setSubmitting(true);
    try {
      selectedItems.forEach((item) => {
        if (item.kind === 'rent') {
          rentPayments.recordPayment(item.refId, {
            amount: item.amount,
            paymentMethod: method,
            orNumber: manualRef.trim(),
          });
        } else if (item.kind === 'utility') {
          utilityCharges.markPaid(item.refId);
        }
      });
      clearProof();
      navigate('/tenant');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        <Loader2 className="animate-spin mr-2" size={20} /> Loading…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} className="text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">All paid up! 🎉</h1>
        <p className="text-sm text-slate-600 mt-2">You have no unpaid bills.</p>
        <button
          onClick={() => navigate('/tenant')}
          className="btn-secondary mt-6"
        >
          <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-8">
      <div className="mb-5">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Pay Rent
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Two steps. Pay via GCash/Bank, then upload your receipt.
        </p>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <StepPill n={1} label="Choose Method" active={step === 1} done={step > 1} />
        <div
          className={`flex-1 h-0.5 rounded-full ${
            step > 1 ? 'bg-violet-500' : 'bg-slate-200'
          }`}
        />
        <StepPill n={2} label="Upload Receipt" active={step === 2} done={false} />
      </div>

      {errorMsg && (
        <div className="mb-4 flex items-start gap-3 bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl">
          <AlertCircle size={20} className="mt-0.5 shrink-0" />
          <span className="text-sm font-medium">{errorMsg}</span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="space-y-4"
          >
            <div className="card">
              <h2 className="font-bold text-slate-900 mb-3">Bills to pay</h2>
              <div className="space-y-2">
                {items.map((b) => {
                  const isSel = selected.includes(b.id);
                  return (
                    <button
                      key={b.id}
                      onClick={() => toggleItem(b.id)}
                      className={`w-full text-left rounded-xl border p-3 transition ${
                        isSel
                          ? 'border-violet-500 bg-violet-50'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{b.label}</p>
                          <p className="text-xs text-slate-500">
                            ₱{b.amount.toLocaleString('en-PH')}
                          </p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 ${
                            isSel
                              ? 'bg-violet-600 border-violet-600'
                              : 'border-slate-300'
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="card">
              <h2 className="font-bold text-slate-900 mb-3">
                Choose payment method
              </h2>
              <div className="space-y-3">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleChooseMethod(m.id)}
                    className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left hover:border-violet-300 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${m.grad} flex items-center justify-center text-2xl`}
                      >
                        {m.emoji}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{m.label}</p>
                        <p className="text-xs text-slate-500">{m.sub}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="space-y-4"
          >
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-slate-900">Payment details</h2>
                <button
                  onClick={handleBack}
                  className="text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                  Back
                </button>
              </div>

              {activeAccount && (
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Smartphone size={16} />{' '}
                    {method === 'gcash' ? 'GCash' : 'Bank'} account
                  </div>
                  <div className="space-y-2 text-sm">
                    {/* GCash uses accountName / phone, Bank uses accountName / accountNumber */}
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500">Name</span>
                      <span className="font-semibold text-slate-900">
                        {activeAccount.accountName || '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500">
                        {method === 'gcash' ? 'Number' : 'Account No.'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-900">
                          {method === 'gcash'
                            ? activeAccount.phone || '—'
                            : activeAccount.accountNumber || '—'}
                        </span>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              method === 'gcash'
                                ? activeAccount.phone
                                : activeAccount.accountNumber,
                              'number'
                            )
                          }
                          className="p-1 rounded-md hover:bg-slate-200"
                        >
                          {copiedField === 'number' ? (
                            <Check size={14} className="text-emerald-600" />
                          ) : (
                            <Copy size={14} className="text-slate-500" />
                          )}
                        </button>
                      </div>
                    </div>
                    {method === 'bank' && activeAccount.bankName && (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-500">Bank</span>
                        <span className="font-semibold text-slate-900">
                          {activeAccount.bankName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleOCRUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left hover:border-violet-300 transition"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">Upload receipt</p>
                      <p className="text-xs text-slate-500">
                        PNG/JPG screenshot or photo
                      </p>
                    </div>
                    <div className="p-2 rounded-xl bg-violet-100 text-violet-600">
                      <Upload size={18} />
                    </div>
                  </div>
                </button>

                {ocrLoading && (
                  <div className="mt-3 flex items-center text-sm text-slate-500">
                    <Loader2 size={16} className="animate-spin mr-2" /> Reading
                    receipt…
                  </div>
                )}

                {ocrPreview && (
                  <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 bg-white">
                    <img
                      src={ocrPreview}
                      alt="Receipt preview"
                      className="w-full h-52 object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="label">Reference number</label>
                  <input
                    value={manualRef}
                    onChange={(e) => setManualRef(e.target.value)}
                    className="input"
                    placeholder="Enter reference number"
                  />
                </div>
                <div>
                  <label className="label">Amount paid</label>
                  <input
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    className="input"
                    placeholder="Amount sent"
                  />
                </div>
                {ocrText && (
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Detected text
                      </p>
                      <button
                        onClick={() => copyToClipboard(ocrText, 'ocr')}
                        className="text-[11px] text-violet-600 font-medium"
                      >
                        Copy
                      </button>
                    </div>
                    <pre className="text-[11px] leading-5 text-slate-600 whitespace-pre-wrap max-h-32 overflow-auto">
                      {ocrText}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                <span>Selected bills total</span>
                <span className="font-bold text-slate-900">
                  ₱{total.toLocaleString('en-PH')}
                </span>
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-primary w-full"
              >
                {submitting ? 'Submitting…' : 'Submit Payment'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StepPill({ n, label, active, done }) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-full border text-xs font-semibold ${
        active
          ? 'border-violet-500 bg-violet-50 text-violet-700'
          : done
          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
          : 'border-slate-200 bg-white text-slate-500'
      }`}
    >
      <span
        className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center ${
          active
            ? 'bg-violet-600 text-white'
            : done
            ? 'bg-emerald-600 text-white'
            : 'bg-slate-200 text-slate-600'
        }`}
      >
        {n}
      </span>
      {label}
    </div>
  );
}