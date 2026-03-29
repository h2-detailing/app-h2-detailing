import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Wallet, Users2, Receipt, Scale, ArrowRightLeft, Star } from 'lucide-react';
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

  const p1PersonalExp = filtered.expenses
    .filter(e => e.payer === partner1)
    .reduce((s, e) => s + Number(e.amount), 0);
  const p2PersonalExp = filtered.expenses
    .filter(e => e.payer === partner2)
    .reduce((s, e) => s + Number(e.amount), 0);

  // Revenue share (simple, for top cards)
  const p1Revenue = Math.round(totalRevenue * (splitNum / 100));
  const p2Revenue = totalRevenue - p1Revenue;

  const monthsInPeriod = period === 'month' ? 1 : (() => {
    const months = new Set([
      ...filtered.orders.map(o => o.date.slice(0, 7)),
      ...filtered.expenses.map(e => e.date.slice(0, 7)),
    ]);
    return months.size || 1;
  })();
  const p2PausalBonus = pausalNum * monthsInPeriod;

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

  // ── Detailed settlement computation ─────────────────────────────────────────

  const settlement = useMemo(() => {
    // Revenue split accounting for per-order splitOverride
    const p1RevActual = filtered.orders.reduce((s, o) => {
      const sp = o.splitOverride != null ? Number(o.splitOverride) : splitNum;
      return s + Number(o.price) * sp / 100;
    }, 0);
    const p2RevActual = totalRevenue - p1RevActual;

    const rawExpTotal = filtered.expenses.reduce((s, e) => s + Number(e.amount), 0);
    const expTotal = rawExpTotal + pausalNum * monthsInPeriod;

    const p1ExpShare = expTotal * (splitNum / 100);
    const p2ExpShare = expTotal * (split2 / 100);

    const p1Profit = p1RevActual - p1ExpShare;
    const p2Profit = p2RevActual - p2ExpShare;

    // Who actually paid what
    const p1Paid = filtered.expenses
      .filter(e => e.payer === partner1)
      .reduce((s, e) => s + Number(e.amount), 0);
    const p2Paid = filtered.expenses
      .filter(e => e.payer === partner2)
      .reduce((s, e) => s + Number(e.amount), 0) + pausalNum * monthsInPeriod;

    const fairShare = (p1Paid + p2Paid) / 2;
    const balance = p1Paid - fairShare; // >0 = p2 owes p1; <0 = p1 owes p2

    // Expense breakdown by payer + category
    const p1ExpByCat = {};
    const p2ExpByCat = {};
    filtered.expenses.forEach(e => {
      const cat = e.category || 'Ostatní';
      if (e.payer === partner1) p1ExpByCat[cat] = (p1ExpByCat[cat] || 0) + Number(e.amount);
      else p2ExpByCat[cat] = (p2ExpByCat[cat] || 0) + Number(e.amount);
    });
    if (pausalNum * monthsInPeriod > 0) {
      p2ExpByCat['Paušál za dílnu'] = (p2ExpByCat['Paušál za dílnu'] || 0) + pausalNum * monthsInPeriod;
    }

    // Worker activity
    const ordersWithBoth = filtered.orders.filter(o => o.workers?.includes(partner1) && o.workers?.includes(partner2));
    const ordersOnlyP1   = filtered.orders.filter(o => o.workers?.includes(partner1) && !o.workers?.includes(partner2));
    const ordersOnlyP2   = filtered.orders.filter(o => o.workers?.includes(partner2) && !o.workers?.includes(partner1));
    const revWithBoth = ordersWithBoth.reduce((s, o) => s + Number(o.price), 0);
    const revOnlyP1   = ordersOnlyP1.reduce((s, o) => s + Number(o.price), 0);
    const revOnlyP2   = ordersOnlyP2.reduce((s, o) => s + Number(o.price), 0);

    // Duration by partner
    const p1Hours = [...ordersWithBoth, ...ordersOnlyP1]
      .filter(o => Number(o.durationHours) > 0)
      .reduce((s, o) => s + Number(o.durationHours), 0);
    const p2Hours = [...ordersWithBoth, ...ordersOnlyP2]
      .filter(o => Number(o.durationHours) > 0)
      .reduce((s, o) => s + Number(o.durationHours), 0);

    // Custom split orders
    const customSplitOrders = filtered.orders
      .filter(o => o.splitOverride != null)
      .sort((a, b) => b.date.localeCompare(a.date));

    return {
      p1RevActual, p2RevActual,
      rawExpTotal, expTotal,
      p1ExpShare, p2ExpShare,
      p1Profit, p2Profit,
      p1Paid, p2Paid, fairShare, balance,
      p1ExpByCat, p2ExpByCat,
      ordersWithBoth, ordersOnlyP1, ordersOnlyP2,
      revWithBoth, revOnlyP1, revOnlyP2,
      p1Hours, p2Hours,
      customSplitOrders,
    };
  }, [filtered, splitNum, split2, pausalNum, monthsInPeriod, partner1, partner2, totalRevenue]);

  const abs = Math.abs(Math.round(settlement.balance));
  const settled = abs < 1;

  const Card = ({ name, color, revenue, personalExp, pausalBonus, net }) => (
    <div className={`bg-slate-900 border rounded-xl p-5 space-y-4 ${color === 'orange' ? 'border-orange-500/20' : 'border-purple-500/20'}`}>
      <div className={`text-base font-bold ${color === 'orange' ? 'text-orange-400' : 'text-purple-400'}`}>{name}</div>
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-400"><TrendingUp className="w-3.5 h-3.5 text-emerald-500" />Podíl na tržbách</div>
          <span className="text-sm font-semibold text-white">{formatCzk(revenue)}</span>
        </div>
        {pausalBonus > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-400"><TrendingUp className="w-3.5 h-3.5 text-blue-400" />Paušál za dílnu</div>
            <span className="text-sm font-semibold text-blue-400">+ {formatCzk(pausalBonus)}</span>
          </div>
        )}
        {personalExp > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-400"><TrendingDown className="w-3.5 h-3.5 text-red-400" />Osobní výdaje</div>
            <span className="text-sm font-semibold text-red-400">− {formatCzk(personalExp)}</span>
          </div>
        )}
        <div className={`flex items-center justify-between pt-2 border-t ${color === 'orange' ? 'border-orange-500/20' : 'border-purple-500/20'}`}>
          <div className="flex items-center gap-2 text-sm font-semibold text-white"><Wallet className="w-3.5 h-3.5" />Čistý příjem</div>
          <span className={`text-lg font-bold ${net >= 0 ? (color === 'orange' ? 'text-orange-400' : 'text-purple-400') : 'text-red-400'}`}>{formatCzk(net)}</span>
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
          <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg px-1 py-1">
            <button onClick={() => period === 'month' ? shiftMonth(-1) : setSelectedYear(y => y - 1)}
              className="p-1.5 text-slate-400 hover:text-white transition-colors rounded">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            {!isCurrentPeriod && (
              <button onClick={() => period === 'month' ? setSelectedMonth(todayMonthStr) : setSelectedYear(todayYear)}
                className="px-2 py-0.5 text-xs text-orange-400 hover:text-orange-300 font-medium transition-colors">
                Dnes
              </button>
            )}
            <button onClick={() => period === 'month' ? shiftMonth(1) : setSelectedYear(y => y + 1)}
              disabled={isCurrentPeriod}
              className="p-1.5 text-slate-400 hover:text-white transition-colors rounded disabled:opacity-30">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
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
        <Card name={partner1} color="orange" revenue={p1Revenue} personalExp={p1PersonalExp} pausalBonus={0} net={p1Net} />
        <Card name={partner2} color="purple" revenue={p2Revenue} personalExp={p2PersonalExp} pausalBonus={p2PausalBonus} net={p2Net} />
      </div>

      {pausalNum > 0 && (
        <p className="text-xs text-slate-600 text-center">
          Paušál za dílnu {formatCzk(pausalNum)} Kč/měs. je zahrnut v příjmu partnera {partner2}.
        </p>
      )}

      {/* ── Divider ───────────────────────────────────────────────────────────── */}
      <div className="border-t border-slate-700/60 pt-2" />

      {/* ── Detailní vyrovnání ────────────────────────────────────────────────── */}
      <div className="space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Scale className="w-4 h-4 text-slate-400" />
            Detailní vyrovnání
          </h2>
          <p className="text-xs text-slate-500 mt-1">Kompletní rozpad sdílení příjmů, výdajů a dluhů za toto období</p>
        </div>

        {/* ── Výpočet zisku ───────────────────────────────────────── */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
            <Wallet className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Rozdělení zisku</span>
          </div>
          <div className="p-4 space-y-3">
            {/* Revenue bar */}
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>{partner1} · {splitNum} %</span>
                <span>{partner2} · {split2} %</span>
              </div>
              <div className="flex h-3 rounded-full overflow-hidden">
                <div className="bg-orange-500 transition-all duration-700" style={{ width: `${splitNum}%` }} />
                <div className="bg-purple-500 transition-all duration-700" style={{ width: `${split2}%` }} />
              </div>
              <div className="flex justify-between text-xs mt-1.5">
                <span className="text-orange-400 font-semibold">{formatCzk(Math.round(settlement.p1RevActual))}</span>
                <span className="text-purple-400 font-semibold">{formatCzk(Math.round(settlement.p2RevActual))}</span>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3 grid grid-cols-2 gap-3">
              {/* P1 breakdown */}
              <div className="space-y-1.5 text-xs">
                <div className="font-semibold text-orange-400 mb-2">{partner1}</div>
                <div className="flex justify-between text-slate-400"><span>Podíl na tržbách</span><span className="text-white">+ {formatCzk(Math.round(settlement.p1RevActual))}</span></div>
                <div className="flex justify-between text-slate-400"><span>Podíl na nákladech</span><span className="text-red-400">− {formatCzk(Math.round(settlement.p1ExpShare))}</span></div>
                <div className="flex justify-between border-t border-slate-800 pt-1.5 font-semibold">
                  <span className="text-slate-300">Čistý zisk</span>
                  <span className={settlement.p1Profit >= 0 ? 'text-orange-400' : 'text-red-400'}>{formatCzk(Math.round(settlement.p1Profit))}</span>
                </div>
              </div>
              {/* P2 breakdown */}
              <div className="space-y-1.5 text-xs">
                <div className="font-semibold text-purple-400 mb-2">{partner2}</div>
                <div className="flex justify-between text-slate-400"><span>Podíl na tržbách</span><span className="text-white">+ {formatCzk(Math.round(settlement.p2RevActual))}</span></div>
                {pausalNum * monthsInPeriod > 0 && (
                  <div className="flex justify-between text-slate-400"><span>Paušál za dílnu</span><span className="text-blue-400">+ {formatCzk(pausalNum * monthsInPeriod)}</span></div>
                )}
                <div className="flex justify-between text-slate-400"><span>Podíl na nákladech</span><span className="text-red-400">− {formatCzk(Math.round(settlement.p2ExpShare))}</span></div>
                <div className="flex justify-between border-t border-slate-800 pt-1.5 font-semibold">
                  <span className="text-slate-300">Čistý zisk</span>
                  <span className={settlement.p2Profit >= 0 ? 'text-purple-400' : 'text-red-400'}>{formatCzk(Math.round(settlement.p2Profit))}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Kdo zaplatil výdaje ─────────────────────────────────── */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
            <Receipt className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Kdo co zaplatil</span>
          </div>
          <div className="p-4">
            {settlement.rawExpTotal === 0 && pausalNum === 0 ? (
              <p className="text-xs text-slate-600 text-center py-2">Žádné výdaje v tomto období</p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {/* P1 expenses */}
                <div>
                  <div className="text-xs font-semibold text-orange-400 mb-2">{partner1} zaplatil</div>
                  {Object.keys(settlement.p1ExpByCat).length === 0 ? (
                    <p className="text-xs text-slate-600">— nic</p>
                  ) : Object.entries(settlement.p1ExpByCat).map(([cat, amt]) => (
                    <div key={cat} className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">{cat}</span>
                      <span className="text-white font-medium">{formatCzk(amt)}</span>
                    </div>
                  ))}
                  {Object.keys(settlement.p1ExpByCat).length > 0 && (
                    <div className="border-t border-slate-800 mt-2 pt-2 flex justify-between text-xs font-semibold">
                      <span className="text-slate-400">Celkem</span>
                      <span className="text-orange-400">{formatCzk(settlement.p1Paid)}</span>
                    </div>
                  )}
                </div>
                {/* P2 expenses */}
                <div>
                  <div className="text-xs font-semibold text-purple-400 mb-2">{partner2} zaplatil</div>
                  {Object.keys(settlement.p2ExpByCat).length === 0 ? (
                    <p className="text-xs text-slate-600">— nic</p>
                  ) : Object.entries(settlement.p2ExpByCat).map(([cat, amt]) => (
                    <div key={cat} className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">{cat}</span>
                      <span className="text-white font-medium">{formatCzk(amt)}</span>
                    </div>
                  ))}
                  {Object.keys(settlement.p2ExpByCat).length > 0 && (
                    <div className="border-t border-slate-800 mt-2 pt-2 flex justify-between text-xs font-semibold">
                      <span className="text-slate-400">Celkem</span>
                      <span className="text-purple-400">{formatCzk(settlement.p2Paid)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Balance result */}
            {(settlement.p1Paid + settlement.p2Paid) > 0 && (
              <div className={`mt-4 rounded-xl px-4 py-3 border text-sm font-semibold text-center flex items-center justify-center gap-2 ${
                settled
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
              }`}>
                <ArrowRightLeft className="w-4 h-4 flex-shrink-0" />
                {settled
                  ? 'Výdaje jsou vyrovnány'
                  : settlement.balance > 0
                    ? `${partner2} dluží ${partner1}ovi ${formatCzk(abs)}`
                    : `${partner1} dluží ${partner2}ovi ${formatCzk(abs)}`
                }
              </div>
            )}
          </div>
        </div>

        {/* ── Aktivita partnerů ───────────────────────────────────── */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
            <Users2 className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Aktivita na zakázkách</span>
          </div>
          {filtered.orders.length === 0 ? (
            <p className="text-xs text-slate-600 text-center py-6">Žádné zakázky v tomto období</p>
          ) : (
            <div className="p-4 space-y-4">
              {/* Side-by-side stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/50 rounded-xl p-3 space-y-2">
                  <div className="text-xs font-semibold text-orange-400">{partner1}</div>
                  <div className="text-2xl font-bold text-white">
                    {settlement.ordersOnlyP1.length + settlement.ordersWithBoth.length}
                    <span className="text-sm font-normal text-slate-500 ml-1">zak.</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {settlement.ordersOnlyP1.length} sám · {settlement.ordersWithBoth.length} společně
                  </div>
                  {settlement.p1Hours > 0 && (
                    <div className="text-xs text-slate-400">{settlement.p1Hours.toFixed(1)} h odpracováno</div>
                  )}
                  <div className="text-xs font-semibold text-orange-400 pt-1">{formatCzk(Math.round(settlement.revOnlyP1 + settlement.revWithBoth * splitNum / 100))}</div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-3 space-y-2">
                  <div className="text-xs font-semibold text-purple-400">{partner2}</div>
                  <div className="text-2xl font-bold text-white">
                    {settlement.ordersOnlyP2.length + settlement.ordersWithBoth.length}
                    <span className="text-sm font-normal text-slate-500 ml-1">zak.</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {settlement.ordersOnlyP2.length} sám · {settlement.ordersWithBoth.length} společně
                  </div>
                  {settlement.p2Hours > 0 && (
                    <div className="text-xs text-slate-400">{settlement.p2Hours.toFixed(1)} h odpracováno</div>
                  )}
                  <div className="text-xs font-semibold text-purple-400 pt-1">{formatCzk(Math.round(settlement.revOnlyP2 + settlement.revWithBoth * split2 / 100))}</div>
                </div>
              </div>

              {/* Breakdown rows */}
              {[
                { label: 'Oba společně', count: settlement.ordersWithBoth.length, rev: settlement.revWithBoth, color: 'text-slate-300' },
                { label: `Jen ${partner1}`, count: settlement.ordersOnlyP1.length, rev: settlement.revOnlyP1, color: 'text-orange-400' },
                { label: `Jen ${partner2}`, count: settlement.ordersOnlyP2.length, rev: settlement.revOnlyP2, color: 'text-purple-400' },
              ].map(({ label, count, rev, color }) => count > 0 && (
                <div key={label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${color === 'text-orange-400' ? 'bg-orange-500' : color === 'text-purple-400' ? 'bg-purple-500' : 'bg-slate-500'}`} />
                    <span className="text-slate-400">{label}</span>
                    <span className="text-slate-600">{count} {count === 1 ? 'zakázka' : count < 5 ? 'zakázky' : 'zakázek'}</span>
                  </div>
                  <span className={`font-semibold ${color}`}>{formatCzk(rev)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Zakázky s upraveným dělením ─────────────────────────── */}
        {settlement.customSplitOrders.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
              <Star className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Zakázky s upraveným dělením</span>
              <span className="ml-auto text-xs text-slate-600">{settlement.customSplitOrders.length} {settlement.customSplitOrders.length === 1 ? 'zakázka' : 'zakázek'}</span>
            </div>
            <div className="divide-y divide-slate-800/60">
              {settlement.customSplitOrders.map(o => {
                const sp = Number(o.splitOverride);
                const p1share = Math.round(Number(o.price) * sp / 100);
                const p2share = Number(o.price) - p1share;
                return (
                  <div key={o.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-white truncate">{o.description || 'Zakázka'}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{new Date(o.date + 'T12:00').toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 text-xs">
                      <span className="text-orange-400 font-medium">{sp} %</span>
                      <span className="text-slate-600">/</span>
                      <span className="text-purple-400 font-medium">{100 - sp} %</span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-semibold text-white">{formatCzk(Number(o.price))}</div>
                      <div className="text-[10px] text-slate-500">{formatCzk(p1share)} / {formatCzk(p2share)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
