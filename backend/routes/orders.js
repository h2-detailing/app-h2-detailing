const express = require('express');
const multer = require('multer');
const path = require('path');
const { randomUUID } = require('crypto');
const supabase = require('../database');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// Memory storage — no disk writes (required for Vercel)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

function parseOrder(o) {
  return {
    ...o,
    workers: typeof o.workers === 'string' ? JSON.parse(o.workers || '[]') : (o.workers || []),
    type: 'order',
  };
}

router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('date', { ascending: false })
    .order('createdAt', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data.map(parseOrder));
});

router.post('/', async (req, res) => {
  const { date, description, price, note, clientId, vehicleId, workers, durationHours, status, splitOverride } = req.body;
  if (!date || !description || price == null) return res.status(400).json({ error: 'Chybí povinná pole' });

  const { data: maxRow } = await supabase
    .from('orders')
    .select('orderNumber')
    .order('orderNumber', { ascending: false })
    .limit(1);
  const orderNumber = (maxRow?.[0]?.orderNumber ?? 0) + 1;

  const id = randomUUID();
  const { error } = await supabase.from('orders').insert({
    id,
    orderNumber,
    date,
    description,
    price: Number(price),
    note: note || '',
    clientId: clientId || null,
    vehicleId: vehicleId || null,
    workers: JSON.stringify(workers || []),
    durationHours: durationHours || null,
    status: status || 'open',
    splitOverride: splitOverride != null ? Number(splitOverride) : null,
    createdAt: new Date().toISOString(),
  });
  if (error) return res.status(500).json({ error: error.message });

  const { data } = await supabase.from('orders').select('*').eq('id', id).single();
  res.status(201).json(parseOrder(data));
});

router.put('/:id', async (req, res) => {
  const { date, description, price, note, clientId, vehicleId, workers, durationHours, status, splitOverride } = req.body;

  const { data: existing } = await supabase.from('orders').select('id').eq('id', req.params.id).single();
  if (!existing) return res.status(404).json({ error: 'Zakázka nenalezena' });

  const { error } = await supabase.from('orders').update({
    date,
    description,
    price: Number(price),
    note: note || '',
    clientId: clientId || null,
    vehicleId: vehicleId || null,
    workers: JSON.stringify(workers || []),
    durationHours: durationHours || null,
    status: status || 'open',
    splitOverride: splitOverride != null ? Number(splitOverride) : null,
  }).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });

  const { data } = await supabase.from('orders').select('*').eq('id', req.params.id).single();
  res.json(parseOrder(data));
});

router.delete('/:id', async (req, res) => {
  const { data: photos } = await supabase
    .from('order_photos')
    .select('filename')
    .eq('orderId', req.params.id);

  if (photos?.length) {
    const paths = photos.map(p => p.filename).filter(Boolean);
    if (paths.length) await supabase.storage.from('photos').remove(paths);
  }

  await supabase.from('order_photos').delete().eq('orderId', req.params.id);
  await supabase.from('orders').delete().eq('id', req.params.id);
  res.json({ success: true });
});

router.get('/:id/photos', async (req, res) => {
  const { data, error } = await supabase
    .from('order_photos')
    .select('*')
    .eq('orderId', req.params.id)
    .order('type')
    .order('createdAt');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/:id/photos', upload.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nebyl nahrán soubor' });

  const id = randomUUID();
  const ext = path.extname(req.file.originalname);
  const storagePath = `${req.params.id}/${id}${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('photos')
    .upload(storagePath, req.file.buffer, { contentType: req.file.mimetype });
  if (uploadError) return res.status(500).json({ error: uploadError.message });

  const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(storagePath);

  const { error } = await supabase.from('order_photos').insert({
    id,
    orderId: req.params.id,
    type: req.body.type || 'before',
    filename: storagePath,
    originalName: req.file.originalname,
    url: publicUrl,
    createdAt: new Date().toISOString(),
  });
  if (error) return res.status(500).json({ error: error.message });

  const { data } = await supabase.from('order_photos').select('*').eq('id', id).single();
  res.status(201).json(data);
});

router.delete('/:id/photos/:photoId', async (req, res) => {
  const { data: photo } = await supabase
    .from('order_photos')
    .select('*')
    .eq('id', req.params.photoId)
    .eq('orderId', req.params.id)
    .single();
  if (!photo) return res.status(404).json({ error: 'Fotka nenalezena' });

  if (photo.filename) {
    await supabase.storage.from('photos').remove([photo.filename]);
  }
  await supabase.from('order_photos').delete().eq('id', req.params.photoId);
  res.json({ success: true });
});

module.exports = router;
