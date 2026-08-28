import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { authRoutes } from './routes/auth';
import { studentRoutes } from './routes/students';
import { teacherRoutes } from './routes/teachers';
import { tuitionRoutes } from './routes/tuition';
import { salaryRoutes } from './routes/salaries';
import { expenseRoutes } from './routes/expenses';
import { dashboardRoutes } from './routes/dashboard';
import { classRoutes } from './routes/classes';
import { passageRoutes } from './routes/passage';
import { statisticsRoutes } from './routes/statistics';
import { searchRoutes } from './routes/search';
import { activityLogRoutes } from './routes/activityLog';
import { notificationRoutes } from './routes/notifications';
import { backupRoutes } from './routes/backup';

const app = express();
const PORT = process.env.PORT || 5000;

console.log('Starting server...');

// Middleware
app.use(cors());
app.use(express.json());

// Log toutes les requêtes
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

console.log('Loading routes...');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/tuition', tuitionRoutes);
app.use('/api/salaries', salaryRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/passage', passageRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/activity-log', activityLogRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/backup', backupRoutes);

console.log('Routes loaded');

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
});

// Keep the process alive
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
