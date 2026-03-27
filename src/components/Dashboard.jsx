import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Car,
  Clock,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  BarChart2,
  CalendarDays,
  Users2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatCzk, formatDate } from '../utils/calculations';

// ─── String helpers ──────────────────────────────────────────────────────────

// Capitalize first letter (Czech month names from toLocaleDateString are lowercase)
const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

// Czech dative: "Jirka" → "Jirkovi", "Patrik" → "Patrikovi"
const dative = (name) => name.endsWith('a') ? name.slice(0, -1) + 'ovi' : name + 'ovi';

// ─── Date helpers ────────────────────────────────────────────────────────────

function getMonday(base = new Date()) {
  const d = new Date(base);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function getSunday(base = new Date()) {
  const mon = new Date(getMonday(base));
  mon.setDate(mon.getDate() + 6);
  return mon.toISOString().slice(0, 10);
}

function getWeekBase(offsetWeeks) {
  const d = new Date();
  d.setDate(d.getDate() + offsetWeeks * 7);
  return d;
}

function workingDaysInMonth(year, month) {
  let count = 0;
  const days = new Date(year, month, 0).getDate();
  for (let d = 1; d <= days; d++) {
    const dow = new Date(year, month - 1, d).getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}

function monthStr(year, month) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

// ─── Service category detection ──────────────────────────────────────────────

function detectCategory(desc) {
  const d = (desc || '').toLowerCase();
  if (
    d.includes('sedačka') || d.includes('čalounění') ||
    d.includes('křeslo') || d.includes('taburet') ||
    d.includes('koberec') || d.includes('židle')
  ) return 'Čalounění';
  if (d.includes('extra')) return 'Interiér Extra';
  if (d.includes('základ') || d.includes('zaklad')) return 'Interiér Základ';
  if (
    d.includes('interiér') || d.includes('interior') ||
    d.includes('vysátí') || d.includes('tepování')
  ) return 'Interiér';
  if (
    d.includes('exteriér') || d.includes('lak') ||
    d.includes('keramika') || d.includes('polish') ||
    d.includes('mytí') || d.includes('vosk')
  ) return 'Exteriér';
  return 'Ostatní';
}

// ─── Core computations ───────────────────────────────────────────────────────

function computeDashboard(orders, expenses, settings, period, selectedMonthStr, weekOffset = 0, clients = [], selectedYear = null) {
  const { partner1, partner2, pausal, split } = settings;
  const now = new Date();
  const todayYr = now.getFullYear();
  const todayMo = now.getMonth() + 1;

  // For month view use the selected month; otherwise use today
  const [selYr, selMo] = period === 'month' && selectedMonthStr
    ? selectedMonthStr.split('-').map(Number)
    : [todayYr, todayMo];
  const curMonthStr = monthStr(selYr, selMo);

  const activeYear = (period === 'year' && selectedYear) ? selectedYear : todayYr;
  const yr = period === 'year' ? activeYear : selYr;
  // For expense pausal scaling in year view: months elapsed in selected year
  const moForYear = activeYear < todayYr ? 12 : todayMo;
  const mo = period === 'year' ? moForYear : selMo;

  const weekBase = getWeekBase(weekOffset);
  const weekStart = getMonday(weekBase);
  const weekEnd = getSunday(weekBase);

  // ── Period filtering ─────────────────────────────────────────────
  const curYearStr = String(activeYear);
  const periodOrders =
    period === 'week'
      ? orders.filter(o => o.date >= weekStart && o.date <= weekEnd)
      : period === 'year'
      ? orders.filter(o => o.date.startsWith(curYearStr))
      : orders.filter(o => o.date.startsWith(curMonthStr));

  const monthExpenses = expenses.filter(e => e.date.startsWith(curMonthStr));
  const monthExpRaw = monthExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const monthExpTotal = monthExpRaw + pausal; // pausal always in monthly view

  const yearExpenses = expenses.filter(e => e.date.startsWith(curYearStr));
  const yearExpRaw = yearExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const yearExpTotal = yearExpRaw + pausal * mo; // pausal × months elapsed in selected year

  // ── Finance ──────────────────────────────────────────────────────
  const periodRevenue = periodOrders.reduce((s, o) => s + Number(o.price), 0);
  // For weekly view, expenses not split by week – show monthly costs as context
  const displayedExpenses =
    period === 'month' ? monthExpTotal :
    period === 'year' ? yearExpTotal :
    monthExpRaw;
  const periodProfit = periodRevenue - displayedExpenses;
  const margin = periodRevenue > 0 ? Math.round((periodProfit / periodRevenue) * 100) : 0;
  const avgOrderValue = periodOrders.length > 0 ? Math.round(periodRevenue / periodOrders.length) : 0;

  // ── Trends ───────────────────────────────────────────────────────
  const prevDate = new Date(selYr, selMo - 2, 1);
  const prevMonthStr_ = monthStr(prevDate.getFullYear(), prevDate.getMonth() + 1);
  const prevMonthRev = orders
    .filter(o => o.date.startsWith(prevMonthStr_))
    .reduce((s, o) => s + Number(o.price), 0);
  const revTrend =
    prevMonthRev > 0 ? Math.round(((periodRevenue - prevMonthRev) / prevMonthRev) * 100) : null;

  const lastYearStr = monthStr(selYr - 1, selMo);
  const lastYearRev = orders
    .filter(o => o.date.startsWith(lastYearStr))
    .reduce((s, o) => s + Number(o.price), 0);
  const yearTrend =
    lastYearRev > 0 ? Math.round(((periodRevenue - lastYearRev) / lastYearRev) * 100) : null;

  // Year-over-year trend (full previous year vs selected year)
  const prevYearRev = orders
    .filter(o => o.date.startsWith(String(activeYear - 1)))
    .reduce((s, o) => s + Number(o.price), 0);
  const yearVsPrevYear =
    prevYearRev > 0 ? Math.round(((periodRevenue - prevYearRev) / prevYearRev) * 100) : null;

  const prevMonthLabel = prevDate.toLocaleDateString('cs-CZ', { month: 'long' });

  // ── Utilization ──────────────────────────────────────────────────
  const workDays = workingDaysInMonth(selYr, selMo);
  const activeDays = new Set(
    orders.filter(o => o.date.startsWith(curMonthStr)).map(o => o.date)
  ).size;
  const utilization = workDays > 0 ? Math.round((activeDays / workDays) * 100) : 0;

  // ── Duration & revenue per hour ──────────────────────────────────
  const withDuration = periodOrders.filter(o => o.durationHours && Number(o.durationHours) > 0);
  const totalHours = withDuration.reduce((s, o) => s + Number(o.durationHours), 0);
  const avgDuration = withDuration.length > 0 ? (totalHours / withDuration.length).toFixed(1) : null;
  const revPerHour = totalHours > 0 ? Math.round(periodRevenue / totalHours) : null;

  // ── Service breakdown ────────────────────────────────────────────
  const catCount = {};
  const catRevenue = {};
  periodOrders.forEach(o => {
    const cat = detectCategory(o.description);
    catCount[cat] = (catCount[cat] || 0) + 1;
    catRevenue[cat] = (catRevenue[cat] || 0) + Number(o.price);
  });
  const serviceBreakdown = Object.entries(catCount)
    .map(([name, count]) => ({ name, count, revenue: catRevenue[name] || 0 }))
    .sort((a, b) => b.count - a.count);
  const maxCount = serviceBreakdown[0]?.count || 1;

  // ── Expense by category ──────────────────────────────────────────
  const expByCat = {};
  const expSourceForCat = period === 'year' ? yearExpenses : monthExpenses;
  expSourceForCat.forEach(e => {
    expByCat[e.category] = (expByCat[e.category] || 0) + Number(e.amount);
  });
  const pausalForCat = period === 'year' ? pausal * mo : pausal;
  if (pausalForCat > 0) {
    expByCat['Režie dílny'] = (expByCat['Režie dílny'] || 0) + pausalForCat;
  }

  // ── Partner settlement (all-time) ────────────────────────────────
  const allMonthSet = new Set([
    ...orders.map(o => o.date.slice(0, 7)),
    ...expenses.map(e => e.date.slice(0, 7)),
  ]);
  const numMonths = allMonthSet.size;
  const pausálTotal = numMonths * pausal;
  const totalRev = orders.reduce((s, o) => s + Number(o.price), 0);
  const totalExpRaw = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalExp = totalExpRaw + pausálTotal;
  const netProfit = totalRev - totalExp;
  const p1Revenue = orders.reduce((s, o) => {
    const sp = (o.splitOverride != null) ? Number(o.splitOverride) : split;
    return s + Number(o.price) * sp / 100;
  }, 0);
  const p2Revenue = totalRev - p1Revenue;
  const p1Profit = p1Revenue - totalExp * (split / 100);
  const p2Profit = p2Revenue - totalExp * ((100 - split) / 100);
  const p1Paid = expenses
    .filter(e => e.payer === partner1)
    .reduce((s, e) => s + Number(e.amount), 0);
  const p2Paid =
    expenses
      .filter(e => e.payer === partner2)
      .reduce((s, e) => s + Number(e.amount), 0) + pausálTotal;
  const fairShare = (p1Paid + p2Paid) / 2;
  const balance = p1Paid - fairShare;

  // ── Top clients ──────────────────────────────────────────────────
  const clientMap = {};
  periodOrders.forEach(o => {
    if (!o.clientId) return;
    if (!clientMap[o.clientId]) clientMap[o.clientId] = { revenue: 0, orders: 0, lastVisit: '' };
    clientMap[o.clientId].revenue += Number(o.price);
    clientMap[o.clientId].orders += 1;
    if (o.date > clientMap[o.clientId].lastVisit) clientMap[o.clientId].lastVisit = o.date;
  });
  const topClients = Object.entries(clientMap)
    .map(([id, stats]) => {
      const client = clients.find(c => c.id === id);
      return {
        id,
        name: client?.name ?? 'Neznámý klient',
        isCompany: client?.isCompany ?? false,
        ...stats,
        avgValue: stats.orders > 0 ? Math.round(stats.revenue / stats.orders) : 0,
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  // ── Yearly monthly breakdown ──────────────────────────────────────
  const monthlyBreakdown = period === 'year'
    ? Array.from({ length: 12 }, (_, i) => {
        const mStr = monthStr(activeYear, i + 1);
        const mOrders = orders.filter(o => o.date.startsWith(mStr));
        const mRevenue = mOrders.reduce((s, o) => s + Number(o.price), 0);
        const mExpRaw = expenses.filter(e => e.date.startsWith(mStr)).reduce((s, e) => s + Number(e.amount), 0);
        const mExp = mExpRaw + pausal;
        const label = new Date(activeYear, i, 1).toLocaleDateString('cs-CZ', { month: 'short' });
        return { month: i + 1, label: cap(label), revenue: mRevenue, expenses: mExp, orders: mOrders.length };
      })
    : null;

  return {
    curMonthStr, weekStart, weekEnd,
    periodOrders, periodRevenue, displayedExpenses,
    periodProfit, margin, avgOrderValue,
    prevMonthRev, prevMonthLabel, lastYearRev,
    revTrend, yearTrend, yearVsPrevYear,
    utilization, activeDays, workDays,
    avgDuration, revPerHour, totalHours,
    serviceBreakdown, maxCount,
    expByCat,
    p1Profit, p2Profit, balance,
    p1Paid, p2Paid, pausálTotal, numMonths,
    netProfit, fairShare,
    monthlyBreakdown,
    topClients,
  };
}

// ─── Small sub-components ────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
        {children}
      </span>
      <div className="flex-1 h-px bg-slate-800" />
    </div>
  );
}

function TrendBadge({ value, suffix = '%' }) {
  if (value === null || value === undefined) return null;
  const positive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full ${
        positive
          ? 'text-emerald-400 bg-emerald-500/10'
          : 'text-red-400 bg-red-500/10'
      }`}
    >
      {positive ? (
        <ArrowUpRight className="w-3 h-3" />
      ) : (
        <ArrowDownRight className="w-3 h-3" />
      )}
      {positive ? '+' : ''}{value}{suffix}
    </span>
  );
}

function StatCard({ title, value, sub, icon: Icon, color, trend, trendLabel }) {
  const palette = {
    green:  { ring: 'border-emerald-500/20 bg-emerald-500/5',  text: 'text-emerald-400',  icon: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    red:    { ring: 'border-red-500/20 bg-red-500/5',          text: 'text-red-400',       icon: 'text-red-400 bg-red-500/10 border-red-500/20' },
    orange: { ring: 'border-orange-500/20 bg-orange-500/5',    text: 'text-orange-400',    icon: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
    blue:   { ring: 'border-blue-500/20 bg-blue-500/5',        text: 'text-blue-400',      icon: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    purple: { ring: 'border-purple-500/20 bg-purple-500/5',    text: 'text-purple-400',    icon: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  };
  const c = palette[color] || palette.orange;
  return (
    <div className={`rounded-xl px-4 py-3 border ${c.ring} hover:border-slate-600 transition-colors`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`p-1.5 rounded-lg border ${c.icon}`}>
          <Icon className={`w-3.5 h-3.5 ${c.text}`} />
        </div>
        {trend !== undefined && trend !== null && (
          <TrendBadge value={trend} />
        )}
      </div>
      <div className={`text-xl font-bold ${c.text} mb-0.5`}>{value}</div>
      <div className="text-xs text-slate-400">{title}</div>
      {sub && <div className="text-xs text-slate-600 mt-0.5">{sub}</div>}
      {trendLabel && trend !== null && (
        <div className="text-xs text-slate-600">{trendLabel}</div>
      )}
    </div>
  );
}

function MiniStat({ label, value, sub, highlight }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className={`text-xl font-bold ${highlight ? 'text-orange-400' : 'text-white'}`}>
        {value}
      </div>
      {sub && <div className="text-xs text-slate-600 mt-0.5">{sub}</div>}
    </div>
  );
}

function UtilizationStat({ activeDays, workDays }) {
  const pct = workDays > 0 ? Math.round((activeDays / workDays) * 100) : 0;
  const color = pct >= 60 ? 'bg-emerald-500' : pct >= 30 ? 'bg-amber-500' : 'bg-red-500';
  const textColor = pct >= 60 ? 'text-emerald-400' : pct >= 30 ? 'text-amber-400' : 'text-red-400';
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors">
      <div className="text-xs text-slate-500 mb-1">Vytíženost</div>
      <div className={`text-xl font-bold ${textColor}`}>{pct} %</div>
      <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-xs text-slate-600 mt-1">{activeDays} / {workDays} prac. dní</div>
    </div>
  );
}

function CompactSettlement({ orders, expenses, settings }) {
  const { partner1, partner2, pausal, split } = settings;

  // Available months (newest first)
  const availableMonths = useMemo(() => {
    const m = new Set([
      ...orders.map(o => o.date.slice(0, 7)),
      ...expenses.map(e => e.date.slice(0, 7)),
    ]);
    return [...m].sort().reverse();
  }, [orders, expenses]);

  // Default to current month if it has data, otherwise show all-time
  const nowStr = monthStr(new Date().getFullYear(), new Date().getMonth() + 1);
  const [selectedMonth, setSelectedMonth] = useState(
    availableMonths.includes(nowStr) ? nowStr : ''
  );

  // Recompute whenever month selection changes
  const s = useMemo(() => {
    const filtO = selectedMonth
      ? orders.filter(o => o.date.startsWith(selectedMonth))
      : orders;
    const filtE = selectedMonth
      ? expenses.filter(e => e.date.startsWith(selectedMonth))
      : expenses;

    // Pausal: 1× per month for monthly view; proportional to months present otherwise
    const pausalNum = Number(pausal) || 0;
    const splitNum  = Number(split)  || 50;
    let pausálTotal;
    if (selectedMonth) {
      pausálTotal = pausalNum;
    } else {
      const allMonths = new Set([
        ...orders.map(o => o.date.slice(0, 7)),
        ...expenses.map(e => e.date.slice(0, 7)),
      ]);
      pausálTotal = allMonths.size * pausalNum;
    }

    const totalRev    = filtO.reduce((sum, o) => sum + Number(o.price), 0);
    const totalExpRaw = filtE.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalExp    = totalExpRaw + pausálTotal;
    // Per-order split: use splitOverride if present, else global split
    const p1Revenue = filtO.reduce((sum, o) => {
      const s = (o.splitOverride != null) ? Number(o.splitOverride) : splitNum;
      return sum + Number(o.price) * s / 100;
    }, 0);
    const p2Revenue = totalRev - p1Revenue;
    const p1Profit  = p1Revenue - totalExp * (splitNum / 100);
    const p2Profit  = p2Revenue - totalExp * ((100 - splitNum) / 100);
    const p1Paid      = filtE.filter(e => e.payer === partner1).reduce((sum, e) => sum + Number(e.amount), 0);
    const p2Paid      = filtE.filter(e => e.payer === partner2).reduce((sum, e) => sum + Number(e.amount), 0) + pausálTotal;
    const fairShare   = (p1Paid + p2Paid) / 2;
    const balance     = p1Paid - fairShare;
    return { p1Profit, p2Profit, p1Paid, p2Paid, pausálTotal, fairShare, balance, totalRev };
  }, [orders, expenses, settings, selectedMonth, pausal, split, partner1, partner2]);

  const abs     = Math.abs(Math.round(s.balance));
  const settled = abs < 1;

  return (
    <div className="space-y-3">
      {/* Month chips */}
      {availableMonths.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedMonth('')}
            className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
              !selectedMonth
                ? 'bg-orange-500/10 border-orange-500/40 text-orange-400'
                : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'
            }`}
          >
            Celkem
          </button>
          {availableMonths.map(m => {
            const [y, mo] = m.split('-');
            const label = cap(new Date(Number(y), parseInt(mo) - 1)
              .toLocaleDateString('cs-CZ', { month: 'short', year: '2-digit' }));
            return (
              <button
                key={m}
                onClick={() => setSelectedMonth(m === selectedMonth ? '' : m)}
                className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                  m === selectedMonth
                    ? 'bg-orange-500/10 border-orange-500/40 text-orange-400'
                    : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* Settlement card */}
      <div className={`rounded-xl p-4 border ${settled ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-amber-500/20 bg-amber-500/5'}`}>
        {/* Profit share */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <div className="text-xs text-slate-500 mb-0.5">{partner1} · {split} %</div>
            <div className="text-lg font-bold text-orange-400">{formatCzk(s.p1Profit)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-0.5">{partner2} · {100 - split} %</div>
            <div className="text-lg font-bold text-purple-400">{formatCzk(s.p2Profit)}</div>
          </div>
        </div>

        <div className="border-t border-slate-700/50 mb-3" />

        {/* Paid breakdown */}
        <div className="space-y-1.5 mb-3 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">{partner1} zaplatil</span>
            <span className="text-white font-medium">{formatCzk(s.p1Paid)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">{partner2} zaplatil (vč. paušálu)</span>
            <span className="text-white font-medium">{formatCzk(s.p2Paid)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Spravedlivý podíl</span>
            <span>{formatCzk(s.fairShare)}</span>
          </div>
        </div>

        {/* Result */}
        <div className={`rounded-lg px-3 py-2 text-xs font-semibold text-center ${
          settled
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
        }`}>
          {settled
            ? '✓ Vypořádáno'
            : s.balance > 0
              ? `${partner2} dluží ${dative(partner1)} ${formatCzk(abs)}`
              : `${partner1} dluží ${dative(partner2)} ${formatCzk(abs)}`
          }
        </div>
      </div>
    </div>
  );
}

function SeasonalCard({ d, now }) {
  const currentMonthName = cap(now.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' }));
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthName = cap(prevDate.toLocaleDateString('cs-CZ', { month: 'long' }));
  const lastYearName = cap(now.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' }).replace(
    String(now.getFullYear()),
    String(now.getFullYear() - 1)
  ));

  const rows = [
    {
      label: currentMonthName,
      value: d.periodRevenue,
      bold: true,
    },
    {
      label: `Minulý měsíc (${prevMonthName})`,
      value: d.prevMonthRev,
      trend: d.revTrend,
      bold: false,
    },
    {
      label: `Stejný měsíc loni`,
      value: d.lastYearRev,
      trend: d.yearTrend,
      bold: false,
      secondary: lastYearName,
    },
  ];

  const maxVal = Math.max(...rows.map(r => r.value), 1);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
      {rows.map((row, i) => (
        <div key={i}>
          <div className="flex items-center justify-between mb-1">
            <div>
              <span className={`text-xs ${row.bold ? 'text-slate-200 font-semibold' : 'text-slate-500'}`}>
                {row.label}
              </span>
              {row.secondary && (
                <span className="text-xs text-slate-600 ml-1">({row.secondary})</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {row.trend !== undefined && row.trend !== null && (
                <TrendBadge value={row.trend} />
              )}
              <span className={`text-xs font-semibold ${row.bold ? 'text-orange-400' : row.value > 0 ? 'text-white' : 'text-slate-600'}`}>
                {row.value > 0 ? formatCzk(row.value) : '— Kč'}
              </span>
            </div>
          </div>
          {row.value > 0 && (
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${row.bold ? 'bg-orange-500' : 'bg-slate-600'}`}
                style={{ width: `${Math.round((row.value / maxVal) * 100)}%` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Order Calendar (Apple-style) ────────────────────────────────────────────

// Muted pill colors keyed by order type (derived from detectCategory)
const PILL_TYPE_COLORS = {
  interior:  { pill: 'bg-sky-900 text-sky-300 border border-sky-700/50',      dot: 'bg-sky-500' },
  exterior:  { pill: 'bg-teal-900 text-teal-300 border border-teal-700/50',   dot: 'bg-teal-500' },
  upholstery:{ pill: 'bg-violet-900 text-violet-300 border border-violet-700/50', dot: 'bg-violet-500' },
  other:     { pill: 'bg-slate-700 text-slate-300 border border-slate-600/50', dot: 'bg-slate-400' },
};

function orderTypeColor(description) {
  const cat = detectCategory(description);
  if (cat === 'Čalounění') return PILL_TYPE_COLORS.upholstery;
  if (cat.startsWith('Exteriér')) return PILL_TYPE_COLORS.exterior;
  if (cat.startsWith('Interiér')) return PILL_TYPE_COLORS.interior;
  return PILL_TYPE_COLORS.other;
}

function OrderCalendar({ orders }) {
  const today = new Date();
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() + 1 });
  const [selectedOrder, setSelectedOrder] = useState(null);

  const { year, month } = view;

  const goToPrev = () => setView(v => {
    const d = new Date(v.year, v.month - 2, 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });
  const goToNext = () => setView(v => {
    const d = new Date(v.year, v.month, 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });
  const goToToday = () => setView({ year: today.getFullYear(), month: today.getMonth() + 1 });

  const todayStr = today.toISOString().slice(0, 10);
  const curMonthStr = `${year}-${String(month).padStart(2, '0')}`;

  const daysInMonth = new Date(year, month, 0).getDate();
  const daysInPrevMonth = new Date(year, month - 1, 0).getDate();
  const rawDow = new Date(year, month - 1, 1).getDay();
  const startOffset = rawDow === 0 ? 6 : rawDow - 1;

  // Group orders by date
  const ordersByDate = useMemo(() => {
    const map = {};
    orders.forEach(o => {
      const key = o.date.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(o);
    });
    return map;
  }, [orders]);

  // Build cells array
  const cells = useMemo(() => {
    const result = [];
    const prevM = month === 1 ? 12 : month - 1;
    const prevY = month === 1 ? year - 1 : year;
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      result.push({
        day: d,
        other: true,
        dateStr: `${prevY}-${String(prevM).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      result.push({
        day: d,
        other: false,
        dateStr: `${curMonthStr}-${String(d).padStart(2, '0')}`,
      });
    }
    const nextM = month === 12 ? 1 : month + 1;
    const nextY = month === 12 ? year + 1 : year;
    let nd = 1;
    while (result.length % 7 !== 0) {
      result.push({
        day: nd,
        other: true,
        dateStr: `${nextY}-${String(nextM).padStart(2, '0')}-${String(nd).padStart(2, '0')}`,
      });
      nd++;
    }
    return result;
  }, [year, month, startOffset, daysInMonth, daysInPrevMonth, curMonthStr]);

  const weeks = useMemo(() => {
    const w = [];
    for (let i = 0; i < cells.length; i += 7) w.push(cells.slice(i, i + 7));
    return w;
  }, [cells]);

  const monthName = new Date(year, month - 1, 1)
    .toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' });

  const MAX_PILLS = 3;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-1">
          <button
            onClick={goToToday}
            className="px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors mr-1"
          >
            Dnes
          </button>
          <button onClick={goToPrev} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={goToNext} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <span className="text-sm font-semibold text-white capitalize">{monthName}</span>
      </div>

      {/* ── Mobile: agenda list ── */}
      {(() => {
        const monthOrders = Object.entries(ordersByDate)
          .filter(([d]) => d.startsWith(curMonthStr))
          .sort(([a], [b]) => a.localeCompare(b));
        return (
          <div className="sm:hidden divide-y divide-slate-800/70">
            {monthOrders.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-600">Žádné zakázky tento měsíc</div>
            ) : monthOrders.map(([dateStr, dayOrders]) => {
              const isToday = dateStr === todayStr;
              const dateLabel = new Date(dateStr + 'T12:00:00').toLocaleDateString('cs-CZ', {
                weekday: 'short', day: 'numeric', month: 'short',
              });
              return (
                <div key={dateStr} className="px-4 py-3">
                  <div className={`text-xs font-semibold mb-2 ${isToday ? 'text-orange-400' : 'text-slate-500'}`}>
                    {isToday ? `Dnes · ${dateLabel}` : dateLabel}
                  </div>
                  <div className="space-y-1.5">
                    {dayOrders.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setSelectedOrder(selectedOrder?.id === o.id ? null : o); }}
                        className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg ${orderTypeColor(o.description).pill} hover:brightness-125 transition-all`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold truncate">{o.description || 'Zakázka'}</div>
                          <div className="text-[10px] opacity-70 mt-0.5">{detectCategory(o.description)}</div>
                        </div>
                        <div className="text-xs font-bold text-orange-400 flex-shrink-0">{formatCzk(Number(o.price))}</div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* ── Desktop: week grid ── */}
      <div className="hidden sm:block">

      {/* ── Day-of-week header ── */}
      <div className="grid grid-cols-7 border-b border-slate-800">
        {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map((d, i) => (
          <div
            key={d}
            className={`py-2 text-center text-xs font-medium ${i >= 5 ? 'text-slate-600' : 'text-slate-500'}`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* ── Week rows ── */}
      <div className="divide-y divide-slate-800/70" onClick={() => setSelectedOrder(null)}>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 divide-x divide-slate-800/70">
            {week.map(({ day, other, dateStr }) => {
              const dayOrders = ordersByDate[dateStr] || [];
              const isToday = dateStr === todayStr;
              const dow = new Date(dateStr + 'T12:00:00').getDay();
              const isWeekend = dow === 0 || dow === 6;
              const visible = dayOrders.slice(0, MAX_PILLS);
              const overflow = dayOrders.length - MAX_PILLS;

              return (
                <div
                  key={dateStr}
                  className={`min-h-[90px] p-1 flex flex-col ${other ? 'opacity-40' : ''}`}
                >
                  {/* Date number */}
                  <div className="flex justify-center mb-1">
                    <span
                      className={`w-6 h-6 flex items-center justify-center text-xs leading-none rounded-full font-medium ${
                        isToday
                          ? 'bg-orange-500 text-white font-bold'
                          : isWeekend && !other
                            ? 'text-slate-500'
                            : 'text-slate-400'
                      }`}
                    >
                      {day}
                    </span>
                  </div>

                  {/* Event pills */}
                  <div className="flex-1 space-y-0.5 overflow-hidden">
                    {visible.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setSelectedOrder(selectedOrder?.id === o.id ? null : o); }}
                        className={`w-full text-left ${orderTypeColor(o.description).pill} text-[10px] leading-tight px-1.5 py-[2px] rounded truncate font-medium hover:brightness-125 transition-all`}
                        title={o.description}
                      >
                        {detectCategory(o.description)}
                      </button>
                    ))}
                    {overflow > 0 && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setSelectedOrder(ordersByDate[dateStr][MAX_PILLS]); }}
                        className="text-[10px] text-slate-400 hover:text-white pl-1 font-medium transition-colors"
                      >
                        +{overflow} další
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      </div>{/* end desktop grid */}

      {/* ── Order detail popover ── */}
      {selectedOrder && (() => {
        const o = selectedOrder;
        const accentCls = orderTypeColor(o.description).dot;
        const dateLabel = new Date(o.date + 'T12:00:00').toLocaleDateString('cs-CZ', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        });
        return (
          <div className="border-t border-slate-800 px-4 py-3 flex items-start gap-3">
            <div className={`mt-0.5 w-2.5 h-2.5 rounded-sm flex-shrink-0 ${accentCls}`} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white leading-snug mb-1">
                {o.description || 'Zakázka'}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-400">
                <span className="capitalize">{dateLabel}</span>
                <span className="font-semibold text-orange-400">{formatCzk(Number(o.price))}</span>
                {o.workers?.length > 0 && <span>{o.workers.join(', ')}</span>}
                {o.durationHours > 0 && <span>{o.durationHours} h</span>}
              </div>
              {o.note && <div className="mt-1 text-xs text-slate-500 italic">{o.note}</div>}
            </div>
            <button
              type="button"
              onClick={() => setSelectedOrder(null)}
              className="p-1 text-slate-600 hover:text-slate-300 transition-colors flex-shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })()}
    </div>
  );
}

// ─── Yearly sub-components ───────────────────────────────────────────────────

function MonthlyRevenueChart({ monthlyBreakdown, selectedYear }) {
  const maxVal = Math.max(...monthlyBreakdown.map(m => Math.max(m.revenue, m.expenses)), 1);
  const now = new Date();
  const todayYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const H = 96;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div className="flex items-end gap-1" style={{ height: `${H + 16}px` }}>
        {monthlyBreakdown.map(m => {
          const profit = m.revenue - m.expenses;
          const isCurrent = selectedYear === todayYear && m.month === currentMonth;
          const isFuture  = selectedYear === todayYear && m.month > currentMonth;
          const revPct  = Math.max(Math.round((m.revenue  / maxVal) * 100), m.revenue  > 0 ? 2 : 0);
          const expPct  = Math.max(Math.round((m.expenses / maxVal) * 100), m.expenses > 0 ? 1 : 0);
          const profPct = Math.max(Math.round((Math.max(profit, 0) / maxVal) * 100), profit > 0 ? 2 : 0);

          return (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-0.5 group relative">
              {/* Tooltip */}
              {!isFuture && m.revenue > 0 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-700 border border-slate-600 text-xs px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none space-y-0.5">
                  <div className="text-orange-400">↑ {formatCzk(m.revenue)}</div>
                  <div className="text-red-400">↓ {formatCzk(m.expenses)}</div>
                  <div className={`font-semibold ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>= {formatCzk(profit)}</div>
                </div>
              )}
              <div className="w-full relative" style={{ height: `${H}px` }}>
                {isFuture ? (
                  <div className="absolute bottom-0 left-0 right-0 rounded-t bg-slate-800" style={{ height: '3px' }} />
                ) : (
                  <>
                    {/* Revenue background bar (subtle) */}
                    {m.revenue > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 rounded-t bg-orange-500/10 border-t border-orange-500/25"
                        style={{ height: `${revPct}%` }} />
                    )}
                    {/* Expenses dashed line */}
                    {m.expenses > 0 && (
                      <div className="absolute left-0 right-0"
                        style={{ bottom: `${expPct}%`, borderTop: '1px dashed rgba(248,113,113,0.45)' }} />
                    )}
                    {/* Profit bar (primary) */}
                    <div
                      className={`absolute bottom-0 left-0.5 right-0.5 rounded-t transition-all duration-500 ${
                        profit < 0 ? 'bg-red-500/80' :
                        isCurrent ? 'bg-emerald-500' :
                        'bg-emerald-700 group-hover:bg-emerald-600'
                      }`}
                      style={{ height: profit < 0
                        ? `${Math.max(Math.round((Math.abs(profit) / maxVal) * 100), 2)}%`
                        : `${profPct}%` }}
                    />
                  </>
                )}
              </div>
              <span className={`text-xs ${isCurrent ? 'text-orange-400 font-semibold' : 'text-slate-600'}`}>
                {m.label}
              </span>
            </div>
          );
        })}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 pt-2 border-t border-slate-800">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <div className="w-3 h-2.5 bg-emerald-700 rounded-sm flex-shrink-0" />Zisk
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <div className="w-3 h-2.5 bg-orange-500/20 border border-orange-500/30 rounded-sm flex-shrink-0" />Tržby
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <div className="w-3 flex-shrink-0" style={{ borderTop: '1px dashed rgba(248,113,113,0.5)' }} />Náklady
        </div>
      </div>
    </div>
  );
}

function YearlyTopMonths({ monthlyBreakdown }) {
  const sorted = [...monthlyBreakdown]
    .filter(m => m.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 3);
  if (sorted.length === 0) return <p className="text-xs text-slate-600">Žádná data</p>;
  const medals = ['🥇', '🥈', '🥉'];
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
      {sorted.map((m, i) => (
        <div key={m.month} className="flex items-center justify-between text-xs">
          <span className="text-slate-400">
            <span className="mr-1.5">{medals[i]}</span>
            {m.label}
          </span>
          <div className="text-right">
            <span className="text-white font-semibold tabular-nums">{formatCzk(m.revenue)}</span>
            <span className="text-slate-600 ml-1.5 tabular-nums">{m.orders} zak.</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function YearlyExpenseBreakdown({ expByCat }) {
  const entries = Object.entries(expByCat).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (entries.length === 0) return <p className="text-xs text-slate-600">Žádné výdaje</p>;
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2.5">
      {entries.map(([cat, amount]) => {
        const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
        return (
          <div key={cat}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400">{cat}</span>
              <span className="text-slate-300 tabular-nums">{formatCzk(amount)} · {pct} %</span>
            </div>
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-slate-600 rounded-full" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
      <div className="pt-1 border-t border-slate-800 flex justify-between text-xs">
        <span className="text-slate-500">Celkem výdaje</span>
        <span className="text-slate-300 font-semibold tabular-nums">{formatCzk(total)}</span>
      </div>
    </div>
  );
}

function TopClients({ topClients, wide = false }) {
  const sortOptions = [{ key: 'revenue', label: 'Tržby' }, { key: 'orders', label: 'Zakázky' }];

  const [sortBy, setSortBy] = useState('revenue');

  const sorted = [...topClients].sort((a, b) => {
    if (sortBy === 'orders') return b.orders - a.orders;
    if (sortBy === 'recent') return b.lastVisit.localeCompare(a.lastVisit);
    return b.revenue - a.revenue;
  });

  const maxRevenue = sorted.length > 0 ? Math.max(...sorted.map(c => c.revenue), 1) : 1;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      {/* Header with sort */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <span className="text-xs text-slate-500">
          {sorted.length} {sorted.length === 1 ? 'klient' : sorted.length < 5 ? 'klienti' : 'klientů'}
        </span>
        <div className="flex gap-0.5">
          {sortOptions.map(s => (
            <button
              key={s.key}
              onClick={() => setSortBy(s.key)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                sortBy === s.key ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="text-xs text-slate-600 text-center py-6">Žádní klienti v tomto období</p>
      ) : (
        <div className="divide-y divide-slate-800/60">
          {sorted.map((c, i) => {
            const revPct = Math.round((c.revenue / maxRevenue) * 100);
            return (
              <div key={c.id} className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {/* Rank */}
                  <span className={`text-xs tabular-nums w-4 shrink-0 text-right ${i === 0 ? 'text-orange-500 font-bold' : 'text-slate-600'}`}>
                    {i + 1}
                  </span>

                  {/* Name + tags */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-xs font-medium truncate ${i === 0 ? 'text-white' : 'text-slate-300'}`}>
                        {c.name}
                      </span>
                      {!!c.isCompany && (
                        <span className="text-xs text-slate-600 shrink-0">firma</span>
                      )}
                    </div>
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${i === 0 ? 'bg-orange-500' : 'bg-slate-600'}`}
                        style={{ width: `${revPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  {wide ? (
                    <div className="flex items-center gap-5 shrink-0 text-xs tabular-nums">
                      <div className="text-right">
                        <div className={`font-semibold ${i === 0 ? 'text-orange-400' : 'text-slate-300'}`}>{formatCzk(c.revenue)}</div>
                        <div className="text-slate-600">Ø {formatCzk(c.avgValue)}</div>
                      </div>
                      <div className="text-right w-14">
                        <div className="text-slate-300 font-medium">{c.orders}</div>
                        <div className="text-slate-600">{c.orders === 1 ? 'zakázka' : c.orders < 5 ? 'zakázky' : 'zakázek'}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-right shrink-0 text-xs tabular-nums">
                      <div className={`font-semibold ${i === 0 ? 'text-orange-400' : 'text-slate-300'}`}>{formatCzk(c.revenue)}</div>
                      <div className="text-slate-600">{c.orders} {c.orders === 1 ? 'zakázka' : c.orders < 5 ? 'zakázky' : 'zakázek'}</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

export default function Dashboard({ orders, expenses, settings, clients = [], onNavigate }) {
  const [period, setPeriod] = useState('month');
  const now = new Date();
  const todayYear = now.getFullYear();
  const todayMonthStr = monthStr(todayYear, now.getMonth() + 1);
  const [selectedMonth, setSelectedMonth] = useState(todayMonthStr);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedYear, setSelectedYear] = useState(todayYear);

  const shiftMonth = (delta) => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setSelectedMonth(monthStr(d.getFullYear(), d.getMonth() + 1));
  };

  const d = useMemo(
    () => computeDashboard(orders, expenses, settings, period, selectedMonth, weekOffset, clients, selectedYear),
    [orders, expenses, settings, period, selectedMonth, weekOffset, clients, selectedYear]
  );

  const selDate = new Date(selectedMonth + '-01');
  const monthLabel = selDate.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' });
  const weekLabel = `${formatDate(d.weekStart)} – ${formatDate(d.weekEnd)}`;
  const yearLabel = `Rok ${selectedYear}`;
  const periodLabel = period === 'month' ? monthLabel : period === 'year' ? yearLabel : `Týden ${weekLabel}`;
  const isCurrentMonth = selectedMonth === todayMonthStr;
  const isCurrentWeek = weekOffset === 0;
  const isCurrentYear = selectedYear === todayYear;

  const hasAnyData = orders.length > 0 || expenses.length > 0;

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-5 lg:space-y-7">

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5 capitalize">{periodLabel}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Period navigation (week / month / year) */}
          <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg px-1 py-1">
            <button
              onClick={() => {
                if (period === 'month') shiftMonth(-1);
                else if (period === 'week') setWeekOffset(w => w - 1);
                else setSelectedYear(y => y - 1);
              }}
              className="p-1.5 text-slate-400 hover:text-white transition-colors rounded"
              title={period === 'month' ? 'Předchozí měsíc' : period === 'week' ? 'Předchozí týden' : 'Předchozí rok'}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            {!(period === 'month' ? isCurrentMonth : period === 'week' ? isCurrentWeek : isCurrentYear) && (
              <button
                onClick={() => {
                  if (period === 'month') setSelectedMonth(todayMonthStr);
                  else if (period === 'week') setWeekOffset(0);
                  else setSelectedYear(todayYear);
                }}
                className="px-2 py-0.5 text-xs text-orange-400 hover:text-orange-300 font-medium transition-colors"
                title="Přejít na aktuální období"
              >
                Dnes
              </button>
            )}
            <button
              onClick={() => {
                if (period === 'month') shiftMonth(1);
                else if (period === 'week') setWeekOffset(w => w + 1);
                else setSelectedYear(y => y + 1);
              }}
              disabled={period === 'month' ? isCurrentMonth : period === 'week' ? isCurrentWeek : isCurrentYear}
              className="p-1.5 text-slate-400 hover:text-white transition-colors rounded disabled:opacity-30 disabled:cursor-not-allowed"
              title={period === 'month' ? 'Následující měsíc' : period === 'week' ? 'Následující týden' : 'Následující rok'}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          {/* Period toggle */}
          <div className="flex bg-slate-800 border border-slate-700 rounded-lg p-1 gap-1">
            {['week', 'month', 'year'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  period === p
                    ? 'bg-slate-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p === 'week' ? 'Týden' : p === 'month' ? 'Měsíc' : 'Rok'}
              </button>
            ))}
          </div>
          <button
            onClick={() => onNavigate('add-expense')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-400 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            + Náklad
          </button>
        </div>
      </div>

      {/* ── FINANCE ──────────────────────────────────────────────── */}
      <section>
        <SectionLabel>Finance</SectionLabel>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={`Tržby · ${period === 'month' ? 'měsíc' : period === 'year' ? 'rok' : 'týden'}`}
            value={formatCzk(d.periodRevenue)}
            icon={TrendingUp}
            color="green"
            trend={period === 'month' ? d.revTrend : period === 'year' ? d.yearVsPrevYear : null}
            trendLabel={period === 'month' && d.revTrend !== null ? `vs. ${d.prevMonthLabel}` : period === 'year' && d.yearVsPrevYear !== null ? `vs. ${selectedYear - 1}` : null}
          />
          <StatCard
            title={`Náklady · ${period === 'month' ? 'měsíc' : period === 'year' ? 'rok' : 'měsíc'}`}
            value={formatCzk(d.displayedExpenses)}
            icon={TrendingDown}
            color="red"
            sub={
              Object.keys(d.expByCat).length > 0
                ? `${Object.keys(d.expByCat).length} ${Object.keys(d.expByCat).length === 1 ? 'kategorie' : 'kategorií'}`
                : 'žádné výdaje'
            }
          />
          <StatCard
            title="Zisk"
            value={formatCzk(d.periodProfit)}
            icon={Wallet}
            color={d.periodProfit >= 0 ? 'orange' : 'red'}
            sub={`Marže ${d.margin} %`}
          />
          <StatCard
            title="Ø hodnota zakázky"
            value={d.periodOrders.length > 0 ? formatCzk(d.avgOrderValue) : '—'}
            icon={Car}
            color="blue"
            sub={`${d.periodOrders.length} ${d.periodOrders.length === 1 ? 'zakázka' : d.periodOrders.length < 5 ? 'zakázky' : 'zakázek'}`}
          />
        </div>
      </section>

      {/* ── TWO-COLUMN LAYOUT ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT col ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Provoz – 4 mini cards */}
          <section>
            <SectionLabel>Provoz</SectionLabel>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MiniStat
                label="Zakázek"
                value={d.periodOrders.length}
                sub={period === 'month' ? 'tento měsíc' : period === 'year' ? 'tento rok' : 'tento týden'}
              />
              <UtilizationStat activeDays={d.activeDays} workDays={d.workDays} />
              <MiniStat
                label="Ø doba zakázky"
                value={d.avgDuration ? `${d.avgDuration} h` : '—'}
                sub={d.totalHours > 0 ? `${d.totalHours.toFixed(1)} h celkem` : 'nezadáno'}
              />
              <MiniStat
                label="Tržba / hodina"
                value={d.revPerHour ? formatCzk(d.revPerHour) : '—'}
                sub={d.revPerHour ? 'klíč cenotvorby' : 'nezadáno'}
                highlight
              />
            </div>
          </section>

          {/* Měsíční přehled tržeb (year only) */}
          {period === 'year' && d.monthlyBreakdown && (
            <section>
              <SectionLabel>Zisk měsíc po měsíci</SectionLabel>
              <MonthlyRevenueChart monthlyBreakdown={d.monthlyBreakdown} selectedYear={selectedYear} />
            </section>
          )}

          {/* Top klienti – wide table (year only, placed under monthly chart) */}
          {period === 'year' && (
            <section>
              <SectionLabel>Top klienti</SectionLabel>
              <TopClients topClients={d.topClients} wide />
            </section>
          )}

          {/* Kalendář zakázek (month + week only) */}
          {period !== 'year' && (
            <section>
              <SectionLabel>Kalendář zakázek</SectionLabel>
              <OrderCalendar orders={orders} />
            </section>
          )}

          {!hasAnyData && (
            <div className="text-center py-16 text-slate-600">
              <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-base mb-1">Zatím žádná data</p>
              <p className="text-sm">Přidejte první zakázku nebo náklad.</p>
            </div>
          )}
        </div>

        {/* ── RIGHT col ────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* Vyrovnání partnerů (month + week only) */}
          {period !== 'year' && (
            <section>
              <SectionLabel>Vyrovnání partnerů</SectionLabel>
              <CompactSettlement orders={orders} expenses={expenses} settings={settings} />
            </section>
          )}

          {/* Sezónní srovnání (month + week only) */}
          {period !== 'year' && (
            <section>
              <SectionLabel>Sezónní srovnání tržeb</SectionLabel>
              <SeasonalCard d={d} now={now} />
            </section>
          )}

          {/* Top měsíce (year only) */}
          {period === 'year' && d.monthlyBreakdown && (
            <section>
              <SectionLabel>Nejlepší měsíce</SectionLabel>
              <YearlyTopMonths monthlyBreakdown={d.monthlyBreakdown} />
            </section>
          )}

          {/* Výdaje dle kategorie (year only) */}
          {period === 'year' && (
            <section>
              <SectionLabel>Výdaje dle kategorie</SectionLabel>
              <YearlyExpenseBreakdown expByCat={d.expByCat} />
            </section>
          )}

          {/* Top klienti – compact (week / month only) */}
          {period !== 'year' && (
            <section>
              <SectionLabel>Top klienti</SectionLabel>
              <TopClients topClients={d.topClients} />
            </section>
          )}

          {/* Nejpopulárnější služby */}
          {d.serviceBreakdown.length > 0 && (
            <section>
              <SectionLabel>Nejpopulárnější služby</SectionLabel>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                {d.serviceBreakdown.map(({ name, count, revenue }, i) => {
                  const pct = d.periodOrders.length > 0 ? Math.round((count / d.periodOrders.length) * 100) : 0;
                  return (
                    <div key={name}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className={`font-medium ${i === 0 ? 'text-white' : 'text-slate-400'}`}>{name}</span>
                        <span className="text-slate-500 tabular-nums">{count}× · {pct} % · {formatCzk(revenue)}</span>
                      </div>
                      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${i === 0 ? 'bg-orange-500' : 'bg-slate-600'}`}
                          style={{ width: `${Math.round((count / d.maxCount) * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

        </div>
      </div>
    </div>
  );
}
