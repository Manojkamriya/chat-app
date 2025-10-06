// auth.js
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const router = express.Router();

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// ----------------- SIGNUP -----------------
router.post('/signup', async (req, res) => {
  const { email, password, username, avatar } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ error: 'Email, password, and username are required.' });
  }

  try {
    // Create user in Supabase Auth
    const { data: authUser, error: authError, session } = await supabase.auth.signUp({
      email,
      password
    });

    if (authError) return res.status(400).json({ error: authError.message });

    // Insert profile info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert([
        { id: authUser.user.id, username, avatar, online: true, last_seen: new Date() }
      ])
      .select()
      .single();

    if (profileError) return res.status(400).json({ error: profileError.message });

    // Return profile + access_token
    res.status(201).json({ 
      message: 'Signup successful', 
      user: { ...profile, access_token: session?.access_token || '' } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ----------------- LOGIN -----------------
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) return res.status(400).json({ error: error.message });

    // Update profile online status
    await supabase.from('profiles')
      .update({ online: true, last_seen: new Date() })
      .eq('id', data.user.id);

    // Return user + access_token
    res.status(200).json({ 
      message: 'Login successful', 
      user: { ...data.user, access_token: data.session?.access_token || '' } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ----------------- LOGOUT -----------------
router.post('/logout', async (req, res) => {
  const { access_token } = req.body;

  if (!access_token) return res.status(400).json({ error: 'Access token required' });

  try {
    const { error } = await supabase.auth.admin.invalidateUserSessions(access_token);
    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
