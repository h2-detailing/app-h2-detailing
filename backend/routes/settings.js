const express = require('express');
const supabase = require('../database');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

async function getSettings() {
  const { data: rows } = await supabase.from('settings').select('*');
  const s = {};
  for (const row of (rows || [])) {
    s[row.key] = isNaN(row.value) || row.value === '' ? row.value : Number(row.value);
  }
  return s;
}

router.get('/', async (req, res) => {
  res.json(await getSettings());
});

router.put('/', async (req, res) => {
  const { partner1, partner2, pausal, split } = req.body;
  const updates = [];
  if (partner1 !== undefined) updates.push({ key: 'partner1', value: String(partner1) });
  if (partner2 !== undefined) updates.push({ key: 'partner2', value: String(partner2) });
  if (pausal  !== undefined) updates.push({ key: 'pausal',  value: String(pausal) });
  if (split   !== undefined) updates.push({ key: 'split',   value: String(split) });

  for (const u of updates) {
    await supabase.from('settings').upsert(u, { onConflict: 'key' });
  }
  res.json(await getSettings());
});

module.exports = router;
