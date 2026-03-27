const express = require('express');
const supabase = require('../database');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

router.put('/:id', async (req, res) => {
  const { make, model, year, licensePlate, color, note } = req.body;
  if (!make?.trim()) return res.status(400).json({ error: 'Značka je povinná' });
  const { data: existing } = await supabase.from('vehicles').select('id').eq('id', req.params.id).single();
  if (!existing) return res.status(404).json({ error: 'Vozidlo nenalezeno' });

  const { error } = await supabase.from('vehicles').update({
    make: make.trim(),
    model: model.trim(),
    year: year || '',
    licensePlate: licensePlate || '',
    color: color || '',
    note: note || '',
  }).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });

  const { data } = await supabase.from('vehicles').select('*').eq('id', req.params.id).single();
  res.json(data);
});

router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('vehicles').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;
