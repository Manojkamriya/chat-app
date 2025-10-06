// routes/users.js
const express = require('express');
const router = express.Router();
const supabase = require('../supabase');

// Get all users
router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) return res.status(400).json({ error });
  res.json(data);
});

module.exports = router;
