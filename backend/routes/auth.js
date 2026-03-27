const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'h2-detailing-secret-key-2024';

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Chybí přihlašovací údaje' });

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('username', username.toLowerCase())
    .single();

  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Nesprávné přihlašovací jméno nebo heslo' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, name: user.name },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
  res.json({ token, user: { id: user.id, username: user.username, name: user.name } });
});

router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

router.put('/password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Chybí heslo' });
  if (newPassword.length < 4) return res.status(400).json({ error: 'Heslo musí mít alespoň 4 znaky' });

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', req.user.id)
    .single();

  if (!bcrypt.compareSync(currentPassword, user.passwordHash)) {
    return res.status(401).json({ error: 'Stávající heslo je nesprávné' });
  }

  await supabase
    .from('users')
    .update({ passwordHash: bcrypt.hashSync(newPassword, 10) })
    .eq('id', req.user.id);

  res.json({ success: true });
});

module.exports = router;
