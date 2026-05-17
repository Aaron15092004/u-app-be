import express from 'express';
import { loadExpress } from './loaders/express';
import healthRouter from './api/health/health.routes';
import uploadTestRouter from './api/health/upload-test.routes';
import notificationRouter from './api/notifications/notification.routes';
import { errorMiddleware } from './middleware/error.middleware';

const app = express();

loadExpress(app);

app.use('/api/health', healthRouter);
app.use('/api/upload/test', uploadTestRouter);
app.use('/api/notifications', notificationRouter);

app.use(errorMiddleware);

export default app;
