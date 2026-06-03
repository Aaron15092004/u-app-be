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
import campaignsRouter from './api/campaigns/campaigns.routes';
import recommendationsRouter from './api/recommendations/recommendations.routes';
import ratingsRouter from './api/ratings/ratings.routes';
import waterRouter from './api/water/water.routes';
import homeRouter from './api/home/home.routes';
import configRouter from './api/config/config.routes';
import usersRouter from './api/users/users.routes';
import adminRouter from './api/admin/admin.routes';
import iapRouter from './api/iap/iap.routes';
import workoutProgramsRouter from './api/workout-programs/workout-programs.routes';
import workoutSessionsRouter from './api/workout-sessions/workout-sessions.routes';
import workoutProgramsAdminRouter from './api/workout-programs/workout-programs-admin.routes';
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
app.use('/api/campaigns', campaignsRouter);
app.use('/api/recommendations', recommendationsRouter);
app.use('/api/ratings', ratingsRouter);
app.use('/api/water', waterRouter);
app.use('/api/home', homeRouter);
app.use('/api/config', configRouter);
app.use('/api/users', usersRouter);
app.use('/api/admin', adminRouter);
app.use('/api/iap', iapRouter);
app.use('/api/workout-programs', workoutProgramsRouter);
app.use('/api/workout-sessions', workoutSessionsRouter);
app.use('/api/admin/programs', workoutProgramsAdminRouter);

app.use(errorMiddleware);

export default app;
