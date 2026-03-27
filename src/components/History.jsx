import React, { useState, useMemo } from 'react';
import {
  Download, ChevronDown,
  TrendingUp, TrendingDown, Wallet, Hash,
  ClipboardList, CreditCard, Pencil, X,
} from 'lucide-react';
import { formatCzk, formatDate, formatOrderNumber } from '../utils/calculations';

// ─── CSV exports ─────────────────────────────────────────────────────────────

function exportOrdersCsv(orders, settings) {
  const { partner1, partner2, split } = settings;
  const sorted = [...orders].sort((a, b) => b.date.localeCompare(a.date));
  const rows = [['Číslo', 'Datum', 'Popis', `${partner1} (${split}%)`, `${partner2} (${100 - split}%)`, 'Celkem (Kč)', 'Pracovali', 'Doba (h)', 'Stav']];
  sorted.forEach((o) => {
    rows.push([
      formatOrderNumber(o.orderNumber),
      o.date,
      o.description,
      Math.round(o.price * (split / 100)),
      Math.round(o.price * ((100 - split) / 100)),
      o.price,
      (o.workers || []).join(', '),
      o.durationHours || '',
      o.status === 'open' ? 'Otevřená' : 'Uzavřená',
    ]);
  });
  downloadCsv(rows, 'h2-zakazky.csv');
}

function exportExpensesCsv(expenses) {
  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));
  const rows = [['Datum', 'Popis', 'Kategorie', 'Kdo zaplatil', 'Částka (Kč)']];
  sorted.forEach((e) => rows.push([e.date, e.description, e.category, e.payer, e.amount]));
  downloadCsv(rows, 'h2-naklady.csv');
}

