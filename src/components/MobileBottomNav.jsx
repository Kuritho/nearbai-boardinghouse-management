import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, DoorOpen, Users, Wallet, TrendingUp,
  CalendarClock, Heart, Megaphone
} from 'lucide-react';

export default function MobileBottomNav({ user }) {
  const location = useLocation();
  const role = user?.role;

  const adminLinks = [
    { to: '/admin', icon: LayoutDashboard, label: 'Home', end: true },
    { to: '/admin/rooms', icon: DoorOpen, label: 'Rooms' },
    { to: '/admin/tenants', icon: Users, label: 'Tenants' },
    { to: '/admin/rent', icon: Wallet, label: 'Rent' },
    { to: '/admin/analytics', icon: TrendingUp, label: 'Stats' },
  ];

  const caretakerLinks = [
    { to: '/caretaker', icon: LayoutDashboard, label: 'Home', end: true },
    { to: '/caretaker/tenants', icon: Users, label: 'Tenants' },
    { to: '/caretaker/rent', icon: Wallet, label: 'Rent' },
    { to: '/caretaker/announcements', icon: Megaphone, label: 'News' }, // <-- NEW
  ];

  const tenantLinks = [
    { to: '/tenant', icon: LayoutDashboard, label: 'Home', end: true },
    { to: '/tenant/bookings', icon: CalendarClock, label: 'Bookings' }, // Added for better nav
    { to: '/tenant/announcements', icon: Megaphone, label: 'News' }, // <-- NEW
    { to: '/tenant/pay', icon: Wallet, label: 'Pay' },
    { to: '/tenant/favorites', icon: Heart, label: 'Saved' }, // Added for better nav
  ];

  const links = role === 'admin' ? adminLinks : role === 'caretaker' ? caretakerLinks : tenantLinks;

  return (
    <nav className="lg:hidden fixed bottom-3 inset-x-3 z-30 bg-white/95 backdrop-blur-2xl border border-slate-200 rounded-3xl shadow-2xl pb-safe">
      <div className="flex justify-around items-center px-2 py-1.5">
        {links.map(({ to, icon: Icon, label, end }) => {
          const isActive = end
            ? location.pathname === to
            : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              className="relative flex flex-col items-center justify-center gap-0.5 py-2 px-2 min-w-[56px]"
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute inset-0 bg-indigo-50 rounded-2xl"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <div className="relative z-10">
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={isActive ? 'text-indigo-600' : 'text-slate-400'}
                />
              </div>
              <span
                className={`relative z-10 text-[10px] ${
                  isActive ? 'font-bold text-indigo-600' : 'font-medium text-slate-400'
                }`}
              >
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}