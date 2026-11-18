import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, DoorOpen, Users, CalendarClock,
  Wallet, Zap, Receipt, BarChart3, FileText, Settings, Megaphone,
  LogOut, Shield, Heart, MessageSquare, Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminLinks = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/admin/global', icon: BarChart3, label: 'Global Analytics' },
    { to: '/admin/properties', icon: Building2, label: 'Properties' },
    { to: '/admin/rooms', icon: DoorOpen, label: 'Rooms' },
    { to: '/admin/tenants', icon: Users, label: 'Tenants' },
    { to: '/admin/reservations', icon: CalendarClock, label: 'Inquiries' },
    { to: '/admin/rent', icon: Wallet, label: 'Rent Payments' },
    { to: '/admin/utilities', icon: Zap, label: 'Utilities' },
    { to: '/admin/expenses', icon: Receipt, label: 'Expenses' },
    { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/admin/reports', icon: FileText, label: 'Reports' },
    { to: '/admin/simulation', icon: Database, label: 'Simulation Data' }, // <-- NEW
    { to: '/admin/announcements', icon: Megaphone, label: 'Announcements' },
    { to: '/admin/settings', icon: Settings, label: 'Settings' },
    { to: '/admin/users', icon: Shield, label: 'Staff & Users' },
  ];

  const caretakerLinks = [
    { to: '/caretaker', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/caretaker/reservations', icon: MessageSquare, label: 'Inquiries' },
    { to: '/caretaker/tenants', icon: Users, label: 'Tenants' },
    { to: '/caretaker/rent', icon: Wallet, label: 'Rent Payments' },
    { to: '/caretaker/announcements', icon: Megaphone, label: 'Announcements' },
  ];

  const tenantLinks = [
    { to: '/tenant', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/tenant/bookings', icon: CalendarClock, label: 'My Bookings' },
    { to: '/tenant/announcements', icon: Megaphone, label: 'Announcements' },
    { to: '/tenant/favorites', icon: Heart, label: 'Favorites' },
  ];

  let links = [];
  let title = '';
  if (user?.role === 'admin') { links = adminLinks; title = 'Admin Panel'; }
  else if (user?.role === 'caretaker') { links = caretakerLinks; title = 'Caretaker Panel'; }
  else if (user?.role === 'tenant') { links = tenantLinks; title = 'Tenant Portal'; }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 flex flex-col z-40">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
            <Building2 size={20} className="text-white" />
          </div>
          <div>
            <p className="font-extrabold text-slate-900 text-lg tracking-tight">NearBai</p>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <link.icon size={18} />
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition"
        >
          <LogOut size={16} /> Log out
        </button>
      </div>
    </aside>
  );
}