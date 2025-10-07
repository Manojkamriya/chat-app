// // auth.js

// const jwt = require("jsonwebtoken");
// const express = require('express');
// const { createClient } = require('@supabase/supabase-js');

// const router = express.Router();

// // Initialize Supabase
// const supabase = createClient(
//   process.env.SUPABASE_URL,
//   process.env.SUPABASE_ANON_KEY
// );

// // ----------------- SIGNUP -----------------
// router.post('/signup', async (req, res) => {
//   const { email, password, username, avatar } = req.body;

//   if (!email || !password || !username) {
//     return res.status(400).json({ error: 'Email, password, and username are required.' });
//   }

//   try {
//     // Create user in Supabase Auth
//     const { data: authUser, error: authError, session } = await supabase.auth.signUp({
//       email,
//       password
//     });

//     if (authError) return res.status(400).json({ error: authError.message });

//     // Insert profile info
//     const { data: profile, error: profileError } = await supabase
//       .from('profiles')
//       .insert([
//         { id: authUser.user.id, username, avatar, online: true, last_seen: new Date() }
//       ])
//       .select()
//       .single();

//     if (profileError) return res.status(400).json({ error: profileError.message });

//     // Return profile + access_token
//     res.status(201).json({ 
//       message: 'Signup successful', 
//       user: { ...profile, access_token: session?.access_token || '' } 
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// // ----------------- LOGIN -----------------
// router.post('/login', async (req, res) => {
//   const { email, password } = req.body;

//   if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

//   try {
//     const { data, error } = await supabase.auth.signInWithPassword({
//       email,
//       password
//     });

//     if (error) return res.status(400).json({ error: error.message });

//     // Update profile online status
//     await supabase.from('profiles')
//       .update({ online: true, last_seen: new Date() })
//       .eq('id', data.user.id);

//     // Get profile data
//     const { data: profile } = await supabase
//       .from('profiles')
//       .select('id, username, avatar, online')
//       .eq('id', data.user.id)
//       .single();

//     // Return profile + access_token
//     res.status(200).json({ 
//       message: 'Login successful', 
//       user: { ...profile, access_token: data.session?.access_token || '' } 
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// // ----------------- LOGOUT -----------------
// router.post("/logout", async (req, res) => {
//   const { access_token } = req.body;

//   if (!access_token) return res.status(400).json({ error: "Access token required" });

//   try {
//     // Decode token without verifying signature (optional: verify with Supabase secret)
//     const decoded = jwt.decode(access_token);
//     if (!decoded || !decoded.sub) {
//       return res.status(400).json({ error: "Invalid token" });
//     }

//     const user_id = decoded.sub; // Supabase user ID

//     const { error } = await supabase.auth.admin.invalidateUserSessions(user_id);
//     if (error) return res.status(400).json({ error: error.message });

//     res.status(200).json({ message: "Logged out successfully" });
//   } catch (err) {
//     console.error("Logout error:", err);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// module.exports = router;
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const router = express.Router();

// Initialize Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

router.post('/signup', async (req, res) => {
  const { email, password, username, avatar } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ error: 'Email, password, and username are required.' });
  }

  try {
    // Create user in Supabase Auth
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password
    });

    if (authError) return res.status(400).json({ error: authError.message });

    const userId = data.user.id;

    // Insert profile info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert([
        { id: userId, username, avatar, online: true, last_seen: new Date() }
      ])
      .select()
      .single();

    if (profileError) return res.status(400).json({ error: profileError.message });

    // Immediately sign in the user to get session and access_token
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (loginError) return res.status(400).json({ error: loginError.message });

    const response = {
      ...profile,
      access_token: loginData.session.access_token
    };

    res.status(201).json({ message: 'Signup successful', user: response });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// router.post('/signup', async (req, res) => {
//   const { email, password, username, avatar } = req.body;

//   if (!email || !password || !username) {
//     return res.status(400).json({ error: 'Email, password, and username are required.' });
//   }

//   try {
//     // Create user in Supabase Auth
//     const { data: authUser, error: authError, session } = await supabase.auth.signUp({
//       email,
//       password
//     });

//     if (authError) return res.status(400).json({ error: authError.message });

//     // Insert profile info
//     const { data: profile, error: profileError } = await supabase
//       .from('profiles')
//       .insert([
//         { id: authUser.user.id, username, avatar, online: true, last_seen: new Date() }
//       ])
//       .select()
//       .single();

//     if (profileError) return res.status(400).json({ error: profileError.message });

//     // Return profile + access_token if available
//     const response = { ...profile };
//     if (session?.access_token) response.access_token = session.access_token;

//     res.status(201).json({ message: 'Signup successful', user: response });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });
// ---------------- LOGIN with refresh token storage ----------------
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(400).json({ error: error.message });

    // Save refresh token securely in your database for this user
    // Example: await db.saveRefreshToken(data.user.id, data.session.refresh_token);

    const profile = await supabase
      .from('profiles')
      .select('id, username, avatar, online')
      .eq('id', data.user.id)
      .single();

    res.status(200).json({
      message: 'Login successful',
      user: { ...profile.data, access_token: data.session.access_token }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------- REFRESH ACCESS TOKEN ----------------
router.post('/refresh-token', async (req, res) => {
  const { user_id } = req.body;

  if (!user_id) return res.status(400).json({ error: 'User ID required' });

  try {
    // Retrieve refresh token from your database
    const refresh_token = await getRefreshTokenFromDB(user_id); // implement this

    if (!refresh_token) return res.status(401).json({ error: 'No refresh token found, login again' });

    const { data, error } = await supabase.auth.refreshSession(refresh_token);
    if (error) return res.status(401).json({ error: error.message });

    // Optionally update refresh token in DB if it rotated
    // await updateRefreshTokenInDB(user_id, data.session.refresh_token);

    res.status(200).json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------- LOGOUT ----------------
router.post('/logout', async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'User ID required' });

  try {
    // Call Supabase Admin REST API to invalidate sessions
    const projectRef = process.env.SUPABASE_PROJECT_REF; // e.g., 'xyzabc123'
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    await axios.post(
      `https://${projectRef}.supabase.co/auth/v1/admin/users/${user_id}/invalidate`,
      {},
      {
        headers: {
          apiKey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Update user's online status
    await supabase
      .from('profiles')
      .update({ online: false, last_seen: new Date() })
      .eq('id', user_id);

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
