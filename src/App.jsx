import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Component } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import Layout from './components/Layout';
import Login from './pages/Login';

// ─── Public pages ───
import LandingPage from './pages/public/LandingPage';
import BrowsePage from './pages/public/BrowsePage';
import PropertyDetail from './pages/public/PropertyDetail';
import AboutPage from './pages/public/AboutPage';
import ContactPage from './pages/public/ContactPage';
import SignupPage from './pages/public/SignupPage';
import ReservePage from './pages/public/ReservePage';
import ReserveSuccess from './pages/public/ReserveSuccess';

// ─── Admin pages ───
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageProperties from './pages/admin/ManageProperties';
import ManageRooms from './pages/admin/ManageRooms';
import ManageTenants from './pages/admin/ManageTenants';
import Reservations from './pages/admin/Reservations';
import RentPayments from './pages/admin/RentPayments';
import UtilityCharges from './pages/admin/UtilityCharges';
import Expenses from './pages/admin/Expenses';
import Analytics from './pages/admin/Analytics';
import Reports from './pages/admin/Reports'; // <-- NEW
import PaymentSettings from './pages/admin/PaymentSettings';
import ManageUsers from './pages/admin/ManageUsers';
import Announcements from './pages/admin/Announcements';

// ─── Caretaker ───
import CaretakerDashboard from './pages/caretaker/CaretakerDashboard';

// ─── Tenant ───
import TenantDashboard from './pages/tenant/TenantDashboard';
import PayBill from './pages/tenant/PayBill';
import PaymentPending from './pages/tenant/PaymentPending';
import Receipt from './pages/tenant/Receipt';
import MyBookings from './pages/tenant/MyBookings';
import Favorites from './pages/tenant/Favorites';

// ============================================================
// IMPORT SANITY CHECK
// ============================================================
const PAGE_IMPORTS = {
  Login,
  LandingPage, BrowsePage, PropertyDetail, AboutPage, ContactPage,
  SignupPage, ReservePage, ReserveSuccess,
  AdminDashboard, ManageProperties, ManageRooms, ManageTenants,
  Reservations, RentPayments, UtilityCharges, Expenses, Analytics,
  Reports, // <-- NEW
  PaymentSettings, ManageUsers, Announcements,
  CaretakerDashboard,
  TenantDashboard, PayBill, PaymentPending, Receipt,
  MyBookings, Favorites,
  Layout,
};

(() => {
  const problems = [];
  Object.entries(PAGE_IMPORTS).forEach(([name, val]) => {
    if (val === undefined || val === null) {
      problems.push(`❌ ${name}: MISSING (file not found or no default export)`);
    } else if (typeof val !== 'function' && typeof val !== 'string') {
      problems.push(`❌ ${name}: BAD EXPORT (got ${typeof val})`);
    }
  });
  if (problems.length) {
    console.error('🔥 NearBai — Component Import Problems:');
    problems.forEach((p) => console.error('  ' + p));
  } else {
    console.log('✅ NearBai: All page imports resolved successfully.');
  }
})();

// ============================================================
// ERROR BOUNDARY
// ============================================================
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('🔥 Page render error:', error, errorInfo);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 max-w-lg w-full">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
              <span className="text-rose-500 text-2xl">⚠️</span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 mb-2">Something went wrong</h1>
            <p className="text-sm text-slate-600 mb-4">
              A page failed to load. Check the browser console for details.
            </p>
            <pre className="bg-slate-50 p-3 rounded-xl text-[10px] text-rose-700 overflow-auto max-h-40 whitespace-pre-wrap mb-4">
              {String(this.state.error)}
            </pre>
            <div className="flex gap-2">
              <button onClick={() => window.location.reload()} className="btn-primary flex-1">Reload</button>
              <button onClick={() => { window.location.href = '/'; }} className="btn-secondary flex-1">Home</button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================
// MISSING PAGE FALLBACK
// ============================================================
function MissingPage({ name }) {
  return (
    <div className="max-w-lg mx-auto my-16">
      <div className="card text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
          <span className="text-amber-500 text-3xl">🔧</span>
        </div>
        <h1 className="text-xl font-extrabold text-slate-900 mb-2">Page unavailable</h1>
        <p className="text-sm text-slate-600 mb-4">
          The <strong>{name}</strong> page hasn't been created yet.
        </p>
        <button onClick={() => window.history.back()} className="btn-secondary mt-2">← Go back</button>
      </div>
    </div>
  );
}

