import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Clock } from 'lucide-react';
import { reservations } from '../../services/localDB';

export default function ReserveSuccess() {
  const { reference } = useParams();
  const res = reservations.getByReference(reference);

  return (
    <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center p-4">
      <div className="card max-w-md w-full text-center !p-8">
        <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={40} className="text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Inquiry Submitted!
        </h1>
        <p className="text-sm text-slate-600 mb-4">
          Your reference number is:
        </p>
        <p className="text-3xl font-extrabold text-indigo-600 font-mono mb-6">
          {reference}
        </p>

        <div className="bg-slate-50 rounded-xl p-4 text-left mb-6">
          <p className="text-xs font-bold text-slate-500 uppercase mb-2">
            What happens next?
          </p>
          <div className="space-y-2 text-sm text-slate-700">
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-xs flex items-center justify-center shrink-0 font-bold">
                1
              </span>
              <p>Staff reviews your inquiry and rental readiness.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-xs flex items-center justify-center shrink-0 font-bold">
                2
              </span>
              <p>
                You'll be marked as <strong>Qualified</strong> if you meet
                requirements.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-xs flex items-center justify-center shrink-0 font-bold">
                3
              </span>
              <p>We'll contact you via phone/email for next steps.</p>
            </div>
          </div>
        </div>

        {res && (
          <div className="text-left text-xs text-slate-500 mb-6 space-y-1 bg-white border border-slate-100 rounded-xl p-3">
            <p>
              <strong className="text-slate-700">Name:</strong> {res.fullName}
            </p>
            <p>
              <strong className="text-slate-700">Preferred Room:</strong>{' '}
              {res.preferredRoomType}
            </p>
            <p>
              <strong className="text-slate-700">Move-in:</strong>{' '}
              {res.moveInDate}
            </p>
            <p>
              <strong className="text-slate-700">Status:</strong>{' '}
              <span className="capitalize font-semibold text-amber-600">
                {res.status.replace('_', ' ')}
              </span>
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Link to="/browse" className="btn-primary">
            Continue Browsing
          </Link>
          <Link to="/" className="btn-secondary">
            Back to Home
          </Link>
        </div>

        <p className="text-[11px] text-slate-400 mt-4 flex items-center justify-center gap-1">
          <Clock size={11} /> Average review time: 24–48 hours
        </p>
      </div>
    </div>
  );
}