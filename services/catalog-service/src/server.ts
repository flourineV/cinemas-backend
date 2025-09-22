import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

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
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Service info route
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'Catalog Service',
    version: '1.0.0',
    description: 'Microservice for movies, cinemas, and showtimes management',
    timestamp: new Date().toISOString(),
  });
});

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    service: 'catalog-service',
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Movies routes
app.get('/movies', (req: Request, res: Response) => {
  res.json({
    message: 'Get all movies',
    data: [],
    // TODO: Implement get movies logic
  });
});

app.get('/movies/:id', (req: Request, res: Response) => {
  res.json({
    message: 'Get movie by ID',
    movieId: req.params.id,
    // TODO: Implement get movie by ID logic
  });
});

app.post('/movies', (req: Request, res: Response) => {
  res.json({
    message: 'Create new movie',
    // TODO: Implement create movie logic
  });
});

// Cinemas routes
app.get('/cinemas', (req: Request, res: Response) => {
  res.json({
    message: 'Get all cinemas',
    data: [],
    // TODO: Implement get cinemas logic
  });
});

app.get('/cinemas/:id', (req: Request, res: Response) => {
  res.json({
    message: 'Get cinema by ID',
    cinemaId: req.params.id,
    // TODO: Implement get cinema by ID logic
  });
});

// Showtimes routes
app.get('/showtimes', (req: Request, res: Response) => {
  res.json({
    message: 'Get showtimes',
    data: [],
    // TODO: Implement get showtimes logic
  });
});

app.get('/showtimes/movie/:movieId', (req: Request, res: Response) => {
  res.json({
    message: 'Get showtimes for movie',
    movieId: req.params.movieId,
    // TODO: Implement get showtimes by movie logic
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong in Catalog Service!',
    ...(process.env.NODE_ENV === 'development' && { error: err.message }),
  });
});

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`🎬 Catalog Service running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});