function Safe({ component: Comp, name, role }) {
  if (!Comp) return <MissingPage name={name} />;
  const element = <Comp />;
  if (role) return <ProtectedRoute role={role}>{element}</ProtectedRoute>;
  return element;
}

// ============================================================
// AUTH GUARD
// ============================================================
function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Loading…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    const redirect =
      user.role === 'admin' ? '/admin'
      : user.role === 'caretaker' ? '/caretaker'
      : '/tenant';
    return <Navigate to={redirect} replace />;
  }
  return <Layout>{children}</Layout>;
}

// ============================================================
// ROUTES
// ============================================================
function AppRoutes() {
  return (
    <Routes>
      {/* ============ PUBLIC ============ */}
      <Route path="/" element={<Safe component={LandingPage} name="LandingPage" />} />
      <Route path="/browse" element={<Safe component={BrowsePage} name="BrowsePage" />} />
      <Route path="/browse/:id" element={<Safe component={PropertyDetail} name="PropertyDetail" />} />
      <Route path="/about" element={<Safe component={AboutPage} name="AboutPage" />} />
      <Route path="/contact" element={<Safe component={ContactPage} name="ContactPage" />} />
      <Route path="/login" element={<Safe component={Login} name="Login" />} />
      <Route path="/signup" element={<Safe component={SignupPage} name="SignupPage" />} />
      <Route path="/reserve" element={<Safe component={ReservePage} name="ReservePage" />} />
      <Route path="/reserve/success/:reference" element={<Safe component={ReserveSuccess} name="ReserveSuccess" />} />

      {/* ============ ADMIN ============ */}
      <Route path="/admin" element={<Safe component={AdminDashboard} name="AdminDashboard" role="admin" />} />
      <Route path="/admin/properties" element={<Safe component={ManageProperties} name="ManageProperties" role="admin" />} />
      <Route path="/admin/rooms" element={<Safe component={ManageRooms} name="ManageRooms" role="admin" />} />
      <Route path="/admin/tenants" element={<Safe component={ManageTenants} name="ManageTenants" role="admin" />} />
      <Route path="/admin/reservations" element={<Safe component={Reservations} name="Reservations" role="admin" />} />
      <Route path="/admin/rent" element={<Safe component={RentPayments} name="RentPayments" role="admin" />} />
      <Route path="/admin/utilities" element={<Safe component={UtilityCharges} name="UtilityCharges" role="admin" />} />
      <Route path="/admin/expenses" element={<Safe component={Expenses} name="Expenses" role="admin" />} />
      <Route path="/admin/analytics" element={<Safe component={Analytics} name="Analytics" role="admin" />} />
      <Route path="/admin/reports" element={<Safe component={Reports} name="Reports" role="admin" />} />
      <Route path="/admin/announcements" element={<Safe component={Announcements} name="Announcements" role="admin" />} />
      <Route path="/admin/settings" element={<Safe component={PaymentSettings} name="PaymentSettings" role="admin" />} />
      <Route path="/admin/users" element={<Safe component={ManageUsers} name="ManageUsers" role="admin" />} />

      {/* ============ CARETAKER ============ */}
      <Route path="/caretaker" element={<Safe component={CaretakerDashboard} name="CaretakerDashboard" role="caretaker" />} />
      <Route path="/caretaker/tenants" element={<Safe component={ManageTenants} name="ManageTenants" role="caretaker" />} />
      <Route path="/caretaker/reservations" element={<Safe component={Reservations} name="Reservations" role="caretaker" />} />
      <Route path="/caretaker/rent" element={<Safe component={RentPayments} name="RentPayments" role="caretaker" />} />

      {/* ============ TENANT ============ */}
      <Route path="/tenant" element={<Safe component={TenantDashboard} name="TenantDashboard" role="tenant" />} />
      <Route path="/tenant/bookings" element={<Safe component={MyBookings} name="MyBookings" role="tenant" />} />
      <Route path="/tenant/pay" element={<Safe component={PayBill} name="PayBill" role="tenant" />} />
      <Route path="/tenant/pending/:id" element={<Safe component={PaymentPending} name="PaymentPending" role="tenant" />} />
      <Route path="/tenant/receipt/:id" element={<Safe component={Receipt} name="Receipt" role="tenant" />} />
      <Route path="/tenant/favorites" element={<Safe component={Favorites} name="Favorites" role="tenant" />} />

      {/* ============ FALLBACK ============ */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// ============================================================
// ROOT
// ============================================================
export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
