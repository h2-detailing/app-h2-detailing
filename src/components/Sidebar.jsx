import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  MinusCircle,
  History,
  Settings,
  Users,
  LogOut,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard',   label: 'Přehled',      icon: LayoutDashboard },
  { id: 'add-order',   label: 'Nová zakázka', icon: PlusCircle },
  { id: 'add-expense', label: 'Nový náklad',  icon: MinusCircle },
  { id: 'clients',     label: 'Klienti',      icon: Users },
  { id: 'history',     label: 'Transakce',    icon: History },
  { id: 'settings',    label: 'Nastavení',    icon: Settings },
];

export default function Sidebar({ currentView, onNavigate, user, onLogout }) {
  return (
    <aside className="hidden lg:flex w-60 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
            <img
              src="/h2-logo.png"
              alt="H2"
              className="w-8 h-8 object-contain"
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
            />
            <span style={{ display: 'none' }} className="text-lg font-black text-orange-500">H2</span>
          </div>
          <div>
            <div className="text-sm font-bold text-white leading-tight">H2 Detailing</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = currentView === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                active
                  ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-800 flex items-center justify-between">
        <div>
          <div className="text-xs font-medium text-slate-300">{user?.name ?? '—'}</div>
          <div className="text-xs text-slate-600">přihlášen</div>
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
            title="Odhlásit se"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
