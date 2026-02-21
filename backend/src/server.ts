import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { config } from './config/env';
import { errorHandler, notFound } from './middlewares/errorHandler';
import { languageMiddleware } from './middlewares/languageMiddleware';
import prisma from './config/database';
import { initializeWebSocket } from './websocket';

// Routes
import authRoutes from './routes/authRoutes';
import ownerRoutes from './routes/ownerRoutes';
import petRoutes from './routes/petRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import userRoutes from './routes/userRoutes';
import auditRoutes from './routes/auditRoutes';
import roleRoutes from './routes/roleRoutes';
import medicalRecordRoutes from './routes/medicalRecordRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import reportRoutes from './routes/reportRoutes';
import serviceProductRoutes from './routes/serviceProductRoutes';
import invoiceRoutes from './routes/invoiceRoutes';
import profileRoutes from './routes/profileRoutes';
import uploadRoutes from './routes/uploadRoutes';
import smsRoutes from './routes/smsRoutes';
import whatsappRoutes from './routes/whatsappRoutes';
import reminderRoutes from './routes/reminderRoutes';
import emailRoutes from './routes/emailRoutes';
import shiftRoutes from './routes/shiftRoutes';
import visitTypeRoutes from './routes/visitTypeRoutes';
import customerPortalRoutes from './routes/customerPortalRoutes';
import notificationRoutes from './routes/notificationRoutes';
import formRoutes from './routes/formRoutes';
import clinicSettingsRoutes from './routes/clinicSettingsRoutes';
import publicFormRoutes from './routes/publicFormRoutes';
import boardingRoutes from './routes/boardingRoutes';
import importRoutes from './routes/importRoutes';

// Jobs
import { reminderScheduler } from './jobs/reminderScheduler';
import { reservationCleanupJob } from './jobs/reservationCleanup';

const app = express();
const httpServer = createServer(app);

// Initialize WebSocket
const io = initializeWebSocket(httpServer);

// Middleware
app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(languageMiddleware);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'FluffNwoof API is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/owners', ownerRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/service-products', serviceProductRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/visit-types', visitTypeRoutes);
app.use('/api/portal', customerPortalRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/clinic-settings', clinicSettingsRoutes);
app.use('/api/public/forms', publicFormRoutes);
app.use('/api/boarding', boardingRoutes);
app.use('/api/import', importRoutes);

// 404 Handler
app.use(notFound);

// Error Handler
app.use(errorHandler);

// Start server
const PORT = typeof config.port === 'string' ? parseInt(config.port, 10) : config.port;

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📍 Environment: ${config.nodeEnv}`);
      console.log(`🔗 API URL: http://localhost:${PORT}`);
      console.log(`📱 Mobile accessible on: http://10.0.2.2:${PORT} (Android Emulator)`);
      console.log(`🔌 WebSocket path: /ws`);

      // Start schedulers
      reminderScheduler.start();
      reservationCleanupJob.start();
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down gracefully...');
  reminderScheduler.stop();
  reservationCleanupJob.stop();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n👋 Shutting down gracefully...');
  reminderScheduler.stop();
  reservationCleanupJob.stop();
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
