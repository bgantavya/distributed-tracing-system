import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import passport from 'passport';
import session from 'express-session';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { tracingMiddleware } from './src/middleware/tracing.js';
import { samplingMiddleware } from './src/middleware/sampler.js';
import { processInfoMiddleware } from './src/middleware/processInfo.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import traceRoutes from './src/routes/traces.js';
import authRoutes from './src/routes/auth.js';

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

app.use(session({
  secret: process.env.JWT_SECRET || 'session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(tracingMiddleware);
app.use(processInfoMiddleware);
app.use(samplingMiddleware);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://harshita_garg_db_user:harshita_2535@cluster0.gvxuvem.mongodb.net/tracing_db';

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

mongoose.connection.on('error', err => console.error('MongoDB error:', err));
mongoose.connection.on('disconnected', () => console.log('MongoDB disconnected'));

app.use('/api/traces', traceRoutes);
app.use('/api/auth', authRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', pid: process.pid });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} (PID: ${process.pid})`);
});

export default app;
