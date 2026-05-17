import app from './app';
import config from './config';
import { connectDB } from './loaders/mongoose';
import { loadFirebase } from './loaders/firebase';

async function startServer(): Promise<void> {
  await connectDB();
  await loadFirebase();

  app.listen(config.PORT, () => {
    console.log(`Server running on port ${config.PORT} in ${config.NODE_ENV} mode`);
  });
}

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

startServer();
