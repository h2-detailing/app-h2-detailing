const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'h2-detailing-secret-key-2024';

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Není přihlášen' });
  }
  try {
    req.user = jwt.verify(authHeader.slice(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Neplatný nebo prošlý token' });
  }
};
