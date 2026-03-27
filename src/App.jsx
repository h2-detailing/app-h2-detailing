import React, { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, PlusCircle, MinusCircle, Users, Users2, History as HistoryIcon, Settings as SettingsIcon } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AddOrder from './components/AddOrder';
import AddExpense from './components/AddExpense';
import History from './components/History';
import Settings from './components/Settings';
import Clients from './components/Clients';
import Partners from './components/Partners';
import Login from './components/Login';
import { api } from './api/index';

const BOTTOM_NAV = [
  { id: 'dashboard',   label: 'Přehled',   icon: LayoutDashboard },
  { id: 'add-order',   label: 'Zakázka',   icon: PlusCircle },
  { id: 'add-expense', label: 'Náklad',    icon: MinusCircle },
  { id: 'clients',     label: 'Klienti',   icon: Users },
  { id: 'partners',    label: 'Partneři',  icon: Users2 },
  { id: 'history',     label: 'Transakce', icon: HistoryIcon },
  { id: 'settings',    label: 'Nastavení', icon: SettingsIcon },
];

function MobileBottomNav({ currentView, onNavigate }) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 flex safe-area-inset-bottom">
      {BOTTOM_NAV.map(({ id, label, icon: Icon }) => {
        const active = currentView === id;
        return (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={`flex-1 flex flex-col items-center justify-center pt-2 pb-3 gap-0.5 transition-colors ${
              active ? 'text-orange-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[9px] font-medium leading-none">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

const DEFAULT_SETTINGS = { partner1: 'Patrik', partner2: 'Jirka', pausal: 1500, split: 50 };

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-screen bg-slate-950">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-500 text-sm">Načítání dat…</p>
      </div>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('h2-token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [clients, setClients] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [customPrices, setCustomPrices] = useState({});
  const [view, setView] = useState('dashboard');
  const [settingsKey, setSettingsKey] = useState(0);
  const [editingOrder, setEditingOrder] = useState(null);

  const navigate = useCallback((id) => {
    if (id === 'settings') setSettingsKey((k) => k + 1);
    setView(id);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersData, expensesData, clientsData, settingsData, pricesData, meData] = await Promise.all([
        api.getOrders(),
        api.getExpenses(),
        api.getClients(),
        api.getSettings(),
        api.getPrices(),
        api.me(),
      ]);
      setOrders(ordersData);
      setExpenses(expensesData);
      setClients(clientsData);
      setSettings(settingsData);
      setCustomPrices(pricesData);
      setUser(meData.user ?? meData);
    } catch (e) {
      if (e.message !== 'Unauthorized') console.error('Load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) loadData();
    else setLoading(false);
  }, [token, loadData]);

  // Listen for forced logout (401 from API)
  useEffect(() => {
    const handler = () => { setToken(null); setUser(null); };
    window.addEventListener('h2-logout', handler);
    return () => window.removeEventListener('h2-logout', handler);
  }, []);

  const handleLogin = async (username, password) => {
    const data = await api.login(username, password);
    localStorage.setItem('h2-token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const handleLogout = () => {
    localStorage.removeItem('h2-token');
    setToken(null);
    setUser(null);
    setOrders([]);
    setExpenses([]);
    setClients([]);
  };

  if (!token) return <Login onLogin={handleLogin} />;
  if (loading) return <LoadingScreen />;

  const views = {
    dashboard: (
      <Dashboard
        orders={orders}
        expenses={expenses}
        settings={settings}
        clients={clients}
        onNavigate={setView}
      />
    ),
    'add-order': (
      <AddOrder
        settings={settings}
        clients={clients}
        customPrices={customPrices}
        onAdd={async (orderData) => {
          await api.createOrder(orderData);
          setOrders(await api.getOrders());
          setView('dashboard');
        }}
        onAddClient={async (data) => {
          const created = await api.createClient(data);
          setClients((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
          return created;
        }}
        onCancel={() => setView('dashboard')}
      />
    ),
    'add-expense': (
      <AddExpense
        settings={settings}
        onAdd={async (data) => {
          await api.createExpense(data);
          setExpenses(await api.getExpenses());
          setView('dashboard');
        }}
        onCancel={() => setView('dashboard')}
      />
    ),
    'edit-order': editingOrder ? (
      <AddOrder
        settings={settings}
        clients={clients}
        customPrices={customPrices}
        initialOrder={editingOrder}
        onAdd={async (orderData) => {
          await api.updateOrder(editingOrder.id, orderData);
          setOrders(await api.getOrders());
          setEditingOrder(null);
          setView('history');
        }}
        onAddClient={async (data) => {
          const created = await api.createClient(data);
          setClients((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
          return created;
        }}
        onCancel={() => { setEditingOrder(null); setView('history'); }}
      />
    ) : null,
    history: (
      <History
        orders={orders}
        expenses={expenses}
        settings={settings}
        clients={clients}
        onEditOrder={(order) => { setEditingOrder(order); setView('edit-order'); }}
        onDeleteOrder={async (id) => {
          await api.deleteOrder(id);
          setOrders((prev) => prev.filter((o) => o.id !== id));
        }}
        onDeleteExpense={async (id) => {
          await api.deleteExpense(id);
          setExpenses((prev) => prev.filter((e) => e.id !== id));
        }}
        onUpdateOrder={async (id, data) => {
          const updated = await api.updateOrder(id, data);
          setOrders((prev) => prev.map((o) => o.id === id ? updated : o));
        }}
        onUpdateExpense={async (id, data) => {
          const updated = await api.updateExpense(id, data);
          setExpenses((prev) => prev.map((e) => e.id === id ? updated : e));
        }}
      />
    ),
    clients: (
      <Clients
        clients={clients}
        orders={orders}
        onAddClient={async (data) => {
          const created = await api.createClient(data);
          setClients((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
          return created;
        }}
        onUpdateClient={async (id, updates) => {
          await api.updateClient(id, updates);
          setClients(await api.getClients());
        }}
        onDeleteClient={async (id) => {
          await api.deleteClient(id);
          setClients((prev) => prev.filter((c) => c.id !== id));
        }}
        onAddVehicle={async (clientId, vehicle) => {
          await api.createVehicle(clientId, vehicle);
          setClients(await api.getClients());
        }}
        onUpdateVehicle={async (_clientId, vehicleId, updates) => {
          await api.updateVehicle(vehicleId, updates);
          setClients(await api.getClients());
        }}
        onDeleteVehicle={async (_clientId, vehicleId) => {
          await api.deleteVehicle(vehicleId);
          setClients(await api.getClients());
        }}
      />
    ),
    settings: (
      <Settings
        key={settingsKey}
        settings={settings}
        user={user}
        customPrices={customPrices}
        onSave={async (updated) => {
          const saved = await api.updateSettings(updated);
          setSettings(saved);
        }}
        onSavePrices={async (prices) => {
          const saved = await api.updatePrices(prices);
          setCustomPrices(saved);
        }}
      />
    ),
    partners: (
      <Partners
        orders={orders}
        expenses={expenses}
        settings={settings}
      />
    ),
  };

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      <Sidebar currentView={view} onNavigate={navigate} user={user} onLogout={handleLogout} />
      <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">{views[view] ?? views.dashboard}</main>
      <MobileBottomNav currentView={view} onNavigate={navigate} />
    </div>
  );
}
