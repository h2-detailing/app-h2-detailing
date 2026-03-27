export function calculateStats(orders, expenses, settings) {
  const { partner1, partner2, pausal, split } = settings;

  // Unique months across all transactions
  const allDates = [
    ...orders.map((o) => o.date.slice(0, 7)),
    ...expenses.map((e) => e.date.slice(0, 7)),
  ];
  const uniqueMonths = [...new Set(allDates)].sort();
  const numMonths = uniqueMonths.length;
  const pausálTotal = numMonths * pausal;

  // Revenue
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.price), 0);

  // Expenses
  const totalExpensesRaw = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalExpenses = totalExpensesRaw + pausálTotal;

  // Net profit
  const netProfit = totalRevenue - totalExpenses;

  // Profit shares
  const partner1Profit = netProfit * (split / 100);
  const partner2Profit = netProfit * ((100 - split) / 100);

  // Who paid what personally
  const partner1Paid = expenses
    .filter((e) => e.payer === partner1)
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const partner2Paid =
    expenses
      .filter((e) => e.payer === partner2)
      .reduce((sum, e) => sum + Number(e.amount), 0) + pausálTotal;

  const sharedPaid = expenses
    .filter((e) => e.payer === 'Společná kasa')
    .reduce((sum, e) => sum + Number(e.amount), 0);

  // Settlement (expense equalization, excluding shared kasa)
  const totalPersonal = partner1Paid + partner2Paid;
  const fairShare = totalPersonal / 2;
  const balance = partner1Paid - fairShare;
  // balance > 0: partner2 owes partner1 |balance|
  // balance < 0: partner1 owes partner2 |balance|

  // Monthly chart data
  const monthlyData = uniqueMonths.map((month) => {
    const revenue = orders
      .filter((o) => o.date.startsWith(month))
      .reduce((sum, o) => sum + Number(o.price), 0);
    const expensesMonth =
      expenses
        .filter((e) => e.date.startsWith(month))
        .reduce((sum, e) => sum + Number(e.amount), 0) + pausal;
    const [year, m] = month.split('-');
    const label = new Date(Number(year), parseInt(m) - 1).toLocaleDateString('cs-CZ', {
      month: 'short',
      year: '2-digit',
    });
    return { month: label, Příjmy: revenue, Náklady: expensesMonth };
  });

  return {
    totalRevenue,
    totalExpenses,
    totalExpensesRaw,
    netProfit,
    partner1Profit,
    partner2Profit,
    partner1Paid,
    partner2Paid,
    sharedPaid,
    pausálTotal,
    numMonths,
    balance,
    monthlyData,
    uniqueMonths,
  };
}

export function formatCzk(amount) {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatOrderNumber(n) {
  if (n == null || n === '') return '';
  return `#${String(n).padStart(4, '0')}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}. ${m}. ${y}`;
}

export function exportToCsv(orders, expenses, settings) {
  const { partner1, partner2 } = settings;
  const rows = [
    ['Datum', 'Popis', 'Typ', 'Částka (Kč)', 'Kategorie', 'Kdo zaplatil'],
  ];

  const sorted = [
    ...orders.map((o) => ({
      date: o.date,
      description: o.description,
      type: 'Zakázka',
      amount: o.price,
      category: '',
      payer: `${partner1} 50% / ${partner2} 50%`,
    })),
    ...expenses.map((e) => ({
      date: e.date,
      description: e.description,
      type: 'Náklad',
      amount: e.amount,
      category: e.category,
      payer: e.payer,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  sorted.forEach((row) => {
    rows.push([row.date, row.description, row.type, row.amount, row.category, row.payer]);
  });

  const csvContent = rows.map((r) => r.join(';')).join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'h2-detailing-export.csv';
  a.click();
  URL.revokeObjectURL(url);
}
