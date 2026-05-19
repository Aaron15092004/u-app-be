import express from 'express';
import { loadExpress } from './loaders/express';
import healthRouter from './api/health/health.routes';
import uploadTestRouter from './api/health/upload-test.routes';
import notificationRouter from './api/notifications/notification.routes';
import authRouter from './api/auth/auth.routes';
import exercisesRouter from './api/exercises/exercises.routes';
import workoutsRouter from './api/workouts/workouts.routes';
import habitsRouter from './api/habits/habits.routes';
import bmiRouter from './api/bmi/bmi.routes';
import foodRouter from './api/food/food.routes';
import waterRouter from './api/water/water.routes';
import { errorMiddleware } from './middleware/error.middleware';

const app = express();

loadExpress(app);

app.use('/api/health', healthRouter);
app.use('/api/upload/test', uploadTestRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/auth', authRouter);
app.use('/api/exercises', exercisesRouter);
app.use('/api/workouts', workoutsRouter);
app.use('/api/habits', habitsRouter);
app.use('/api/bmi', bmiRouter);
app.use('/api/food', foodRouter);
app.use('/api/water', waterRouter);

app.use(errorMiddleware);

export default app;
