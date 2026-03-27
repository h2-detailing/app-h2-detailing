import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AddOrder from './components/AddOrder';
import AddExpense from './components/AddExpense';
import History from './components/History';
import Settings from './components/Settings';
import Clients from './components/Clients';
import Login from './components/Login';
import { api } from './api/index';

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
  const [view, setView] = useState('dashboard');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersData, expensesData, clientsData, settingsData] = await Promise.all([
        api.getOrders(),
        api.getExpenses(),
        api.getClients(),
        api.getSettings(),
      ]);
      setOrders(ordersData);
      setExpenses(expensesData);
      setClients(clientsData);
      setSettings(settingsData);
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
        onAdd={async (orderData, photos) => {
          const created = await api.createOrder(orderData);
          if (photos?.before) await api.uploadPhoto(created.id, photos.before, 'before');
          if (photos?.after)  await api.uploadPhoto(created.id, photos.after,  'after');
          setOrders(await api.getOrders());
          setView('dashboard');
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
    history: (
      <History
        orders={orders}
        expenses={expenses}
        settings={settings}
        clients={clients}
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
        settings={settings}
        user={user}
        onSave={async (updated) => {
          const saved = await api.updateSettings(updated);
          setSettings(saved);
        }}
      />
    ),
  };

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      <Sidebar currentView={view} onNavigate={setView} user={user} onLogout={handleLogout} />
      <main className="flex-1 overflow-y-auto">{views[view] ?? views.dashboard}</main>
    </div>
  );
}
