const express = require('express');
const supabase = require('../database');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

async function getPrices() {
  const { data: row } = await supabase.from('settings').select('value').eq('key', 'prices').single();
  if (!row) return {};
  try { return JSON.parse(row.value); } catch { return {}; }
}

router.get('/', async (req, res) => {
  res.json(await getPrices());
});

router.put('/', async (req, res) => {
  await supabase.from('settings').upsert({ key: 'prices', value: JSON.stringify(req.body) }, { onConflict: 'key' });
  res.json(await getPrices());
});

module.exports = router;
