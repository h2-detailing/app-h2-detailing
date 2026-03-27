import React, { useState } from 'react';

const CATEGORIES = ['Materiál', 'Vybavení', 'Režie dílny', 'Ostatní'];

export default function AddExpense({ settings, onAdd, onCancel }) {
  const { partner1, partner2 } = settings;
  const PAYERS = ['Společná kasa', partner1, partner2];

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    description: '',
    amount: '',
    payer: 'Společná kasa',
    category: 'Materiál',
    vatIncluded: true,
  });
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.description.trim()) return setError('Vyplňte popis nákladu.');
    if (!form.amount || parseFloat(form.amount) <= 0) return setError('Zadejte platnou částku.');
    setError('');
    onAdd({
      id: crypto.randomUUID(),
      date: form.date,
      description: form.description.trim(),
      amount: parseFloat(form.amount),
      payer: form.payer,
      category: form.category,
      vatIncluded: form.vatIncluded,
      type: 'expense',
    });
  };

  return (
    <div className="p-4 lg:p-6 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Nový náklad</h1>
        <p className="text-sm text-slate-500 mt-0.5">Přidat výdaj firmy</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Datum *</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Popis *</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="např. Leštidlo Koch Chemie"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Částka (Kč) *</label>
          <input
            type="number"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="0"
            min="0"
            step="1"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Kdo zaplatil *</label>
          <div className="flex gap-2">
            {PAYERS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setForm({ ...form, payer: p })}
                className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  form.payer === p
                    ? 'bg-orange-500/10 border-orange-500/50 text-orange-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Kategorie *</label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm({ ...form, category: c })}
                className={`py-2 text-sm font-medium rounded-lg border transition-colors ${
                  form.category === c
                    ? 'bg-orange-500/10 border-orange-500/50 text-orange-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">DPH</label>
          <div className="flex gap-2">
            {[
              { label: 'S DPH', value: true },
              { label: 'Bez DPH', value: false },
            ].map(({ label, value }) => (
              <button
                key={label}
                type="button"
                onClick={() => setForm({ ...form, vatIncluded: value })}
                className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  form.vatIncluded === value
                    ? 'bg-orange-500/10 border-orange-500/50 text-orange-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-400 text-white font-semibold text-sm rounded-lg transition-colors"
          >
            Uložit náklad
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors border border-slate-700"
          >
            Zrušit
          </button>
        </div>
      </form>
    </div>
  );
}
