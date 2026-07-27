require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { initializeCronJobs } = require('./src/utils/cronJobs');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const systemRoutes = require('./src/routes/systemRoutes');
const taskRoutes = require('./src/routes/taskRoutes');
const incidentRoutes = require('./src/routes/incidentRoutes');
const sparePartRoutes = require('./src/routes/sparePartRoutes');
const userRoutes = require('./src/routes/userRoutes');
const groupRoutes = require('./src/routes/groupRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const trainingRoutes = require('./src/routes/trainingRoutes');

// Import middleware
const { errorHandler } = require('./src/middleware/errorHandler');
const { protect } = require('./src/middleware/auth');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api', limiter);

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('subscribe', (room) => {
    socket.join(room);
  });
  
  socket.on('unsubscribe', (room) => {
    socket.leave(room);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/systems', protect, systemRoutes);
app.use('/api/tasks', protect, taskRoutes);
app.use('/api/incidents', protect, incidentRoutes);
app.use('/api/spare-parts', protect, sparePartRoutes);
app.use('/api/users', protect, userRoutes);
app.use('/api/groups', protect, groupRoutes);
app.use('/api/dashboard', protect, dashboardRoutes);
app.use('/api/trainings', protect, trainingRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// JSON 404 for any unmatched API route (must come after all real routes,
// otherwise unmatched requests fall through to Express's default HTML error page)
app.use('/api', (req, res) => {
  res.status(404).json({ message: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

// Error handling middleware
app.use(errorHandler);

// Database connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => {
  console.log('MongoDB connected successfully');
  initializeCronJobs(io);
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(async () => {
    console.log('HTTP server closed');
    try {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
    } catch (err) {
      console.error('Error closing MongoDB connection:', err);
    } finally {
      process.exit(0);
    }
  });
});

module.exports = { app, io };