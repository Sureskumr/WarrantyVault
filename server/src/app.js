import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';

import { env } from './config/env.js';
import { morganStream } from './config/logger.js';
import apiV1Router from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiters.js';
import { sendSuccess } from './utils/apiResponse.js';

export const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev', { stream: morganStream }));
app.use('/api', apiLimiter);

app.get('/health', (req, res) => sendSuccess(res, { message: 'DigiWarranty API is healthy', data: { env: env.NODE_ENV } }));

app.use('/api/v1', apiV1Router);

app.use(notFoundHandler);
app.use(errorHandler);
