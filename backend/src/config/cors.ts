import { CorsOptions } from 'cors';
import config from './index';

export const corsOptions: CorsOptions = {
  origin: config.ALLOWED_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
};
