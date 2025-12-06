const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const socketHandler = require('./socket');

const app = express();


app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));


app.use(express.json());


app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);


const server = http.createServer(app);


const io = new Server(server, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

socketHandler(io);


const PORT = process.env.PORT || 3001;
server.listen(PORT, 'localhost', () => {
  console.log(`Backend running on port ${PORT}`);
});
