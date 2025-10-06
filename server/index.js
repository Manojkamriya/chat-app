// // index.js
// const express = require('express');
// const http = require('http');
// const { Server } = require('socket.io');
// const dotenv = require('dotenv');
// const userRoutes = require('./routes/users');
// const authRoutes = require('./routes/auth');
// const socketHandler = require('./socket');

// dotenv.config();

// const app = express();
// app.use(express.json());

// // Routes
// app.use('/api/supabase/users', userRoutes);
// app.use('/api/auth', authRoutes);

// const server = http.createServer(app);

// const io = new Server(server, {
//   cors: { origin: ['http://localhost:5000', 'http://192.168.29.6:5000','http://127.0.0.1:5000'], methods: ['GET', 'POST'], credentials: true },
//   transports: ['websocket', 'polling'],
// });

// // Socket.io handler
// socketHandler(io);

// server.listen(3002, '0.0.0.0', () => {
//   console.log('Backend server running on http://0.0.0.0:3002');
// });
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const socketHandler = require('./socket');

dotenv.config();

const app = express();

// -------------------- CORS Setup --------------------
const allowedOrigins = [
  'http://localhost:5000', 'http://localhost:5001',
  'http://127.0.0.1:5000',
  'http://192.168.29.6:5000', // LAN testing
];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true, // allow cookies if using them
}));

// -------------------- Middleware --------------------
app.use(express.json());

// -------------------- Routes --------------------
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// -------------------- HTTP Server --------------------
const server = http.createServer(app);

// -------------------- Socket.IO --------------------
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

socketHandler(io);

// -------------------- Start Server --------------------
const PORT =  3002;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend running on http://0.0.0.0:${PORT}`);
});
