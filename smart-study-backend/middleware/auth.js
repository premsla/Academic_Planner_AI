const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

module.exports = function (req, res, next) {
  const authHeader = req.headers['authorization'];
  console.log('Authorization Header:', authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  const token = authHeader.split(' ')[1];
  console.log('Extracted Token:', token);

  try {
    console.log('JWT_SECRET from env:', process.env.JWT_SECRET);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded Token:', decoded);

    // Support both id and userId in the token
    req.userId = decoded.id || decoded.userId;
    console.log('Using userId:', req.userId);

    next();
  } catch (err) {
    console.error('JWT verification failed:', err.name, err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};
