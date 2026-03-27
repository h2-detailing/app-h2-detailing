import React, { useState, useEffect } from 'react';
import { Save, RotateCcw, KeyRound, Tag } from 'lucide-react';
import { api } from '../api/index';
import { getAllPriceItems } from '../data/services';

export default function Settings({ settings, onSave, onSavePrices, customPrices = {}, user }) {
  const [form, setForm] = useState(settings);
  const [saved, setSaved] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState({ text: '', ok: false });

  const buildPriceForm = (overrides) => {
    const map = {};
    for (const group of getAllPriceItems()) {
      for (const item of group.items) {
        map[item.id] = overrides[item.id] ?? item.defaultPrice;
      }
    }
    return map;
  };
  const [priceForm, setPriceForm] = useState(() => buildPriceForm(customPrices));
  const [priceSaved, setPriceSaved] = useState(false);

  useEffect(() => { setForm(settings); }, [settings]);
  useEffect(() => { setPriceForm(buildPriceForm(customPrices)); }, [customPrices]); // eslint-disable-line react-hooks/exhaustive-deps

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

  return (
    <div className="p-4 lg:p-6 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Nastavení</h1>
        <p className="text-sm text-slate-500 mt-0.5">Konfigurace partnerství a dílny</p>
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

      {/* Price editor */}
      <form onSubmit={handlePriceSubmit} className="mt-4 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <Tag className="w-4 h-4 text-slate-500" />
          Upravit ceník
        </h3>
        {getAllPriceItems().map((group) => (
          <div key={group.group}>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{group.group}</div>
            <div className="space-y-2">
              {group.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <span className="flex-1 text-sm text-slate-300">{item.name}</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={priceForm[item.id] ?? item.defaultPrice}
                      onChange={(e) => setPriceForm((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      min="0"
                      step="10"
                      className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-sm text-right focus:outline-none focus:border-orange-500 transition-colors"
                    />
                    <span className="text-xs text-slate-500 w-10">{item.unit ? 'Kč/ks' : 'Kč'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
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

      {/* Password change */}
      <form onSubmit={handlePwSubmit} className="mt-4 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-slate-500" />
          Změna hesla {user ? `(${user.name})` : ''}
        </h3>
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
