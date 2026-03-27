const express = require('express');
const { randomUUID } = require('crypto');
const supabase = require('../database');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

async function clientWithVehicles(id) {
  const { data: client } = await supabase.from('clients').select('*').eq('id', id).single();
  if (!client) return null;
  const { data: vehicles } = await supabase
    .from('vehicles').select('*').eq('clientId', id).order('make').order('model');
  return { ...client, vehicles: vehicles || [] };
}

router.get('/', async (req, res) => {
  const { data: clients, error } = await supabase.from('clients').select('*').order('name');
  if (error) return res.status(500).json({ error: error.message });

  const withVehicles = await Promise.all(clients.map(async c => {
    const { data: vehicles } = await supabase
      .from('vehicles').select('*').eq('clientId', c.id).order('make').order('model');
    return { ...c, vehicles: vehicles || [] };
  }));
  res.json(withVehicles);
});

router.post('/', async (req, res) => {
  const { name, phone, email, note, isCompany, ico, dic, billingAddress } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Jméno je povinné' });
  const id = randomUUID();
  const { error } = await supabase.from('clients').insert({
    id,
    name: name.trim(),
    phone: phone || '',
    email: email || '',
    note: note || '',
    isCompany: isCompany ? 1 : 0,
    ico: ico || '',
    dic: dic || '',
    billingAddress: billingAddress || '',
    createdAt: new Date().toISOString(),
  });
  if (error) return res.status(500).json({ error: error.message });
  const { data } = await supabase.from('clients').select('*').eq('id', id).single();
  res.status(201).json({ ...data, vehicles: [] });
});

router.put('/:id', async (req, res) => {
  const { name, phone, email, note, isCompany, ico, dic, billingAddress } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Jméno je povinné' });
  const { data: existing } = await supabase.from('clients').select('id').eq('id', req.params.id).single();
  if (!existing) return res.status(404).json({ error: 'Klient nenalezen' });

  const { error } = await supabase.from('clients').update({
    name: name.trim(),
    phone: phone || '',
    email: email || '',
    note: note || '',
    isCompany: isCompany ? 1 : 0,
    ico: ico || '',
    dic: dic || '',
    billingAddress: billingAddress || '',
  }).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json(await clientWithVehicles(req.params.id));
});

router.delete('/:id', async (req, res) => {
  await supabase.from('vehicles').delete().eq('clientId', req.params.id);
  const { error } = await supabase.from('clients').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

router.post('/:id/vehicles', async (req, res) => {
  const { make, model, year, licensePlate, color, note } = req.body;
  if (!make?.trim() || !model?.trim()) return res.status(400).json({ error: 'Značka a model jsou povinné' });
  const { data: clientExists } = await supabase.from('clients').select('id').eq('id', req.params.id).single();
  if (!clientExists) return res.status(404).json({ error: 'Klient nenalezen' });

  const id = randomUUID();
  const { error } = await supabase.from('vehicles').insert({
    id,
    clientId: req.params.id,
    make: make.trim(),
    model: model.trim(),
    year: year || '',
    licensePlate: licensePlate || '',
    color: color || '',
    note: note || '',
  });
  if (error) return res.status(500).json({ error: error.message });
  const { data } = await supabase.from('vehicles').select('*').eq('id', id).single();
  res.status(201).json(data);
});

module.exports = router;
