const express = require('express');
const { randomUUID } = require('crypto');
const supabase = require('../database');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false })
    .order('createdAt', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data.map(e => ({ ...e, type: 'expense' })));
});

router.post('/', async (req, res) => {
  const { date, description, amount, payer, category, note, vatIncluded } = req.body;
  if (!date || !description || amount == null || !payer) {
    return res.status(400).json({ error: 'Chybí povinná pole' });
  }
  const id = randomUUID();
  const { error } = await supabase.from('expenses').insert({
    id,
    date,
    description,
    amount: Number(amount),
    payer,
    category: category || 'Ostatní',
    note: note || '',
    vatIncluded: vatIncluded != null ? (vatIncluded ? 1 : 0) : 1,
    createdAt: new Date().toISOString(),
  });
  if (error) return res.status(500).json({ error: error.message });

  const { data } = await supabase.from('expenses').select('*').eq('id', id).single();
  res.status(201).json({ ...data, type: 'expense' });
});

router.put('/:id', async (req, res) => {
  const { date, description, amount, payer, category, note, vatIncluded } = req.body;

  const { data: existing } = await supabase.from('expenses').select('id').eq('id', req.params.id).single();
  if (!existing) return res.status(404).json({ error: 'Náklad nenalezen' });

  const { error } = await supabase.from('expenses').update({
    date,
    description,
    amount: Number(amount),
    payer,
    category: category || 'Ostatní',
    note: note || '',
    vatIncluded: vatIncluded != null ? (vatIncluded ? 1 : 0) : 1,
  }).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });

  const { data } = await supabase.from('expenses').select('*').eq('id', req.params.id).single();
  res.json({ ...data, type: 'expense' });
});

router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('expenses').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;
