import React, { useState, useMemo } from 'react';
import {
  Plus, Trash2, Pencil, Phone, Mail, Car, X, Check,
  ChevronLeft, Search, User, Calendar, TrendingUp,
  Clock, ChevronDown, ChevronUp, SlidersHorizontal,
} from 'lucide-react';
import { formatCzk, formatDate, formatOrderNumber } from '../utils/calculations';

// ─── Helpers ─────────────────────────────────────────────────────────────────

// "Jan Novák" → "NOVÁK Jan"
function formatName(name) {
  const parts = (name || '').trim().split(/\s+/);
  if (parts.length < 2) return name || '?';
  const last = parts.pop();
  return `${last.toUpperCase()} ${parts.join(' ')}`;
}

function initials(name) {
  const parts = (name || '?').trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  // last name initial + first name initial
  return (parts[parts.length - 1][0] + parts[0][0]).toUpperCase();
}

function getDisplayName(client) {
  if (!!client.isCompany && client.displayAs === 'company' && client.companyName?.trim()) {
    return client.companyName.trim();
  }
  return client.name;
}

function displayFormatted(client) {
  if (!!client.isCompany && client.displayAs === 'company' && client.companyName?.trim()) {
    return client.companyName.trim();
  }
  return formatName(client.name);
}

function clientStats(client, orders) {
  const clientOrders = orders.filter((o) => o.clientId === client.id);
  const totalRevenue = clientOrders.reduce((s, o) => s + Number(o.price), 0);
  const lastVisit = clientOrders.length
    ? clientOrders.reduce((max, o) => (o.date > max ? o.date : max), clientOrders[0].date)
    : null;
  const firstVisit = clientOrders.length
    ? clientOrders.reduce((min, o) => (o.date < min ? o.date : min), clientOrders[0].date)
    : null;
  return { count: clientOrders.length, totalRevenue, lastVisit, firstVisit };
}

