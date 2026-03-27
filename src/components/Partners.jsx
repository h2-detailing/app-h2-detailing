import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { formatCzk } from '../utils/calculations';

export default function Partners({ orders, expenses, settings }) {
  const { partner1, partner2, split, pausal } = settings;
  const [period, setPeriod] = useState('month');
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  );
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const splitNum = Number(split) || 50;
  const pausalNum = Number(pausal) || 0;
  const split2 = 100 - splitNum;

  const filtered = useMemo(() => {
    const filterOrder = (o) => period === 'month'
      ? o.date.startsWith(selectedMonth)
      : o.date.startsWith(String(selectedYear));
    const filterExp = (e) => period === 'month'
      ? e.date.startsWith(selectedMonth)
      : e.date.startsWith(String(selectedYear));
    return {
      orders: orders.filter(filterOrder),
      expenses: expenses.filter(filterExp),
    };
  }, [orders, expenses, period, selectedMonth, selectedYear]);

  const totalRevenue = filtered.orders.reduce((s, o) => s + Number(o.price), 0);

  // Personal expenses = expenses paid by that specific partner
  const p1PersonalExp = filtered.expenses
    .filter(e => e.payer === partner1)
    .reduce((s, e) => s + Number(e.amount), 0);
  const p2PersonalExp = filtered.expenses
    .filter(e => e.payer === partner2)
    .reduce((s, e) => s + Number(e.amount), 0);

  // Revenue share
  const p1Revenue = Math.round(totalRevenue * (splitNum / 100));
  const p2Revenue = totalRevenue - p1Revenue;

  // Pausal goes to partner2 (workshop owner) — monthly if period=month, × months if year
  const monthsInPeriod = period === 'month' ? 1 : (() => {
    const months = new Set(filtered.orders.map(o => o.date.slice(0, 7)));
    return months.size || 1;
  })();
  const p2PausalBonus = pausalNum * monthsInPeriod;

  // Net = revenue share - personal expenses (+ pausal bonus for p2)
  const p1Net = p1Revenue - p1PersonalExp;
  const p2Net = p2Revenue + p2PausalBonus - p2PersonalExp;

  const todayMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const todayYear = now.getFullYear();

  const shiftMonth = (dir) => {
    const d = new Date(selectedMonth + '-01');
    d.setMonth(d.getMonth() + dir);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const periodLabel = period === 'month'
    ? new Date(selectedMonth + '-01').toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' })
    : String(selectedYear);

  const isCurrentPeriod = period === 'month'
    ? selectedMonth === todayMonthStr
    : selectedYear === todayYear;

  const Card = ({ name, color, revenue, personalExp, pausalBonus, net }) => (
    <div className={`bg-slate-900 border rounded-xl p-5 space-y-4 ${color === 'orange' ? 'border-orange-500/20' : 'border-purple-500/20'}`}>
      <div className={`text-base font-bold ${color === 'orange' ? 'text-orange-400' : 'text-purple-400'}`}>{name}</div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            Podíl na tržbách
          </div>
          <span className="text-sm font-semibold text-white">{formatCzk(revenue)}</span>
        </div>

        {pausalBonus > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
              Paušál za dílnu
            </div>
            <span className="text-sm font-semibold text-blue-400">+ {formatCzk(pausalBonus)}</span>
          </div>
        )}

        {personalExp > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <TrendingDown className="w-3.5 h-3.5 text-red-400" />
              Osobní výdaje
            </div>
            <span className="text-sm font-semibold text-red-400">− {formatCzk(personalExp)}</span>
          </div>
        )}

        <div className={`flex items-center justify-between pt-2 border-t ${color === 'orange' ? 'border-orange-500/20' : 'border-purple-500/20'}`}>
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Wallet className="w-3.5 h-3.5" />
            Čistý příjem
          </div>
          <span className={`text-lg font-bold ${net >= 0 ? (color === 'orange' ? 'text-orange-400' : 'text-purple-400') : 'text-red-400'}`}>
            {formatCzk(net)}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Partneři</h1>
          <p className="text-sm text-slate-500 mt-0.5 capitalize">{periodLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period nav */}
          <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg px-1 py-1">
            <button
              onClick={() => period === 'month' ? shiftMonth(-1) : setSelectedYear(y => y - 1)}
              className="p-1.5 text-slate-400 hover:text-white transition-colors rounded"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            {!isCurrentPeriod && (
              <button
                onClick={() => period === 'month' ? setSelectedMonth(todayMonthStr) : setSelectedYear(todayYear)}
                className="px-2 py-0.5 text-xs text-orange-400 hover:text-orange-300 font-medium transition-colors"
              >
                Dnes
              </button>
            )}
            <button
              onClick={() => period === 'month' ? shiftMonth(1) : setSelectedYear(y => y + 1)}
              disabled={isCurrentPeriod}
              className="p-1.5 text-slate-400 hover:text-white transition-colors rounded disabled:opacity-30"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          {/* Period toggle */}
          <div className="flex bg-slate-800 border border-slate-700 rounded-lg p-1 gap-1">
            {['month', 'year'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${period === p ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                {p === 'month' ? 'Měsíc' : 'Rok'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Tržby celkem', value: formatCzk(totalRevenue), sub: `${filtered.orders.length} zakázek` },
          { label: `Výdaje ${partner1}`, value: formatCzk(p1PersonalExp), sub: 'osobní výdaje' },
          { label: `Výdaje ${partner2}`, value: formatCzk(p2PersonalExp), sub: 'osobní výdaje' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
            <div className="text-xs text-slate-500 mb-1">{label}</div>
            <div className="text-base font-bold text-white">{value}</div>
            <div className="text-xs text-slate-600 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* Partner cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card
          name={partner1}
          color="orange"
          revenue={p1Revenue}
          personalExp={p1PersonalExp}
          pausalBonus={0}
          net={p1Net}
        />
        <Card
          name={partner2}
          color="purple"
          revenue={p2Revenue}
          personalExp={p2PersonalExp}
          pausalBonus={p2PausalBonus}
          net={p2Net}
        />
      </div>

      {pausalNum > 0 && (
        <p className="text-xs text-slate-600 text-center">
          Paušál za dílnu {formatCzk(pausalNum)} Kč/měs. je zahrnut v příjmu partnera {partner2}.
        </p>
      )}
    </div>
  );
}
