import * as dotenv from 'dotenv';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import movieRoutes from './routes/movies';

dotenv.config();

const app: Express = express();
const port = parseInt(process.env.PORT || '8083');

// Middleware
app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS || '*').split(',')
}));
app.use(express.json());

// Connect to MongoDB
if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI not defined in .env");
  process.exit(1);
}
mongoose.connect(process.env.MONGO_URI as string)
  .then(() => console.log(`${process.env.SERVICE_NAME} connected to MongoDB`))
  .catch((err: Error) => console.error('MongoDB connection error:', err.message));

// Routes
app.use('/api/movies', movieRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', service: process.env.SERVICE_NAME });
});

app.listen(port, () => {
  console.log(`${process.env.SERVICE_NAME} running on port ${port}`);
});