const EMPTY_CLIENT_FORM  = { name: '', companyName: '', displayAs: 'name', phone: '', email: '', note: '', isCompany: false, ico: '', dic: '', billingAddress: '' };
const EMPTY_VEHICLE_FORM = { make: '', model: '', year: '', licensePlate: '', color: '', note: '' };

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({ label, value, placeholder, onChange, required, type = 'text', span = 1 }) {
  return (
    <div className={span === 2 ? 'sm:col-span-2' : ''}>
      <label className="block text-xs font-medium text-slate-400 mb-1">
        {label}{required && <span className="text-orange-400 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors"
      />
    </div>
  );
}

function StatPill({ icon: Icon, label, value, color = 'slate' }) {
  const colors = {
    slate:  'text-slate-400',
    orange: 'text-orange-400',
    green:  'text-emerald-400',
    blue:   'text-blue-400',
  };
  return (
    <div className="flex flex-col items-center gap-0.5 px-4 py-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
      <Icon className={`w-4 h-4 ${colors[color]} mb-0.5`} />
      <div className={`text-base font-bold ${colors[color]}`}>{value}</div>
      <div className="text-xs text-slate-600">{label}</div>
    </div>
  );
}

// ─── Client Detail View ───────────────────────────────────────────────────────

function ClientDetail({
  client,
  orders,
  onBack,
  onUpdateClient,
  onDeleteClient,
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle,
}) {
  const [editingClient, setEditingClient]   = useState(false);
  const [editClientForm, setEditClientForm] = useState(EMPTY_CLIENT_FORM);
  const [addVehicle,    setAddVehicle]      = useState(false);
  const [vehicleForm,   setVehicleForm]     = useState(EMPTY_VEHICLE_FORM);
  const [editingVehicleId, setEditingVehicleId] = useState(null);
  const [editVehicleForm, setEditVehicleForm]   = useState(EMPTY_VEHICLE_FORM);
  const [confirmDeleteV, setConfirmDeleteV] = useState(null);
  const [confirmDeleteC, setConfirmDeleteC] = useState(false);
  const [formError, setFormError]           = useState('');
  const [expandedVehicle, setExpandedVehicle] = useState(null);

  const clientOrders = useMemo(
    () => orders.filter((o) => o.clientId === client.id).sort((a, b) => b.date.localeCompare(a.date)),
    [orders, client.id]
  );

  const stats = useMemo(() => clientStats(client, orders), [client, orders]);

  const ordersForVehicle = (vehicleId) =>
    clientOrders.filter((o) => o.vehicleId === vehicleId);

  const ungroupedOrders = clientOrders.filter(
    (o) => !o.vehicleId || !client.vehicles.find((v) => v.id === o.vehicleId)
  );

  const startEditClient = () => {
    setEditClientForm({ name: client.name, companyName: client.companyName || '', displayAs: client.displayAs || 'name', phone: client.phone || '', email: client.email || '', note: client.note || '', isCompany: client.isCompany || false, ico: client.ico || '', dic: client.dic || '', billingAddress: client.billingAddress || '' });
    setEditingClient(true);
    setFormError('');
  };

  const handleUpdateClient = () => {
    if (!editClientForm.name.trim()) return setFormError('Jméno je povinné.');
    setFormError('');
    onUpdateClient(client.id, { ...editClientForm, name: editClientForm.name.trim() });
    setEditingClient(false);
  };

  const handleAddVehicle = () => {
    if (!vehicleForm.make.trim())
      return setFormError('Značka je povinná.');
    setFormError('');
    onAddVehicle(client.id, { ...vehicleForm });
    setVehicleForm(EMPTY_VEHICLE_FORM);
    setAddVehicle(false);
  };

  const startEditVehicle = (v) => {
    setEditingVehicleId(v.id);
    setEditVehicleForm({ make: v.make, model: v.model, year: v.year || '', licensePlate: v.licensePlate || '', color: v.color || '', note: v.note || '' });
    setFormError('');
  };

  const handleUpdateVehicle = (vehicleId) => {
    if (!editVehicleForm.make.trim())
      return setFormError('Značka je povinná.');
    setFormError('');
    onUpdateVehicle(client.id, vehicleId, { ...editVehicleForm });
    setEditingVehicleId(null);
  };

  const handleDeleteVehicle = (vehicleId) => {
    if (confirmDeleteV === vehicleId) {
      onDeleteVehicle(client.id, vehicleId);
      setConfirmDeleteV(null);
    } else {
      setConfirmDeleteV(vehicleId);
    }
  };

  const handleDeleteClient = () => {
    if (confirmDeleteC) {
      onDeleteClient(client.id);
    } else {
      setConfirmDeleteC(true);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      {/* ── Back + Header ── */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-white mb-4 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />Zpět na klienty
        </button>

        {!editingClient ? (
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-orange-400 font-bold text-lg">{initials(getDisplayName(client))}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-white">{displayFormatted(client)}</h1>
                {client.isCompany && (
                  <span className="text-xs px-1.5 py-0.5 rounded border bg-blue-500/10 text-blue-400 border-blue-500/20">Firma</span>
                )}
              </div>
              <div className="flex flex-wrap gap-3 mt-1.5 text-sm text-slate-500">
                {client.phone && (
                  <a href={`tel:${client.phone}`} className="flex items-center gap-1.5 hover:text-orange-400 transition-colors">
                    <Phone className="w-3.5 h-3.5" />{client.phone}
                  </a>
                )}
                {client.email && (
                  <a href={`mailto:${client.email}`} className="flex items-center gap-1.5 hover:text-orange-400 transition-colors">
                    <Mail className="w-3.5 h-3.5" />{client.email}
                  </a>
                )}
                {client.note && <span className="italic">{client.note}</span>}
              </div>
              {client.isCompany && (client.ico || client.dic || client.billingAddress) && (
                <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500">
                  {client.ico && <span>IČO: {client.ico}</span>}
                  {client.dic && <span>DIČ: {client.dic}</span>}
                  {client.billingAddress && <span>{client.billingAddress}</span>}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={startEditClient} className="p-2 text-slate-500 hover:text-orange-400 hover:bg-slate-800 rounded-lg transition-colors" title="Upravit klienta">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={handleDeleteClient} className={`p-2 rounded-lg transition-colors ${confirmDeleteC ? 'bg-red-500/20 text-red-400' : 'text-slate-500 hover:text-red-400 hover:bg-slate-800'}`} title={confirmDeleteC ? 'Klikni znovu pro potvrzení' : 'Smazat klienta'}>
                <Trash2 className="w-4 h-4" />
              </button>
              {confirmDeleteC && (
                <button onClick={() => setConfirmDeleteC(false)} className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 border border-orange-500/30 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">Upravit klienta</h2>
              <button onClick={() => setEditingClient(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <Field label="Jméno" value={editClientForm.name} onChange={(v) => setEditClientForm({ ...editClientForm, name: v })} placeholder="Jan Novák" required />
              <Field label="Telefon" value={editClientForm.phone} onChange={(v) => setEditClientForm({ ...editClientForm, phone: v })} placeholder="+420 777 123 456" />
              <Field label="E-mail" type="email" value={editClientForm.email} onChange={(v) => setEditClientForm({ ...editClientForm, email: v })} placeholder="jan@example.com" />
              <Field label="Poznámka" value={editClientForm.note} onChange={(v) => setEditClientForm({ ...editClientForm, note: v })} placeholder="VIP klient, alergie na…" />
            </div>
            {/* Company toggle */}
            <div className="flex items-center gap-3 py-2">
              <button
                type="button"
                onClick={() => setEditClientForm({ ...editClientForm, isCompany: !editClientForm.isCompany })}
                className={`relative w-11 h-6 rounded-full transition-colors ${editClientForm.isCompany ? 'bg-orange-500' : 'bg-slate-700'}`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${editClientForm.isCompany ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
              <span className="text-xs text-slate-400">Firemní klient</span>
            </div>
            {editClientForm.isCompany && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-800 pt-3 mb-3">
                <Field label="Název firmy" value={editClientForm.companyName} onChange={(v) => setEditClientForm({ ...editClientForm, companyName: v })} placeholder="ABC s.r.o." span={2} />
                {editClientForm.companyName?.trim() && (
                  <div className="sm:col-span-2">
                    <div className="text-xs font-medium text-slate-400 mb-2">Zobrazovat primárně jako</div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setEditClientForm({ ...editClientForm, displayAs: 'name' })}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${editClientForm.displayAs === 'name' ? 'bg-orange-500/15 border-orange-500/40 text-orange-300' : 'bg-slate-700 border-slate-600 text-slate-400 hover:text-white'}`}>
                        Jméno a příjmení
                      </button>
                      <button type="button" onClick={() => setEditClientForm({ ...editClientForm, displayAs: 'company' })}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${editClientForm.displayAs === 'company' ? 'bg-orange-500/15 border-orange-500/40 text-orange-300' : 'bg-slate-700 border-slate-600 text-slate-400 hover:text-white'}`}>
                        Název firmy
                      </button>
                    </div>
                  </div>
                )}
                <Field label="IČO" value={editClientForm.ico} onChange={(v) => setEditClientForm({ ...editClientForm, ico: v })} placeholder="12345678" />
                <Field label="DIČ" value={editClientForm.dic} onChange={(v) => setEditClientForm({ ...editClientForm, dic: v })} placeholder="CZ12345678" />
                <Field label="Fakturační adresa" value={editClientForm.billingAddress} onChange={(v) => setEditClientForm({ ...editClientForm, billingAddress: v })} placeholder="Ulice 1, Praha 1" span={2} />
              </div>
            )}
            {formError && <p className="text-red-400 text-xs mb-3">{formError}</p>}
            <div className="flex gap-2">
              <button onClick={handleUpdateClient} className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold rounded-lg transition-colors">
                <Check className="w-3.5 h-3.5" />Uložit
              </button>
              <button onClick={() => { setEditingClient(false); setFormError(''); }} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors border border-slate-700">
                Zrušit
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatPill icon={Calendar}   label="Návštěv"       value={stats.count}                                                       color="blue" />
        <StatPill icon={TrendingUp} label="Celkem utraceno" value={stats.totalRevenue > 0 ? formatCzk(stats.totalRevenue) : '—'}   color="orange" />
        <StatPill icon={TrendingUp} label="Průměr zakázky"  value={stats.count > 0 ? formatCzk(Math.round(stats.totalRevenue / stats.count)) : '—'} color="green" />
        <StatPill icon={Clock}      label="Naposledy"      value={stats.lastVisit ? formatDate(stats.lastVisit) : '—'}               color="slate" />
      </div>

      {/* ── Vozidla ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-300">Vozidla ({client.vehicles.length})</h2>
          {!addVehicle && (
            <button
              onClick={() => { setAddVehicle(true); setFormError(''); }}
              className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />Přidat vozidlo
            </button>
          )}
        </div>

        {/* Add vehicle form */}
        {addVehicle && (
          <div className="bg-slate-900 border border-orange-500/30 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-white">Nové vozidlo</span>
              <button onClick={() => { setAddVehicle(false); setVehicleForm(EMPTY_VEHICLE_FORM); setFormError(''); }} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
              <Field label="Značka"   value={vehicleForm.make}         onChange={(v) => setVehicleForm({ ...vehicleForm, make: v })}         placeholder="Škoda"    required />
              <Field label="Model"    value={vehicleForm.model}        onChange={(v) => setVehicleForm({ ...vehicleForm, model: v })}        placeholder="Octavia" />
              <Field label="Rok"      value={vehicleForm.year}         onChange={(v) => setVehicleForm({ ...vehicleForm, year: v })}         placeholder="2022" />
              <Field label="SPZ"      value={vehicleForm.licensePlate} onChange={(v) => setVehicleForm({ ...vehicleForm, licensePlate: v })} placeholder="1AB 2345" />
              <Field label="Barva"    value={vehicleForm.color}        onChange={(v) => setVehicleForm({ ...vehicleForm, color: v })}        placeholder="černá" />
              <Field label="Poznámka" value={vehicleForm.note}         onChange={(v) => setVehicleForm({ ...vehicleForm, note: v })}         placeholder="volitelná" />
            </div>
            {formError && <p className="text-red-400 text-xs mb-2">{formError}</p>}
            <div className="flex gap-2">
              <button onClick={handleAddVehicle} className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-400 text-white text-xs font-semibold rounded-lg transition-colors">
                <Plus className="w-3 h-3" />Uložit vozidlo
              </button>
              <button onClick={() => { setAddVehicle(false); setVehicleForm(EMPTY_VEHICLE_FORM); setFormError(''); }} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 transition-colors">
                Zrušit
              </button>
            </div>
          </div>
        )}

        {/* Vehicle cards with history */}
        {client.vehicles.length === 0 && !addVehicle ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center text-slate-600 text-sm">
            <Car className="w-8 h-8 mx-auto mb-2 opacity-30" />
            Klient nemá přidána žádná vozidla.
          </div>
        ) : (
          <div className="space-y-3">
            {client.vehicles.map((v) => {
              const vOrders  = ordersForVehicle(v.id);
              const vRevenue = vOrders.reduce((s, o) => s + Number(o.price), 0);
              const isExpanded = expandedVehicle === v.id;
              const isEditingV = editingVehicleId === v.id;

              return (
                <div key={v.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  {isEditingV ? (
                    <div className="p-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                        <Field label="Značka"   value={editVehicleForm.make}         onChange={(v2) => setEditVehicleForm({ ...editVehicleForm, make: v2 })}         placeholder="Škoda"    required />
                        <Field label="Model"    value={editVehicleForm.model}        onChange={(v2) => setEditVehicleForm({ ...editVehicleForm, model: v2 })}        placeholder="Octavia" />
                        <Field label="Rok"      value={editVehicleForm.year}         onChange={(v2) => setEditVehicleForm({ ...editVehicleForm, year: v2 })}         placeholder="2022" />
                        <Field label="SPZ"      value={editVehicleForm.licensePlate} onChange={(v2) => setEditVehicleForm({ ...editVehicleForm, licensePlate: v2 })} placeholder="1AB 2345" />
                        <Field label="Barva"    value={editVehicleForm.color}        onChange={(v2) => setEditVehicleForm({ ...editVehicleForm, color: v2 })}        placeholder="černá" />
                        <Field label="Poznámka" value={editVehicleForm.note}         onChange={(v2) => setEditVehicleForm({ ...editVehicleForm, note: v2 })}         placeholder="volitelná" />
                      </div>
                      {formError && <p className="text-red-400 text-xs mb-2">{formError}</p>}
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdateVehicle(v.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-400 text-white text-xs font-semibold rounded-lg transition-colors">
                          <Check className="w-3 h-3" />Uložit
                        </button>
                        <button onClick={() => { setEditingVehicleId(null); setFormError(''); }} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 transition-colors">
                          Zrušit
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Vehicle header */}
                      <div className="flex items-center gap-3 px-4 py-3">
                        <button
                          onClick={() => setExpandedVehicle(isExpanded ? null : v.id)}
                          className="flex-1 flex items-center gap-3 text-left min-w-0"
                        >
                          <div className="w-8 h-8 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Car className="w-4 h-4 text-slate-400" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center flex-wrap gap-2">
                              <span className="text-sm font-semibold text-white">
                                {v.make} {v.model}
                                {v.year && <span className="text-slate-500 font-normal ml-1">({v.year})</span>}
                              </span>
                              {v.licensePlate && (
                                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono border border-slate-700">{v.licensePlate}</span>
                              )}
                              {v.color && <span className="text-xs text-slate-600">{v.color}</span>}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {vOrders.length} {vOrders.length === 1 ? 'zakázka' : vOrders.length < 5 ? 'zakázky' : 'zakázek'}
                              {vRevenue > 0 && ` · ${formatCzk(vRevenue)}`}
                            </div>
                          </div>
                        </button>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-600" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-600" />
                          )}
                          <button
                            onClick={() => { setEditingVehicleId(v.id); setExpandedVehicle(null); setFormError(''); startEditVehicle(v); }}
                            className="p-1.5 text-slate-600 hover:text-orange-400 hover:bg-slate-800 rounded transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteVehicle(v.id)}
                            className={`p-1.5 rounded transition-colors ${
                              confirmDeleteV === v.id
                                ? 'bg-red-500/20 text-red-400'
                                : 'text-slate-600 hover:text-red-400 hover:bg-slate-800'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Vehicle order history */}
                      {isExpanded && (
                        <div className="border-t border-slate-800">
                          {vOrders.length === 0 ? (
                            <p className="px-4 py-3 text-xs text-slate-600 italic">Žádné zakázky pro toto vozidlo.</p>
                          ) : (
                            <div className="divide-y divide-slate-800/60">
                              {vOrders.map((o) => (
                                <div key={o.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/30 transition-colors">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      {o.orderNumber && (
                                        <span className="text-xs font-mono text-slate-600 flex-shrink-0">{formatOrderNumber(o.orderNumber)}</span>
                                      )}
                                      <span className="text-sm text-white">{o.description}</span>
                                    </div>
                                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                                      <span>{formatDate(o.date)}</span>
                                      {o.workers?.length > 0 && <span>{o.workers.join(', ')}</span>}
                                      {o.durationHours > 0 && <span>{o.durationHours} h</span>}
                                    </div>
                                    {o.note && <div className="text-xs text-slate-600 mt-0.5 italic">{o.note}</div>}
                                  </div>
                                  <div className="text-sm font-semibold text-orange-400 flex-shrink-0">
                                    {formatCzk(Number(o.price))}
                                  </div>
                                </div>
                              ))}
                              <div className="flex justify-between items-center px-4 py-2 bg-slate-800/20">
                                <span className="text-xs text-slate-500">{vOrders.length} zakázek celkem</span>
                                <span className="text-xs font-semibold text-orange-400">{formatCzk(vRevenue)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Nezařazené zakázky ── */}
      {ungroupedOrders.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-300 mb-3">
            Nezařazené zakázky ({ungroupedOrders.length})
          </h2>
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800">
            {ungroupedOrders.map((o) => (
              <div key={o.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {o.orderNumber && (
                      <span className="text-xs font-mono text-slate-600 flex-shrink-0">{formatOrderNumber(o.orderNumber)}</span>
                    )}
                    <span className="text-sm text-white">{o.description}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {formatDate(o.date)}
                    {o.workers?.length > 0 && ` · ${o.workers.join(', ')}`}
                  </div>
                </div>
                <div className="text-sm font-semibold text-orange-400 flex-shrink-0">
                  {formatCzk(Number(o.price))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Client List View ─────────────────────────────────────────────────────────

export default function Clients({
  clients,
  orders,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle,
}) {
  const [detailClientId,    setDetailClientId]    = useState(null);
  const [showAddForm,       setShowAddForm]        = useState(false);
  const [clientForm,        setClientForm]         = useState(EMPTY_CLIENT_FORM);
  const [formError,         setFormError]          = useState('');
  const [newClientVehicles, setNewClientVehicles]  = useState([]);
  const [showVehicleSub,    setShowVehicleSub]     = useState(false);
  const [vehicleSubForm,    setVehicleSubForm]     = useState(EMPTY_VEHICLE_FORM);
  const [vehicleSubError,   setVehicleSubError]    = useState('');
  const [search,         setSearch]          = useState('');
  const [filterMake,     setFilterMake]      = useState('');

  // Unique car makes for filter
  const allMakes = useMemo(() => {
    const makes = new Set();
    clients.forEach((c) => c.vehicles.forEach((v) => { if (v.make) makes.add(v.make); }));
    return [...makes].sort();
  }, [clients]);

  // Filtered + sorted clients (by last name)
  const filteredClients = useMemo(() => {
    const q = search.toLowerCase().trim();
    return clients
      .filter((c) => {
        const matchesSearch = !q || (
          c.name.toLowerCase().includes(q) ||
          (c.companyName || '').toLowerCase().includes(q) ||
          (c.phone || '').includes(q) ||
          (c.email || '').toLowerCase().includes(q) ||
          c.vehicles.some((v) =>
            `${v.make} ${v.model}`.toLowerCase().includes(q) ||
            (v.licensePlate || '').toLowerCase().includes(q)
          )
        );
        const matchesMake = !filterMake ||
          c.vehicles.some((v) => v.make === filterMake);
        return matchesSearch && matchesMake;
      })
      .sort((a, b) => {
        const lastA = a.name.trim().split(' ').pop() || '';
        const lastB = b.name.trim().split(' ').pop() || '';
        return lastA.localeCompare(lastB, 'cs');
      });
  }, [clients, search, filterMake]);

  const handleAddVehicleToNew = () => {
    if (!vehicleSubForm.make.trim())
      return setVehicleSubError('Značka je povinná.');
    setVehicleSubError('');
    setNewClientVehicles((prev) => [...prev, { ...vehicleSubForm }]);
    setVehicleSubForm(EMPTY_VEHICLE_FORM);
    setShowVehicleSub(false);
  };

  const handleAddClient = async () => {
    if (!clientForm.name.trim()) return setFormError('Jméno je povinné.');
    setFormError('');
    try {
      const created = await onAddClient({ ...clientForm, name: clientForm.name.trim() });
      for (const v of newClientVehicles) {
        await onAddVehicle(created.id, v);
      }
      setClientForm(EMPTY_CLIENT_FORM);
      setNewClientVehicles([]);
      setShowVehicleSub(false);
      setVehicleSubForm(EMPTY_VEHICLE_FORM);
      setShowAddForm(false);
    } catch {
      setFormError('Chyba při ukládání klienta.');
    }
  };

  // Show detail view
  const detailClient = detailClientId ? clients.find((c) => c.id === detailClientId) : null;
  if (detailClient) {
    return (
      <ClientDetail
        client={detailClient}
        orders={orders}
        onBack={() => setDetailClientId(null)}
        onUpdateClient={onUpdateClient}
        onDeleteClient={(id) => { onDeleteClient(id); setDetailClientId(null); }}
        onAddVehicle={onAddVehicle}
        onUpdateVehicle={onUpdateVehicle}
        onDeleteVehicle={onDeleteVehicle}
      />
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Klienti</h1>
          <p className="text-sm text-slate-500 mt-0.5">{clients.length} klientů v databázi</p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => { setShowAddForm(true); setFormError(''); }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />Přidat klienta
          </button>
        )}
      </div>

      {/* ── Add client form ── */}
      {showAddForm && (
        <div className="bg-slate-900 border border-orange-500/30 rounded-xl p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Nový klient</h2>
            <button onClick={() => { setShowAddForm(false); setClientForm(EMPTY_CLIENT_FORM); setNewClientVehicles([]); setShowVehicleSub(false); setFormError(''); }} className="text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Basic info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <Field label="Jméno a příjmení" value={clientForm.name} onChange={(v) => setClientForm({ ...clientForm, name: v })} placeholder="Jan Novák" required />
            <Field label="Telefon" value={clientForm.phone} onChange={(v) => setClientForm({ ...clientForm, phone: v })} placeholder="+420 777 123 456" />
            <Field label="E-mail" type="email" value={clientForm.email} onChange={(v) => setClientForm({ ...clientForm, email: v })} placeholder="jan@example.com" />
            <Field label="Poznámka" value={clientForm.note} onChange={(v) => setClientForm({ ...clientForm, note: v })} placeholder="VIP klient, alergie na…" />
          </div>

          {/* Company toggle */}
          <div className="flex items-center gap-3 py-2">
            <button
              type="button"
              onClick={() => setClientForm({ ...clientForm, isCompany: !clientForm.isCompany })}
              className={`relative w-11 h-6 rounded-full transition-colors ${clientForm.isCompany ? 'bg-orange-500' : 'bg-slate-700'}`}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${clientForm.isCompany ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
            <span className="text-xs text-slate-400">Firemní klient</span>
          </div>
          {clientForm.isCompany && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-800 pt-3 mb-4">
              <Field label="Název firmy" value={clientForm.companyName} onChange={(v) => setClientForm({ ...clientForm, companyName: v })} placeholder="ABC s.r.o." span={2} />
              {clientForm.companyName?.trim() && (
                <div className="sm:col-span-2">
                  <div className="text-xs font-medium text-slate-400 mb-2">Zobrazovat primárně jako</div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setClientForm({ ...clientForm, displayAs: 'name' })}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${clientForm.displayAs === 'name' ? 'bg-orange-500/15 border-orange-500/40 text-orange-300' : 'bg-slate-700 border-slate-600 text-slate-400 hover:text-white'}`}>
                      Jméno a příjmení
                    </button>
                    <button type="button" onClick={() => setClientForm({ ...clientForm, displayAs: 'company' })}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${clientForm.displayAs === 'company' ? 'bg-orange-500/15 border-orange-500/40 text-orange-300' : 'bg-slate-700 border-slate-600 text-slate-400 hover:text-white'}`}>
                      Název firmy
                    </button>
                  </div>
                </div>
              )}
              <Field label="IČO" value={clientForm.ico} onChange={(v) => setClientForm({ ...clientForm, ico: v })} placeholder="12345678" />
              <Field label="DIČ" value={clientForm.dic} onChange={(v) => setClientForm({ ...clientForm, dic: v })} placeholder="CZ12345678" />
              <Field label="Fakturační adresa" value={clientForm.billingAddress} onChange={(v) => setClientForm({ ...clientForm, billingAddress: v })} placeholder="Ulice 1, Praha 1" span={2} />
            </div>
          )}

          {/* Vehicles */}
          <div className="border-t border-slate-800 pt-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Vozidla <span className="text-slate-600 font-normal normal-case">(volitelné)</span>
              </span>
              {!showVehicleSub && (
                <button
                  type="button"
                  onClick={() => { setShowVehicleSub(true); setVehicleSubError(''); }}
                  className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />Přidat vozidlo
                </button>
              )}
            </div>

            {/* Already-added vehicles */}
            {newClientVehicles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {newClientVehicles.map((v, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5">
                    <Car className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    <span className="text-xs text-slate-300">
                      {v.make} {v.model}{v.year ? ` (${v.year})` : ''}{v.licensePlate ? ` · ${v.licensePlate}` : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => setNewClientVehicles((prev) => prev.filter((_, j) => j !== i))}
                      className="text-slate-600 hover:text-red-400 transition-colors ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Vehicle sub-form */}
            {showVehicleSub && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <Field label="Značka"   value={vehicleSubForm.make}         onChange={(v) => setVehicleSubForm({ ...vehicleSubForm, make: v })}         placeholder="Škoda"    required />
                  <Field label="Model"    value={vehicleSubForm.model}        onChange={(v) => setVehicleSubForm({ ...vehicleSubForm, model: v })}        placeholder="Octavia" />
                  <Field label="Rok"      value={vehicleSubForm.year}         onChange={(v) => setVehicleSubForm({ ...vehicleSubForm, year: v })}         placeholder="2022" />
                  <Field label="SPZ"      value={vehicleSubForm.licensePlate} onChange={(v) => setVehicleSubForm({ ...vehicleSubForm, licensePlate: v })} placeholder="1AB 2345" />
                  <Field label="Barva"    value={vehicleSubForm.color}        onChange={(v) => setVehicleSubForm({ ...vehicleSubForm, color: v })}        placeholder="černá" />
                  <Field label="Poznámka" value={vehicleSubForm.note}         onChange={(v) => setVehicleSubForm({ ...vehicleSubForm, note: v })}         placeholder="volitelná" />
                </div>
                {vehicleSubError && <p className="text-red-400 text-xs">{vehicleSubError}</p>}
                <div className="flex gap-2">
                  <button type="button" onClick={handleAddVehicleToNew} className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-400 text-white text-xs font-semibold rounded-lg transition-colors">
                    <Check className="w-3 h-3" />Přidat
                  </button>
                  <button type="button" onClick={() => { setShowVehicleSub(false); setVehicleSubForm(EMPTY_VEHICLE_FORM); setVehicleSubError(''); }} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg border border-slate-600 transition-colors">
                    Zrušit
                  </button>
                </div>
              </div>
            )}
          </div>

          {formError && <p className="text-red-400 text-xs mb-3">{formError}</p>}
          <div className="flex gap-2">
            <button onClick={handleAddClient} className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold rounded-lg transition-colors">
              Uložit klienta
            </button>
            <button onClick={() => { setShowAddForm(false); setClientForm(EMPTY_CLIENT_FORM); setNewClientVehicles([]); setShowVehicleSub(false); setFormError(''); }} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors border border-slate-700">
              Zrušit
            </button>
          </div>
        </div>
      )}

      {/* ── Search & Filter ── */}
      {clients.length > 0 && (
        <div className="flex gap-3 mb-5">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Hledat klienta, vozidlo, SPZ…"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
          {allMakes.length > 0 && (
            <div className="relative">
              <SlidersHorizontal className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={filterMake}
                onChange={(e) => setFilterMake(e.target.value)}
                className="appearance-none bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-8 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors cursor-pointer"
              >
                <option value="">Všechny značky</option>
                {allMakes.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}
        </div>
      )}

      {/* ── Empty state ── */}
      {clients.length === 0 && !showAddForm && (
        <div className="text-center py-20 text-slate-600">
          <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-lg mb-1">Zatím žádní klienti</p>
          <p className="text-sm">Přidejte prvního klienta tlačítkem výše.</p>
        </div>
      )}

      {/* ── No results ── */}
      {clients.length > 0 && filteredClients.length === 0 && (
        <div className="text-center py-12 text-slate-600">
          <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Žádný klient neodpovídá hledání.</p>
        </div>
      )}

      {/* ── Client cards ── */}
      <div className="space-y-2">
        {filteredClients.map((client) => {
          const stats = clientStats(client, orders);

          return (
            <button
              key={client.id}
              onClick={() => setDetailClientId(client.id)}
              className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl px-5 py-4 flex items-center gap-4 text-left transition-all hover:bg-slate-800/50 group"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 group-hover:border-orange-500/30 transition-colors">
                <span className="text-sm font-bold text-slate-400 group-hover:text-orange-400 transition-colors">
                  {initials(getDisplayName(client))}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-white">{displayFormatted(client)}</span>
                  {client.isCompany && (
                    <span className="text-xs px-1.5 py-0.5 rounded border bg-blue-500/10 text-blue-400 border-blue-500/20">Firma</span>
                  )}
                  {client.vehicles.map((v) => (
                    <span key={v.id} className="text-xs bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full">
                      {v.make} {v.model}{v.year ? ` '${String(v.year).slice(-2)}` : ''}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500 flex-wrap">
                  {client.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{client.phone}</span>}
                  {client.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{client.email}</span>}
                  {stats.lastVisit && <span>Naposledy {formatDate(stats.lastVisit)}</span>}
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 flex-shrink-0 text-right">
                {stats.count > 0 && (
                  <>
                    <div className="hidden sm:block">
                      <div className="text-xs text-slate-600">Zakázek</div>
                      <div className="text-sm font-semibold text-slate-300">{stats.count}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-600">Celkem</div>
                      <div className="text-sm font-semibold text-orange-400">{formatCzk(stats.totalRevenue)}</div>
                    </div>
                  </>
                )}
                {stats.count === 0 && (
                  <span className="text-xs text-slate-600 italic">bez zakázek</span>
                )}
                <ChevronLeft className="w-4 h-4 text-slate-600 rotate-180" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
