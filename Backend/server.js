const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const incidentRoutes = require('./routes/incidentRoutes');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for hackathon simplicity
    methods: ["GET", "POST", "PUT"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Create uploads folder if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Inject Socket.IO into Request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/incidents', incidentRoutes);
app.use('/api/auth', authRoutes);

// Error Handler
app.use(errorHandler);

// Socket Connection Logic
io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log('User Disconnected');
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
