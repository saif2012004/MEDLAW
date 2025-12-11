import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from './middleware/rateLimit';
import authMiddleware from './middleware/auth';
import llmRouter from './routes/llm';
import authRouter from './routes/auth';
import userRouter from './routes/user';
import dashboardRouter from './routes/dashboard';
import monitoringRouter from './routes/monitoring';
import bridgeRouter from './routes/bridge';
import queryRouter from './routes/query';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));
app.use(rateLimit);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'MedLaw Backend', timestamp: new Date().toISOString() });
});

app.use('/api/llm', llmRouter);
app.use('/api/auth', authRouter);
app.use('/api/query', queryRouter);

app.use(authMiddleware);
app.use('/api/user', userRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/monitoring', monitoringRouter);
app.use('/api/rag', bridgeRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log('MedLaw backend listening on http://localhost:' + PORT);
});

export default app;
