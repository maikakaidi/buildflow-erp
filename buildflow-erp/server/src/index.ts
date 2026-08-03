import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';

import { config } from './config';
import logger from './config/logger';
import { errorHandler } from './middleware/errorHandler';
import { checkSubscription } from './middleware/subscription';
import prisma from './config/database';

import authRoutes from './routes/auth.routes';
import syncRoutes from './routes/sync.routes';
import superAdminRoutes from './routes/superAdmin.routes';
import moduleRoutes from './routes/modules.routes';
import dashboardRoutes from './routes/dashboard.routes';
import settingsRoutes from './routes/settings.routes';
import uploadRoutes from './routes/upload.routes';
import companyUsersRoutes from './routes/companyUsers.routes';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(cookieParser());
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, message: 'Trop de requêtes, réessayez plus tard' },
});
app.use('/api/', limiter);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

app.use('/api/auth', authRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/modules', checkSubscription, moduleRoutes);
app.use('/api/dashboard', checkSubscription, dashboardRoutes);
app.use('/api/settings', checkSubscription, settingsRoutes);
app.use('/api/company-users', checkSubscription, companyUsersRoutes);

const clientDist = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use(errorHandler);

const start = async () => {
  try {
    await prisma.$connect();
    logger.info('Connecté à PostgreSQL');

    app.listen(config.port, () => {
      logger.info(`BuildFlow ERP API démarré sur le port ${config.port}`);
      logger.info(`Environnement: ${config.nodeEnv}`);
    });
  } catch (error) {
    logger.error('Erreur de démarrage:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

start();

export default app;