function downloadCsv(rows, filename) {
  const csv = rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── PDF exports ─────────────────────────────────────────────────────────────

function exportPdf(title, htmlContent) {
  const w = window.open('', '_blank', 'width=900,height=700');
  w.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${title}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; color: #1e293b; padding: 20px; }
  h1 { font-size: 16px; margin-bottom: 4px; }
  .subtitle { color: #64748b; font-size: 11px; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f1f5f9; text-align: left; padding: 6px 8px; font-size: 11px; border-bottom: 2px solid #e2e8f0; }
  td { padding: 5px 8px; border-bottom: 1px solid #f1f5f9; }
  tr:hover td { background: #f8fafc; }
  .right { text-align: right; }
  .total { font-weight: bold; background: #f8fafc; }
</style>
</head><body>${htmlContent}<script>window.onload=()=>{window.print();}<\/script></body></html>`);
  w.document.close();
}

function exportOrdersPdf(orders, settings) {
  const { partner1, partner2, split } = settings;
  const sorted = [...orders].sort((a, b) => b.date.localeCompare(a.date));
  const total = sorted.reduce((s, o) => s + Number(o.price), 0);
  const rows = sorted.map(o => `
    <tr>
      <td>${o.orderNumber ? '#' + String(o.orderNumber).padStart(4,'0') : ''}</td>
      <td>${o.date}</td>
      <td>${o.description || ''}</td>
      <td class="right">${Number(o.price).toLocaleString('cs-CZ')} Kč</td>
    </tr>`).join('');
  exportPdf('Zakázky — H2 Detailing', `
    <h1>Zakázky</h1>
    <div class="subtitle">Celkem: ${total.toLocaleString('cs-CZ')} Kč · ${sorted.length} zakázek</div>
    <table>
      <thead><tr><th>#</th><th>Datum</th><th>Popis</th><th class="right">Částka</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr class="total"><td colspan="3">Celkem</td><td class="right">${total.toLocaleString('cs-CZ')} Kč</td></tr></tfoot>
    </table>`);
}

function exportExpensesPdf(expenses) {
  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));
  const total = sorted.reduce((s, e) => s + Number(e.amount), 0);
  const rows = sorted.map(e => `
    <tr>
      <td>${e.date}</td>
      <td>${e.description || ''}</td>
      <td>${e.category || ''}</td>
      <td>${e.payer || ''}</td>
      <td class="right">${Number(e.amount).toLocaleString('cs-CZ')} Kč</td>
    </tr>`).join('');
  exportPdf('Náklady — H2 Detailing', `
    <h1>Náklady</h1>
    <div class="subtitle">Celkem: ${total.toLocaleString('cs-CZ')} Kč · ${sorted.length} položek</div>
    <table>
      <thead><tr><th>Datum</th><th>Popis</th><th>Kategorie</th><th>Kdo zaplatil</th><th class="right">Částka</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr class="total"><td colspan="4">Celkem</td><td class="right">${total.toLocaleString('cs-CZ')} Kč</td></tr></tfoot>
    </table>`);
}

// ─── Category styling ─────────────────────────────────────────────────────────

const CAT = {
  'Materiál':    { bg: 'bg-blue-500/10   text-blue-400   border-blue-500/20' },
  'Vybavení':    { bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  'Režie dílny': { bg: 'bg-amber-500/10  text-amber-400  border-amber-500/20' },
  'Ostatní':     { bg: 'bg-slate-500/10  text-slate-400  border-slate-500/20' },
};
const catStyle = (c) => (CAT[c] || CAT['Ostatní']).bg;

// ─── Shared helpers ───────────────────────────────────────────────────────────

function MonthChipFilter({ value, onChange, months }) {
  const monthNames = ['Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čvn', 'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro'];

  if (months.length === 0) return null;

  // Sort available months Jan→Dec (by month number, then year)
  const sorted = [...months].sort((a, b) => {
    const moA = parseInt(a.slice(5));
    const moB = parseInt(b.slice(5));
    return moA !== moB ? moA - moB : a.localeCompare(b);
  });

  // If data spans multiple years, append 2-digit year to disambiguate
  const years = new Set(months.map(m => m.slice(0, 4)));
  const multi = years.size > 1;

  const chip = (active) =>
    `px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
      active
        ? 'bg-orange-500/10 border-orange-500/40 text-orange-400'
        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
    }`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={() => onChange('')} className={chip(!value)}>Vše</button>
      {sorted.map(m => {
        const mo  = parseInt(m.slice(5)) - 1;
        const yr  = m.slice(2, 4);
        const label = multi ? `${monthNames[mo]} ${yr}` : monthNames[mo];
        return (
          <button
            key={m}
            onClick={() => onChange(value === m ? '' : m)}
            className={chip(value === m)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, sub, color }) {
  const palette = {
    green:  { card: 'border-emerald-500/20 bg-emerald-500/5',  text: 'text-emerald-400', icon: 'text-emerald-400' },
    red:    { card: 'border-red-500/20     bg-red-500/5',      text: 'text-red-400',     icon: 'text-red-400' },
    orange: { card: 'border-orange-500/20  bg-orange-500/5',   text: 'text-orange-400',  icon: 'text-orange-400' },
    blue:   { card: 'border-blue-500/20    bg-blue-500/5',     text: 'text-blue-400',    icon: 'text-blue-400' },
  };
  const c = palette[color] || palette.orange;
  return (
    <div className={`rounded-xl border p-4 ${c.card}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${c.icon}`} />
        <span className="text-xs text-slate-500">{label}</span>
      </div>
      <div className={`text-xl font-bold ${c.text}`}>{value}</div>
      {sub && <div className="text-xs text-slate-600 mt-0.5">{sub}</div>}
    </div>
  );
}

// ─── Panel header (shared, identical markup for both panels) ─────────────────

function PanelHeader({ icon: Icon, iconColor, title, count, total, totalColor, onExport, onExportPdf }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
      <div className="flex items-center gap-2.5">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <span className="text-sm font-semibold text-white">{title}</span>
        <span className="text-xs text-slate-600">({count})</span>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-sm font-bold ${totalColor}`}>{total}</span>
        <button
          onClick={onExport}
          className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
        >
          <Download className="w-3 h-3" />CSV
        </button>
        <button
          onClick={onExportPdf}
          className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
        >
          <Download className="w-3 h-3" />PDF
        </button>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyRow({ label }) {
  return (
    <div className="py-12 text-center text-slate-600 text-sm">{label}</div>
  );
}

// ─── Edit modals ──────────────────────────────────────────────────────────────

const CATEGORIES = ['Materiál', 'Vybavení', 'Režie dílny', 'Ostatní'];

function EditOrderModal({ order, settings, onSave, onClose }) {
  const { partner1, partner2, split } = settings;
  const [form, setForm] = useState({
    date: order.date,
    description: order.description,
    price: String(order.price),
    note: order.note || '',
    workers: order.workers || [],
    durationHours: order.durationHours ? String(order.durationHours) : '',
    splitOverride: order.splitOverride != null ? String(order.splitOverride) : '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const toggleWorker = (name) =>
    setForm(f => ({ ...f, workers: f.workers.includes(name) ? f.workers.filter(w => w !== name) : [...f.workers, name] }));

  const effectiveSplit = form.splitOverride !== '' ? Number(form.splitOverride) : split;
  const price = parseFloat(form.price) || 0;
  const p1 = Math.round(price * effectiveSplit / 100);
  const p2 = price - p1;

  const handleSave = async () => {
    if (!form.description.trim()) return setError('Vyplňte popis.');
    if (!form.price || parseFloat(form.price) <= 0) return setError('Zadejte platnou cenu.');
    setError(''); setSaving(true);
    try {
      await onSave({
        date: form.date,
        description: form.description.trim(),
        price: parseFloat(form.price),
        note: form.note.trim(),
        workers: form.workers,
        durationHours: form.durationHours ? parseFloat(form.durationHours) : null,
        clientId: order.clientId,
        vehicleId: order.vehicleId,
        status: order.status,
        splitOverride: form.splitOverride !== '' ? parseFloat(form.splitOverride) : null,
      });
    } catch (e) { setError(e.message); setSaving(false); }
  };

  const inp = 'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors';
  const togBtn = (active) => `flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${active ? 'bg-orange-500/10 border-orange-500/50 text-orange-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-white">Upravit zakázku</h2>
          <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Datum</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={inp} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Cena (Kč)</label>
              <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} min="0" step="1" className={inp} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Popis</label>
            <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inp} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Délka (hodin)</label>
              <input type="number" value={form.durationHours} onChange={e => setForm(f => ({ ...f, durationHours: e.target.value }))} min="0" step="0.5" placeholder="—" className={inp} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Split override (%)</label>
              <input type="number" value={form.splitOverride} onChange={e => setForm(f => ({ ...f, splitOverride: e.target.value }))} min="0" max="100" step="5" placeholder={`${split} (výchozí)`} className={inp} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Kdo pracoval</label>
            <div className="flex gap-2">
              {[partner1, partner2].map(p => (
                <button key={p} type="button" onClick={() => toggleWorker(p)} className={togBtn(form.workers.includes(p))}>{p}</button>
              ))}
            </div>
          </div>
          {price > 0 && (
            <div className="flex gap-3">
              <div className="flex-1 bg-slate-800/60 rounded-lg px-3 py-2">
                <div className="text-xs text-slate-500">{partner1} · {effectiveSplit} %</div>
                <div className="text-sm font-semibold text-orange-400">{formatCzk(p1)}</div>
              </div>
              <div className="flex-1 bg-slate-800/60 rounded-lg px-3 py-2">
                <div className="text-xs text-slate-500">{partner2} · {100 - effectiveSplit} %</div>
                <div className="text-sm font-semibold text-purple-400">{formatCzk(p2)}</div>
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Poznámka</label>
            <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} rows={2} placeholder="Volitelná poznámka…" className={inp + ' resize-none'} />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-semibold text-sm rounded-lg transition-colors">
            {saving ? 'Ukládání…' : 'Uložit změny'}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg border border-slate-700 transition-colors">Zrušit</button>
        </div>
      </div>
    </div>
  );
}

function EditExpenseModal({ expense, settings, onSave, onClose }) {
  const { partner1, partner2 } = settings;
  const PAYERS = ['Společná kasa', partner1, partner2];
  const [form, setForm] = useState({
    date: expense.date,
    description: expense.description,
    amount: String(expense.amount),
    payer: expense.payer,
    category: expense.category || 'Materiál',
    vatIncluded: expense.vatIncluded !== 0,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.description.trim()) return setError('Vyplňte popis.');
    if (!form.amount || parseFloat(form.amount) <= 0) return setError('Zadejte platnou částku.');
    setError(''); setSaving(true);
    try {
      await onSave({ date: form.date, description: form.description.trim(), amount: parseFloat(form.amount), payer: form.payer, category: form.category, vatIncluded: form.vatIncluded });
    } catch (e) { setError(e.message); setSaving(false); }
  };

  const inp = 'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors';
  const togBtn = (active) => `flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${active ? 'bg-orange-500/10 border-orange-500/50 text-orange-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-white">Upravit náklad</h2>
          <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Datum</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={inp} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Částka (Kč)</label>
              <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} min="0" step="1" className={inp} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Popis</label>
            <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inp} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Kdo zaplatil</label>
            <div className="flex gap-2">
              {PAYERS.map(p => <button key={p} type="button" onClick={() => setForm(f => ({ ...f, payer: p }))} className={togBtn(form.payer === p)}>{p}</button>)}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Kategorie</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(c => <button key={c} type="button" onClick={() => setForm(f => ({ ...f, category: c }))} className={togBtn(form.category === c)}>{c}</button>)}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">DPH</label>
            <div className="flex gap-2">
              {[{ label: 'S DPH', value: true }, { label: 'Bez DPH', value: false }].map(({ label, value }) => (
                <button key={label} type="button" onClick={() => setForm(f => ({ ...f, vatIncluded: value }))} className={togBtn(form.vatIncluded === value)}>{label}</button>
              ))}
            </div>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-semibold text-sm rounded-lg transition-colors">
            {saving ? 'Ukládání…' : 'Uložit změny'}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg border border-slate-700 transition-colors">Zrušit</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function History({
  orders, expenses, settings, clients = [],
  onDeleteOrder, onDeleteExpense,
  onUpdateOrder, onUpdateExpense,
}) {
  const [filterMonth,   setFilterMonth]   = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editItem,      setEditItem]      = useState(null); // { item, type }

  const availableMonths = useMemo(() => {
    const m = new Set([
      ...orders.map((o) => o.date.slice(0, 7)),
      ...expenses.map((e) => e.date.slice(0, 7)),
    ]);
    return [...m].sort().reverse();
  }, [orders, expenses]);

  const filteredOrders = useMemo(() => {
    const res = [...orders].sort((a, b) => b.date.localeCompare(a.date));
    return filterMonth ? res.filter((o) => o.date.startsWith(filterMonth)) : res;
  }, [orders, filterMonth]);

  const filteredExpenses = useMemo(() => {
    const res = [...expenses].sort((a, b) => b.date.localeCompare(a.date));
    return filterMonth ? res.filter((e) => e.date.startsWith(filterMonth)) : res;
  }, [expenses, filterMonth]);

  const totalRevenue  = filteredOrders.reduce((s, o) => s + Number(o.price), 0);
  const totalExpenses = filteredExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const netProfit     = totalRevenue - totalExpenses;

  const getClientLabel = (order) => {
    if (!order.clientId) return null;
    const client = clients.find((c) => c.id === order.clientId);
    if (!client) return null;
    const vehicle = order.vehicleId
      ? client.vehicles.find((v) => v.id === order.vehicleId)
      : null;
    return vehicle ? `${client.name} · ${vehicle.make} ${vehicle.model}` : client.name;
  };

  const handleDelete = (item, type) => {
    if (confirmDelete === item.id) {
      type === 'order' ? onDeleteOrder(item.id) : onDeleteExpense(item.id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(item.id);
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Přehled transakcí</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {filteredOrders.length} zakázek · {filteredExpenses.length} nákladů
          </p>
        </div>
        <MonthChipFilter value={filterMonth} onChange={setFilterMonth} months={availableMonths} />
      </div>

      {/* ── Summary strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard icon={TrendingUp}   color="green"                         label="Tržby"         value={formatCzk(totalRevenue)}  sub={`${filteredOrders.length} zakázek`} />
        <SummaryCard icon={TrendingDown} color="red"                           label="Náklady"       value={formatCzk(totalExpenses)} sub={`${filteredExpenses.length} položek`} />
        <SummaryCard icon={Wallet}       color={netProfit >= 0 ? 'orange' : 'red'} label="Zisk"     value={formatCzk(netProfit)} />
        <SummaryCard icon={Hash}         color="blue"                          label="Průměr zakázky" value={filteredOrders.length > 0 ? formatCzk(Math.round(totalRevenue / filteredOrders.length)) : '—'} />
      </div>

      {/* ── Two panels ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

        {/* ════ ZAKÁZKY ════ */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <PanelHeader
            icon={ClipboardList}
            iconColor="text-emerald-400"
            title="Zakázky"
            count={filteredOrders.length}
            total={formatCzk(totalRevenue)}
            totalColor="text-emerald-400"
            onExport={() => exportOrdersCsv(filteredOrders, settings)}
            onExportPdf={() => exportOrdersPdf(filteredOrders, settings)}
          />

          {filteredOrders.length === 0 ? (
            <EmptyRow label="Žádné zakázky pro vybraný filtr" />
          ) : (
            <div className="divide-y divide-slate-800/50">
              {filteredOrders.map((order) => {
                const p1 = order.price * (settings.split / 100);
                const p2 = order.price * ((100 - settings.split) / 100);
                const clientLabel = getClientLabel(order);
                const isDel = confirmDelete === order.id;

                return (
                  <div
                    key={order.id}
                    className="flex items-start gap-3 px-5 py-3 hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Order number */}
                    <span className="text-xs font-mono text-slate-600 flex-shrink-0 mt-0.5 w-11 text-right">
                      {formatOrderNumber(order.orderNumber)}
                    </span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-white font-medium truncate">
                          {order.description}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded border ${
                          order.status === 'open'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-slate-700/50 text-slate-500 border-slate-600/30'
                        }`}>
                          {order.status === 'open' ? 'Otevřená' : 'Uzavřená'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs text-slate-500">
                        <span>{formatDate(order.date)}</span>
                        {clientLabel && <span className="text-slate-600 truncate max-w-[160px]">{clientLabel}</span>}
                        {order.durationHours > 0 && <span>{order.durationHours} h</span>}
                      </div>
                      <div className="flex gap-3 mt-0.5">
                        <span className="text-xs text-orange-400/60">{settings.partner1} {formatCzk(p1)}</span>
                        <span className="text-xs text-purple-400/60">{settings.partner2} {formatCzk(p2)}</span>
                      </div>
                      {order.note && (
                        <div className="text-xs text-slate-600 italic mt-0.5 truncate">{order.note}</div>
                      )}
                    </div>

                    {/* Price + actions */}
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className="text-sm font-semibold text-emerald-400">
                        +{formatCzk(order.price)}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setConfirmDelete(null); setEditItem({ item: order, type: 'order' }); }}
                          className="p-1 text-slate-600 hover:text-orange-400 hover:bg-slate-800 rounded transition-colors"
                          title="Upravit"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(order, 'order')}
                          className={`text-xs rounded px-1.5 py-0.5 transition-colors ${
                            isDel ? 'bg-red-500/20 text-red-400 !opacity-100' : 'text-slate-600 hover:text-red-400 hover:bg-slate-800'
                          }`}
                        >
                          {isDel ? 'Potvrdit' : '×'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ════ NÁKLADY ════ */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <PanelHeader
            icon={CreditCard}
            iconColor="text-red-400"
            title="Náklady"
            count={filteredExpenses.length}
            total={`-${formatCzk(totalExpenses)}`}
            totalColor="text-red-400"
            onExport={() => exportExpensesCsv(filteredExpenses)}
            onExportPdf={() => exportExpensesPdf(filteredExpenses)}
          />

          {filteredExpenses.length === 0 ? (
            <EmptyRow label="Žádné náklady pro vybraný filtr" />
          ) : (
            <div className="divide-y divide-slate-800/50">
              {filteredExpenses.map((expense) => {
                const isDel = confirmDelete === expense.id;
                return (
                  <div
                    key={expense.id}
                    className="flex items-start gap-3 px-5 py-3 hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-white font-medium truncate">{expense.description}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded border flex-shrink-0 ${catStyle(expense.category)}`}>
                          {expense.category || 'Ostatní'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                        <span>{formatDate(expense.date)}</span>
                        <span className="text-slate-600">{expense.payer}</span>
                      </div>
                    </div>

                    {/* Amount + actions */}
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className="text-sm font-semibold text-red-400">
                        -{formatCzk(expense.amount)}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setConfirmDelete(null); setEditItem({ item: expense, type: 'expense' }); }}
                          className="p-1 text-slate-600 hover:text-orange-400 hover:bg-slate-800 rounded transition-colors"
                          title="Upravit"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(expense, 'expense')}
                          className={`text-xs rounded px-1.5 py-0.5 transition-colors ${
                            isDel ? 'bg-red-500/20 text-red-400 !opacity-100' : 'text-slate-600 hover:text-red-400 hover:bg-slate-800'
                          }`}
                        >
                          {isDel ? 'Potvrdit' : '×'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Edit modals ── */}
      {editItem?.type === 'order' && (
        <EditOrderModal
          order={editItem.item}
          settings={settings}
          onSave={async (data) => { await onUpdateOrder(editItem.item.id, data); setEditItem(null); }}
          onClose={() => setEditItem(null)}
        />
      )}
      {editItem?.type === 'expense' && (
        <EditExpenseModal
          expense={editItem.item}
          settings={settings}
          onSave={async (data) => { await onUpdateExpense(editItem.item.id, data); setEditItem(null); }}
          onClose={() => setEditItem(null)}
        />
      )}
    </div>
  );
}
