import React, { useState } from 'react';

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) return setError('Vyplňte přihlašovací údaje.');
    setLoading(true);
    setError('');
    try {
      await onLogin(form.username.trim(), form.password);
    } catch (err) {
      setError(err.message || 'Nesprávné přihlašovací údaje.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden">
            <img src="/h2-logo.png" alt="H2" className="w-14 h-14 object-contain" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
            <span style={{display:'none'}} className="text-2xl font-black text-orange-500">H2</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">H2 Detailing</h1>
          <p className="text-slate-500 text-sm mt-1">Finanční přehled</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Uživatelské jméno</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="jirka nebo patrik"
              autoComplete="username"
              autoFocus
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Heslo</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="current-password"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg transition-colors"
          >
            {loading ? 'Přihlašování…' : 'Přihlásit se'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-700 mt-4">
          Výchozí hesla: jirka/jirka123 · patrik/patrik123
        </p>
      </div>
    </div>
  );
}
