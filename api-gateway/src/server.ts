import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';

// Load environment variables
dotenv.config();

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Higher limit for gateway
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Gateway info route
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'Cinema API Gateway',
    version: '1.0.0',
    description: 'Gateway for Cinema microservices',
    services: {
      auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
      catalog: process.env.CATALOG_SERVICE_URL || 'http://localhost:3002',
    },
    timestamp: new Date().toISOString(),
  });
});

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    service: 'api-gateway',
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Auth service proxy
app.use('/api/auth', (req, res, next) => {
  console.log(`🔐 Proxying ${req.method} ${req.url} to Auth Service`);
  next();
}, createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '', // Remove /api/auth prefix when forwarding
  },
}));

// Catalog service proxy
app.use('/api/catalog', (req, res, next) => {
  console.log(`🎬 Proxying ${req.method} ${req.url} to Catalog Service`);
  next();
}, createProxyMiddleware({
  target: process.env.CATALOG_SERVICE_URL || 'http://localhost:3002',
  changeOrigin: true,
  pathRewrite: {
    '^/api/catalog': '', // Remove /api/catalog prefix when forwarding
  },
}));

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      '/api/auth/*',
      '/api/catalog/*',
      '/health',
    ],
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Gateway error occurred!',
    ...(process.env.NODE_ENV === 'development' && { error: err.message }),
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🌐 API Gateway running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Auth Service: ${process.env.AUTH_SERVICE_URL || 'http://localhost:3001'}`);
  console.log(`🔗 Catalog Service: ${process.env.CATALOG_SERVICE_URL || 'http://localhost:3002'}`);
});