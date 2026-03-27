import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, Minus, ChevronRight, Check, X, Search } from 'lucide-react';
import { formatCzk } from '../utils/calculations';
import { SERVICES } from '../data/services';

// ─── Stepper ─────────────────────────────────────────────────────────────────

function Stepper({ value, onChange, onRemove }) {
  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={() => (value <= 1 ? onRemove() : onChange(value - 1))}
        className="w-5 h-5 flex items-center justify-center rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors">
        <Minus className="w-3 h-3" />
      </button>
      <span className="w-5 text-center text-sm text-white">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)}
        className="w-5 h-5 flex items-center justify-center rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors">
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─── Service Picker ───────────────────────────────────────────────────────────

function ServicePicker({ onApply }) {
  const [openSections, setOpenSections] = useState({ interior: true, exterior: false, upholstery: false });
  const toggleSection = (key) => setOpenSections(s => ({ ...s, [key]: !s[key] }));
  const [selectedPackage, setSelectedPackage] = useState('');
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [extras, setExtras] = useState({});
  const [upholstery, setUpholstery] = useState({});
  const [upholsteryTab, setUpholsteryTab] = useState('fabric');
  const [expandedPkg, setExpandedPkg] = useState(null);

  const toggleAddon = (id) => setSelectedAddons((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const toggleExtra = (id) => setExtras((p) => p[id] ? (({ [id]: _, ...rest }) => rest)(p) : { ...p, [id]: 1 });
  const toggleUph   = (id) => setUpholstery((p) => p[id] ? (({ [id]: _, ...rest }) => rest)(p) : { ...p, [id]: 1 });
  const updateQty   = (setMap, id, qty) => setMap((p) => ({ ...p, [id]: qty }));

  const { total, serviceText } = useMemo(() => {
    let t = 0;
    const parts = [];
    if (selectedPackage) {
      const pkg = SERVICES.interior.packages.find((p) => p.id === selectedPackage);
      if (pkg) {
        t += pkg.price;
        let pkgDesc = pkg.name;
        const addonNames = selectedAddons.map((aid) => pkg.addons?.find((a) => a.id === aid)).filter(Boolean);
        addonNames.forEach((a) => { t += a.price; });
        if (addonNames.length) pkgDesc += ' + ' + addonNames.map((a) => a.name).join(', ');
        parts.push(pkgDesc);
      }
    }
    SERVICES.interior.extras.forEach((ex) => {
      if (extras[ex.id]) { t += ex.price * extras[ex.id]; parts.push(ex.unit ? `${ex.name} (${extras[ex.id]} ks)` : ex.name); }
    });
    [...SERVICES.upholstery.fabric, ...SERVICES.upholstery.leather].forEach((item) => {
      if (upholstery[item.id]) { t += item.price * upholstery[item.id]; parts.push(upholstery[item.id] > 1 ? `${item.name} (${upholstery[item.id]}×)` : item.name); }
    });
    return { total: t, serviceText: parts.join(', ') };
  }, [selectedPackage, selectedAddons, extras, upholstery]);

  const hasSelection = !!selectedPackage || Object.keys(extras).length > 0 || Object.keys(upholstery).length > 0;
  const sectionBtnCls = (key) => `px-3 py-1.5 rounded-md text-xs font-medium transition-all ${openSections[key] ? 'bg-orange-500/15 text-orange-400 border border-orange-500/25' : 'text-slate-400 hover:text-white border border-transparent'}`;
  const subCls = (id, active) => `px-3 py-1 rounded text-xs font-medium transition-all ${active === id ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`;

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-4">
      <div className="flex gap-1 bg-slate-900 rounded-lg p-1 w-fit">
        <button type="button" className={sectionBtnCls('interior')}   onClick={() => toggleSection('interior')}>Interiér</button>
        <button type="button" className={sectionBtnCls('exterior')}   onClick={() => toggleSection('exterior')}>Exteriér</button>
        <button type="button" className={sectionBtnCls('upholstery')} onClick={() => toggleSection('upholstery')}>Čalounění</button>
      </div>

      {openSections.interior && (
        <div className="space-y-4">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Balíček</div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="pkg" value="" checked={selectedPackage === ''} onChange={() => { setSelectedPackage(''); setSelectedAddons([]); }} className="accent-orange-500" />
                <span className="text-sm text-slate-400">Bez balíčku</span>
              </label>
              {SERVICES.interior.packages.map((pkg) => (
                <div key={pkg.id} className="rounded-lg border border-slate-700/60 bg-slate-800/40 overflow-hidden">
                  <label className="flex items-center gap-2 cursor-pointer px-3 py-2.5">
                    <input type="radio" name="pkg" value={pkg.id} checked={selectedPackage === pkg.id} onChange={() => { setSelectedPackage(pkg.id); setSelectedAddons([]); }} className="accent-orange-500" />
                    <span className="flex-1 text-sm text-white font-medium">{pkg.name}</span>
                    <span className="text-xs text-orange-400 font-semibold">od {formatCzk(pkg.price)}</span>
                    <button type="button" onClick={(e) => { e.preventDefault(); setExpandedPkg(expandedPkg === pkg.id ? null : pkg.id); }} className="text-slate-500 hover:text-slate-300 ml-1">
                      {expandedPkg === pkg.id ? <ChevronUp className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  </label>
                  {expandedPkg === pkg.id && (
                    <div className="px-4 pb-3 border-t border-slate-700/40">
                      <ul className="mt-2 space-y-1">
                        {pkg.includes.map((item) => (
                          <li key={item} className="text-xs text-slate-500 flex items-center gap-1.5">
                            <Check className="w-3 h-3 text-orange-500/60 flex-shrink-0" />{item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedPackage === pkg.id && pkg.addons?.length > 0 && (
                    <div className="px-4 pb-3 border-t border-slate-700/40 pt-2 space-y-1.5">
                      {pkg.addons.map((addon, idx) => (
                        <React.Fragment key={addon.id}>
                          {addon.group === 'vehicle' && (idx === 0 || pkg.addons[idx-1]?.group !== 'vehicle') && (
                            <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide pt-1">Typ vozidla</div>
                          )}
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={selectedAddons.includes(addon.id)} onChange={() => toggleAddon(addon.id)} className="accent-orange-500" />
                            <span className="text-xs text-slate-300">{addon.name}</span>
                            <span className="text-xs text-orange-400 ml-auto">+{formatCzk(addon.price)}</span>
                          </label>
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Extra služby</div>
            <div className="space-y-2">
              {SERVICES.interior.extras.map((ex) => (
                <div key={ex.id} className="flex items-center gap-2">
                  <input type="checkbox" checked={!!extras[ex.id]} onChange={() => toggleExtra(ex.id)} className="accent-orange-500" />
                  <span className="flex-1 text-sm text-slate-300">{ex.name}</span>
                  {ex.unit ? (
                    <>
                      {extras[ex.id] && <Stepper value={extras[ex.id]} onChange={(q) => updateQty(setExtras, ex.id, q)} onRemove={() => toggleExtra(ex.id)} />}
                      <span className="text-xs text-slate-500 w-20 text-right">{extras[ex.id] ? formatCzk(ex.price * extras[ex.id]) : `${ex.price} Kč/ks`}</span>
                    </>
                  ) : (
                    <span className="text-xs text-slate-500 w-16 text-right">{formatCzk(ex.price)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {openSections.exterior && (
        <div className="text-center py-6 text-slate-600">
          <p className="text-sm">Ceník exteriéru bude brzy k dispozici.</p>
        </div>
      )}

      {openSections.upholstery && (
        <div className="space-y-3">
          <div className="flex gap-1">
            <button type="button" className={subCls('fabric', upholsteryTab)} onClick={() => setUpholsteryTab('fabric')}>Látka</button>
            <button type="button" className={subCls('leather', upholsteryTab)} onClick={() => setUpholsteryTab('leather')}>Kůže</button>
          </div>
          <div className="space-y-2">
            {(upholsteryTab === 'fabric' ? SERVICES.upholstery.fabric : SERVICES.upholstery.leather).map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <input type="checkbox" checked={!!upholstery[item.id]} onChange={() => toggleUph(item.id)} className="accent-orange-500" />
                <span className="flex-1 text-sm text-slate-300">{item.name}</span>
                {upholstery[item.id] && <Stepper value={upholstery[item.id]} onChange={(q) => updateQty(setUpholstery, item.id, q)} onRemove={() => toggleUph(item.id)} />}
                <span className="text-xs text-slate-500 w-24 text-right">
                  {upholstery[item.id] ? `od ${formatCzk(item.price * upholstery[item.id])}` : `od ${formatCzk(item.price)}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-slate-700 pt-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs text-slate-500">Celkem ze služeb</div>
          <div className="text-lg font-bold text-white">{formatCzk(total)}</div>
        </div>
        <div className="flex gap-2">
          {hasSelection && (
            <button type="button" onClick={() => { setSelectedPackage(''); setSelectedAddons([]); setExtras({}); setUpholstery({}); }}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white border border-slate-700 rounded-lg transition-colors">
              Vymazat
            </button>
          )}
          <button type="button" onClick={() => onApply(total, serviceText)} disabled={total === 0}
            className="px-4 py-1.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-colors">
            Použít jako cenu
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Client combobox (typeahead) ─────────────────────────────────────────────

function clientDisplayName(c) {
  if (c.isCompany && c.displayAs === 'company' && c.companyName?.trim()) {
    return c.companyName.trim();
  }
  return c.name;
}

function ClientCombobox({ clients, value, onChange, onAddClient, inputCls }) {
  const [query, setQuery] = useState('');
  const [open, setOpen]   = useState(false);
  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName]     = useState('');
  const [newPhone, setNewPhone]   = useState('');
  const [saving, setSaving]       = useState(false);
  const [addError, setAddError]   = useState('');
  const ref = useRef(null);

  const selected = clients.find((c) => c.id === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      (c.companyName || '').toLowerCase().includes(q)
    );
  }, [clients, query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (client) => { onChange(client?.id ?? ''); setQuery(''); setOpen(false); };

  const handleAddNew = async () => {
    if (!newName.trim()) { setAddError('Jméno je povinné.'); return; }
    setSaving(true);
    setAddError('');
    try {
      const created = await onAddClient({ name: newName.trim(), phone: newPhone.trim(), companyName: '', displayAs: 'name', email: '', note: '', isCompany: false, ico: '', dic: '', billingAddress: '' });
      select(created);
      setAddingNew(false);
      setNewName('');
      setNewPhone('');
    } catch {
      setAddError('Nepodařilo se přidat klienta.');
    } finally {
      setSaving(false);
    }
  };

  // ── Selected state: show chip with clear button ──
  if (selected) {
    return (
      <div className="flex items-center gap-2 bg-slate-800 border border-orange-500/40 rounded-lg px-3 py-2.5">
        <span className="flex-1 text-sm text-white font-medium truncate">{clientDisplayName(selected)}</span>
        <button
          type="button"
          onClick={() => select(null)}
          className="flex-shrink-0 text-slate-500 hover:text-white transition-colors"
          title="Zrušit výběr"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // ── Inline new client form ──
  if (addingNew) {
    return (
      <div className="bg-slate-800 border border-orange-500/40 rounded-lg p-3 space-y-2">
        <div className="text-xs font-semibold text-orange-400 mb-1">Nový klient</div>
        <input
          autoFocus
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Jméno a příjmení *"
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors"
        />
        <input
          type="text"
          value={newPhone}
          onChange={(e) => setNewPhone(e.target.value)}
          placeholder="Telefon (volitelné)"
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors"
        />
        {addError && <p className="text-xs text-red-400">{addError}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleAddNew}
            disabled={saving}
            className="flex-1 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white text-xs font-semibold rounded-lg px-3 py-2 transition-colors"
          >
            {saving ? 'Ukládám…' : 'Přidat klienta'}
          </button>
          <button
            type="button"
            onClick={() => { setAddingNew(false); setNewName(''); setNewPhone(''); setAddError(''); }}
            className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold rounded-lg px-3 py-2 transition-colors"
          >
            Zrušit
          </button>
        </div>
      </div>
    );
  }

  // ── Search state ──
  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Začni psát jméno klienta…"
        className={inputCls + ' pr-9'}
        autoComplete="off"
      />
      <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />

      {open && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
          {/* No client option */}
          <button
            type="button"
            onClick={() => select(null)}
            className="w-full px-3 py-2.5 text-left text-sm text-slate-500 hover:bg-slate-700/60 transition-colors border-b border-slate-700/60"
          >
            — Bez klienta —
          </button>

          {/* Filtered list */}
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-3 text-sm text-slate-600 text-center">Žádný klient nenalezen</div>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => select(c)}
                  className="w-full px-3 py-2.5 text-left hover:bg-slate-700/60 transition-colors flex items-center justify-between gap-3"
                >
                  <span className="text-sm text-white font-medium truncate">{clientDisplayName(c)}</span>
                  {c.vehicles.length > 0 && (
                    <span className="text-xs text-slate-500 flex-shrink-0">
                      {c.vehicles.length} {c.vehicles.length === 1 ? 'auto' : c.vehicles.length < 5 ? 'auta' : 'aut'}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Add new client */}
          {onAddClient && (
            <button
              type="button"
              onClick={() => { setOpen(false); setAddingNew(true); }}
              className="w-full px-3 py-2.5 text-left text-sm text-orange-400 hover:bg-slate-700/60 transition-colors border-t border-slate-700/60 flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              Přidat klienta
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Field label helper ───────────────────────────────────────────────────────

function Label({ children, optional }) {
  return (
    <label className="block text-xs font-medium text-slate-400 mb-1.5">
      {children}
      {optional && <span className="text-slate-600 font-normal ml-1">(volitelné)</span>}
    </label>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AddOrder({ settings, clients = [], onAdd, onAddClient, onCancel }) {
  const { partner1, partner2, split } = settings;

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    price: '',
    note: '',
    workers: [partner1, partner2],
    durationHours: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [serviceText, setServiceText] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [discountPct, setDiscountPct] = useState('');
  const [tipEnabled, setTipEnabled] = useState(false);
  const [tipAmount, setTipAmount] = useState('');
  const [splitOverrideEnabled, setSplitOverrideEnabled] = useState(false);
  const [customSplit, setCustomSplit] = useState(split);

  const price = parseFloat(form.price) || 0;
  const discountFraction = discountEnabled ? Math.min(Math.max(parseFloat(discountPct) || 0, 0), 100) / 100 : 0;
  const discountAmount = Math.round(price * discountFraction);
  const tip = tipEnabled ? Math.max(parseFloat(tipAmount) || 0, 0) : 0;
  const finalPrice = price - discountAmount + tip;
  const effectiveSplit = splitOverrideEnabled ? customSplit : split;
  const p1 = Math.round(finalPrice * (effectiveSplit / 100));
  const p2 = finalPrice - p1;

  const selectedClient  = clients.find((c) => c.id === selectedClientId) ?? null;
  const selectedVehicle = selectedClient?.vehicles.find((v) => v.id === selectedVehicleId) ?? null;

  const autoDescription = useMemo(() => {
    const parts = [];
    if (selectedClient)  parts.push(clientDisplayName(selectedClient));
    if (selectedVehicle) {
      const v = selectedVehicle;
      parts.push(`${v.make} ${v.model}${v.year ? ` (${v.year})` : ''}`);
    }
    if (serviceText) parts.push(serviceText);
    return parts.join(' – ') || 'Zakázka';
  }, [selectedClient, selectedVehicle, serviceText]);

  const toggleWorker = (name) =>
    setForm((f) => ({
      ...f,
      workers: f.workers.includes(name) ? f.workers.filter((w) => w !== name) : [...f.workers, name],
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.price || parseFloat(form.price) <= 0) return setError('Zadejte platnou cenu.');
    setError('');
    setSubmitting(true);
    try {
      await onAdd({
        date: form.date,
        description: autoDescription,
        price: finalPrice,
        note: form.note.trim(),
        clientId: selectedClientId || null,
        vehicleId: selectedVehicleId || null,
        workers: form.workers,
        durationHours: form.durationHours ? parseFloat(form.durationHours) : null,
        status: 'closed',
        splitOverride: splitOverrideEnabled ? customSplit : null,
      });
    } catch (err) {
      setError(err.message || 'Chyba při ukládání.');
      setSubmitting(false);
    }
  };

  const inputCls = "w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors";
  const toggleBtnCls = (active) =>
    `flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${active ? 'bg-orange-500/10 border-orange-500/50 text-orange-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'}`;

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Nová zakázka</h1>
          <p className="text-sm text-slate-500 mt-0.5">Přidat příjem za detailing</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />Zrušit
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* ── Direct grid — cards are grid children so each row auto-aligns heights ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* ROW 1 left ── Klient & Vozidlo */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Klient & Vozidlo <span className="text-slate-600 font-normal normal-case">(volitelné)</span>
            </div>
            <ClientCombobox
              clients={clients}
              value={selectedClientId}
              onChange={(id) => { setSelectedClientId(id); setSelectedVehicleId(''); }}
              onAddClient={onAddClient}
              inputCls={inputCls}
            />
            {selectedClient && (
              selectedClient.vehicles.length === 0
                ? <p className="text-xs text-slate-500 italic">Klient nemá přidána vozidla.</p>
                : (
                  <div className="flex flex-wrap gap-2">
                    {selectedClient.vehicles.map((v) => {
                      const active = selectedVehicleId === v.id;
                      return (
                        <button
                          key={v.id} type="button"
                          onClick={() => setSelectedVehicleId(selectedVehicleId === v.id ? '' : v.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${active ? 'bg-orange-500/15 border-orange-500/40 text-orange-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'}`}
                        >
                          {v.make} {v.model}{v.year ? ` (${v.year})` : ''}
                          {v.licensePlate && <span className="ml-1.5 opacity-60">{v.licensePlate}</span>}
                        </button>
                      );
                    })}
                  </div>
                )
            )}
          </div>

          {/* ROW 1 right ── Cena */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label>Cena pro zákazníka (Kč)</Label>
              <button type="button" onClick={() => setPickerOpen((o) => !o)}
                className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors -mt-1">
                {pickerOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {pickerOpen ? 'Skrýt ceník' : 'Sestavit ze služeb'}
              </button>
            </div>
            {pickerOpen && (
              <ServicePicker onApply={(total, desc) => {
                setForm((f) => ({ ...f, price: String(total) }));
                setServiceText(desc);
                setPickerOpen(false);
              }} />
            )}
            <input
              type="number" value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="0" min="0" step="1"
              className={inputCls + ' text-xl font-semibold'}
            />

            {/* Sleva */}
            {price > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => { setDiscountEnabled((d) => !d); setDiscountPct(''); }}
                  className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${discountEnabled ? 'text-amber-400 hover:text-amber-300' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${discountEnabled ? 'border-amber-400 bg-amber-400/20' : 'border-slate-600'}`}>
                    {discountEnabled && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                  </span>
                  Dát slevu
                </button>

                {discountEnabled && (
                  <div className="mt-2 bg-slate-800/60 border border-amber-500/20 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          value={discountPct}
                          onChange={(e) => setDiscountPct(e.target.value)}
                          placeholder="0"
                          min="0" max="100" step="1"
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors pr-8"
                          autoFocus
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium pointer-events-none">%</span>
                      </div>
                      <div className="flex gap-1.5">
                        {[5, 10, 15, 20].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setDiscountPct(String(pct))}
                            className={`px-2 py-1.5 rounded-md text-xs font-medium border transition-colors ${discountPct === String(pct) ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' : 'bg-slate-700 border-slate-600 text-slate-400 hover:text-white'}`}
                          >
                            {pct} %
                          </button>
                        ))}
                      </div>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-700/50">
                        <div className="space-y-0.5">
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-500">Cena bez slevy</span>
                            <span className="text-slate-400">{formatCzk(price)}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-500">Sleva {discountFraction * 100} %</span>
                            <span className="text-amber-400">− {formatCzk(discountAmount)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-500">Konečná cena</div>
                          <div className="text-base font-bold text-white">{formatCzk(finalPrice)}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Dýško */}
            {price > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => { setTipEnabled((d) => !d); setTipAmount(''); }}
                  className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${tipEnabled ? 'text-green-400 hover:text-green-300' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${tipEnabled ? 'border-green-400 bg-green-400/20' : 'border-slate-600'}`}>
                    {tipEnabled && <span className="w-1.5 h-1.5 rounded-full bg-green-400" />}
                  </span>
                  Spropitné
                </button>

                {tipEnabled && (
                  <div className="mt-2 bg-slate-800/60 border border-green-500/20 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          value={tipAmount}
                          onChange={(e) => setTipAmount(e.target.value)}
                          placeholder="0"
                          min="0" step="1"
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-green-500 transition-colors pr-12"
                          autoFocus
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium pointer-events-none">Kč</span>
                      </div>
                    </div>
                    {tip > 0 && (
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-700/50">
                        <div className="space-y-0.5">
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-500">Cena za práci</span>
                            <span className="text-slate-400">{formatCzk(price - discountAmount)}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-500">Dýško</span>
                            <span className="text-green-400">+ {formatCzk(tip)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-500">Celkem</div>
                          <div className="text-base font-bold text-white">{formatCzk(finalPrice)}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {finalPrice > 0 && (
              <div className="space-y-2 pt-1">
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

                {/* Custom split toggle */}
                <button
                  type="button"
                  onClick={() => { setSplitOverrideEnabled(e => !e); setCustomSplit(split); }}
                  className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${splitOverrideEnabled ? 'text-blue-400 hover:text-blue-300' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${splitOverrideEnabled ? 'border-blue-400 bg-blue-400/20' : 'border-slate-600'}`}>
                    {splitOverrideEnabled && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                  </span>
                  Upravit rozdělení pro tuto zakázku
                </button>

                {splitOverrideEnabled && (
                  <div className="bg-slate-800/60 border border-blue-500/20 rounded-xl p-3 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{partner1}</span>
                      <span>{partner2}</span>
                    </div>
                    <input
                      type="range"
                      min="0" max="100" step="5"
                      value={customSplit}
                      onChange={(e) => setCustomSplit(Number(e.target.value))}
                      className="w-full accent-blue-500 cursor-pointer"
                    />
                    <div className="flex gap-2 flex-wrap">
                      {[[100, 0], [75, 25], [50, 50], [25, 75], [0, 100]].map(([a, b]) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => setCustomSplit(a)}
                          className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                            customSplit === a
                              ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                              : 'bg-slate-700 border-slate-600 text-slate-400 hover:text-white'
                          }`}
                        >
                          {a}/{b}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ROW 2 left ── Datum + Kdo pracoval */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
            <div>
              <Label>Datum provedení zakázky</Label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputCls} />
            </div>
            <div className="border-t border-slate-800 pt-4">
              <Label>Kdo pracoval</Label>
              <div className="flex gap-2">
                {[partner1, partner2].map((p) => (
                  <button key={p} type="button" onClick={() => toggleWorker(p)} className={toggleBtnCls(form.workers.includes(p))}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ROW 2 right ── Časová náročnost + Poznámka */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4">
            <div>
              <Label optional>Časová náročnost (hodin)</Label>
              <input
                type="number" value={form.durationHours}
                onChange={(e) => setForm({ ...form, durationHours: e.target.value })}
                placeholder="0" min="0" step="0.5"
                className={inputCls}
              />
            </div>
            <div className="border-t border-slate-800 pt-4 flex flex-col flex-1">
              <Label optional>Poznámka</Label>
              <textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Jakékoliv poznámky…"
                className={inputCls + ' resize-none flex-1 min-h-[80px]'}
              />
            </div>
          </div>

        </div>

        {/* ── Footer ── */}
        <div className="mt-5">
          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-colors"
          >
            {submitting ? 'Ukládání…' : 'Uložit zakázku'}
          </button>
        </div>
      </form>
    </div>
  );
}
