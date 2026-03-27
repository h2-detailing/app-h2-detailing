import React, { useState, useEffect } from 'react';
import { Save, RotateCcw, KeyRound, Tag, PieChart, ChevronRight, ChevronLeft } from 'lucide-react';
import { api } from '../api/index';
import { getPriceColumns, getAllPriceItems } from '../data/services';

// ─── Section Cards ────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    id: 'profit',
    label: 'Podíl zisku',
    desc: 'Partneři, paušál, rozdělení příjmů',
    icon: PieChart,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/20',
  },
  {
    id: 'prices',
    label: 'Ceník',
    desc: 'Ceny balíčků, příplatků a extra služeb',
    icon: Tag,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  {
    id: 'password',
    label: 'Heslo',
    desc: 'Změna přihlašovacího hesla',
    icon: KeyRound,
    color: 'text-slate-400',
    bg: 'bg-slate-700/30 border-slate-700',
  },
];

// ─── Shared back button ───────────────────────────────────────────────────────

function BackButton({ onClick, label }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-5">
      <ChevronLeft className="w-4 h-4" />
      {label}
    </button>
  );
}

// ─── PriceRow ─────────────────────────────────────────────────────────────────

function PriceRow({ item, value, onChange }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="flex-1 text-sm text-slate-300 leading-snug">{item.name}</span>
      <div className="flex items-center gap-1 flex-shrink-0">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min="0"
          step="10"
          className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white text-sm text-right focus:outline-none focus:border-orange-500 transition-colors"
        />
        <span className="text-xs text-slate-500 w-8">{item.unit ? 'Kč/ks' : 'Kč'}</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Settings({ settings, onSave, onSavePrices, customPrices = {}, user }) {
  const [section, setSection] = useState(null);

  // — Profit form —
  const [form, setForm] = useState(settings);
  const [saved, setSaved] = useState(false);
  useEffect(() => { setForm(settings); }, [settings]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      pausal: form.pausal === '' ? 0 : (parseFloat(form.pausal) ?? 0),
      split: Math.min(100, Math.max(0, parseInt(form.split) || 50)),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    const defaults = { partner1: 'Patrik', partner2: 'Jirka', pausal: 1500, split: 50 };
    setForm(defaults);
    onSave(defaults);
  };

  // — Price form —
  const buildPriceForm = (overrides) => {
    const map = {};
    for (const item of getAllPriceItems()) {
      map[item.id] = overrides[item.id] ?? item.defaultPrice;
    }
    return map;
  };
  const [priceForm, setPriceForm] = useState(() => buildPriceForm(customPrices));
  const [priceSaved, setPriceSaved] = useState(false);
  useEffect(() => { setPriceForm(buildPriceForm(customPrices)); }, [customPrices]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePriceSubmit = async (e) => {
    e.preventDefault();
    const prices = {};
    for (const [id, val] of Object.entries(priceForm)) {
      prices[id] = parseInt(val) || 0;
    }
    await onSavePrices(prices);
    setPriceSaved(true);
    setTimeout(() => setPriceSaved(false), 2000);
  };

  // — Password form —
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState({ text: '', ok: false });

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) return setPwMsg({ text: 'Hesla se neshodují.', ok: false });
    if (pwForm.next.length < 4) return setPwMsg({ text: 'Heslo musí mít alespoň 4 znaky.', ok: false });
    try {
      await api.changePassword(pwForm.current, pwForm.next);
      setPwMsg({ text: 'Heslo změněno ✓', ok: true });
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      setPwMsg({ text: err.message || 'Chyba při změně hesla.', ok: false });
    }
  };

  // ── Section: card menu ───────────────────────────────────────────────────

  if (section === null) {
    return (
      <div className="p-4 lg:p-6 max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white">Nastavení</h1>
          <p className="text-sm text-slate-500 mt-0.5">Vyberte část, kterou chcete upravit</p>
        </div>
        <div className="space-y-3">
          {SECTIONS.map(({ id, label, desc, icon: Icon, color, bg }) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              className="w-full flex items-center gap-4 p-4 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition-all group text-left"
            >
              <div className={`w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0 ${bg}`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white">{label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Section: profit ──────────────────────────────────────────────────────

  if (section === 'profit') {
    return (
      <div className="p-4 lg:p-6 max-w-lg mx-auto">
        <BackButton onClick={() => setSection(null)} label="Nastavení" />
        <div className="mb-5">
          <h2 className="text-lg font-bold text-white">Podíl zisku</h2>
          <p className="text-sm text-slate-500 mt-0.5">Partneři a rozdělení příjmů</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-300">Partneři</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Partner 1</label>
                <input
                  type="text"
                  value={form.partner1}
                  onChange={(e) => setForm({ ...form, partner1: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Partner 2</label>
                <input
                  type="text"
                  value={form.partner2}
                  onChange={(e) => setForm({ ...form, partner2: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Rozdělení zisku – podíl {form.partner1} (%)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={form.split}
                  onChange={(e) => setForm({ ...form, split: parseInt(e.target.value) })}
                  className="flex-1 accent-orange-500"
                />
                <div className="flex gap-1 text-sm font-semibold min-w-[80px] text-center">
                  <span className="text-orange-400">{form.split}%</span>
                  <span className="text-slate-600">/</span>
                  <span className="text-purple-400">{100 - form.split}%</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {form.partner1}: {form.split}% · {form.partner2}: {100 - form.split}%
              </p>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-300">Dílna</h3>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Paušál za dílnu (Kč/měsíc)
              </label>
              <input
                type="number"
                value={form.pausal}
                onChange={(e) => setForm({ ...form, pausal: e.target.value })}
                min="0"
                step="100"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors"
              />
              <p className="text-xs text-slate-600 mt-1">
                Automaticky přičítáno jako náklad „Režie dílny" v rámci každého měsíce s aktivitou,
                připsáno partnerovi {form.partner2} (majitel dílny).
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 font-semibold text-sm rounded-lg transition-all ${
                saved
                  ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                  : 'bg-orange-500 hover:bg-orange-400 text-slate-950'
              }`}
            >
              <Save className="w-4 h-4" />
              {saved ? 'Uloženo ✓' : 'Uložit nastavení'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 text-sm font-medium rounded-lg transition-colors border border-slate-700 flex items-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ── Section: prices ──────────────────────────────────────────────────────

  if (section === 'prices') {
    const columns = getPriceColumns();
    return (
      <div className="p-4 lg:p-6 max-w-6xl mx-auto">
        <BackButton onClick={() => setSection(null)} label="Nastavení" />
        <div className="mb-5">
          <h2 className="text-lg font-bold text-white">Ceník</h2>
          <p className="text-sm text-slate-500 mt-0.5">Upravte ceny služeb a balíčků</p>
        </div>
        <form onSubmit={handlePriceSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
            {columns.map((col) => (
              <div key={col.column} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
                <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">{col.column}</h3>
                {col.groups.map((g) => (
                  <div key={g.group}>
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">{g.group}</div>
                    <div className="divide-y divide-slate-800/60">
                      {g.items.map((item) => (
                        <PriceRow
                          key={item.id}
                          item={item}
                          value={priceForm[item.id] ?? item.defaultPrice}
                          onChange={(val) => setPriceForm((prev) => ({ ...prev, [item.id]: val }))}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <button
            type="submit"
            className={`w-full flex items-center justify-center gap-2 py-2.5 font-semibold text-sm rounded-lg transition-all ${
              priceSaved
                ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                : 'bg-orange-500 hover:bg-orange-400 text-slate-950'
            }`}
          >
            <Save className="w-4 h-4" />
            {priceSaved ? 'Ceník uložen ✓' : 'Uložit ceník'}
          </button>
        </form>
      </div>
    );
  }

  // ── Section: password ────────────────────────────────────────────────────

  return (
    <div className="p-4 lg:p-6 max-w-lg mx-auto">
      <BackButton onClick={() => setSection(null)} label="Nastavení" />
      <div className="mb-5">
        <h2 className="text-lg font-bold text-white">Heslo</h2>
        <p className="text-sm text-slate-500 mt-0.5">{user ? `Přihlášen jako ${user.name}` : 'Změna hesla'}</p>
      </div>
      <form onSubmit={handlePwSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Stávající heslo</label>
          <input type="password" value={pwForm.current} onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Nové heslo</label>
            <input type="password" value={pwForm.next} onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Potvrdit heslo</label>
            <input type="password" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors" />
          </div>
        </div>
        {pwMsg.text && <p className={`text-sm ${pwMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{pwMsg.text}</p>}
        <button type="submit" className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors">
          Změnit heslo
        </button>
      </form>
    </div>
  );
}
