const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const socketHandler = require('./socket');

const app = express();


const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.LOCAL_URL
];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));


app.use(express.json());


app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);


const server = http.createServer(app);


const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

socketHandler(io);


// Use the PORT Render provides
const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
