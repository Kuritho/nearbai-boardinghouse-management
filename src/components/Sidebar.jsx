import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Building2, DoorOpen, Users, Wallet, Receipt,
  TrendingUp, LogOut, Settings, Wrench, Shield, Clock, Megaphone,
  Heart, FileSpreadsheet, MessageSquare, // (kept even if unused, safe)
} from 'lucide-react';
import Logo from './Logo';
import PropertySwitcher from './PropertySwitcher';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const role = user?.role;

  const adminLinks = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/admin/properties', icon: Building2, label: 'Properties' },
    { to: '/admin/rooms', icon: DoorOpen, label: 'Rooms' },
    { to: '/admin/tenants', icon: Users, label: 'Tenants' },
    { to: '/admin/reservations', icon: Clock, label: 'Reservations' },
    { to: '/admin/rent', icon: Wallet, label: 'Rent Payments' },
    { to: '/admin/utilities', icon: Receipt, label: 'Utility Charges' },
    { to: '/admin/expenses', icon: Wrench, label: 'Expenses' },
    { to: '/admin/analytics', icon: TrendingUp, label: 'Analytics' },
    { to: '/admin/reports', icon: FileSpreadsheet, label: 'Reports & Exports' }, // <-- NEW
    { to: '/admin/announcements', icon: Megaphone, label: 'Announcements' },
    { to: '/admin/settings', icon: Settings, label: 'Payment Settings' },
    { to: '/admin/users', icon: Shield, label: 'Manage Users' },
  ];

  const caretakerLinks = [
    { to: '/caretaker', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/caretaker/tenants', icon: Users, label: 'Tenants' },
    { to: '/caretaker/reservations', icon: Clock, label: 'Reservations' },
    { to: '/caretaker/rent', icon: Wallet, label: 'Log Payments' },
  ];

  const tenantLinks = [
    { to: '/tenant', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/tenant/bookings', icon: Clock, label: 'My Bookings' },
    { to: '/tenant/pay', icon: Wallet, label: 'Pay Rent' },
    { to: '/tenant/favorites', icon: Heart, label: 'Favorites' },
  ];

  const links =
    role === 'admin' ? adminLinks
    : role === 'caretaker' ? caretakerLinks
    : tenantLinks;

  const sectionLabel =
    role === 'admin' ? 'Management'
    : role === 'caretaker' ? 'Operations'
    : 'My Account';

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-100 flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-100">
        <Logo size={42} showWordmark />
      </div>

      {/* Property switcher */}
      {(role === 'admin' || role === 'caretaker') && (
        <div className="px-3 pt-3">
          <PropertySwitcher />
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        <p className="px-3 pt-2 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {sectionLabel}
        </p>

        {links.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={`flex items-center justify-center w-7 h-7 rounded-lg transition ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                >
                  <Icon size={15} strokeWidth={2.3} />
                </div>
                <span className="flex-1">{label}</span>
                {isActive && <div className="w-1 h-1 rounded-full bg-indigo-500" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-slate-100">
        <div className="flex items-center gap-3 px-2 py-2 mb-1">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-400 capitalize font-medium">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center justify-center gap-2 w-full px-3 py-2 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition font-semibold"
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
