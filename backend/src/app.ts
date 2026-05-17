import express from 'express';
import { loadExpress } from './loaders/express';
import healthRouter from './api/health/health.routes';
import { errorMiddleware } from './middleware/error.middleware';

const app = express();

loadExpress(app);

app.use('/api/health', healthRouter);

app.use(errorMiddleware);

export default app;
