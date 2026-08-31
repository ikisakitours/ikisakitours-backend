import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  //const app = await NestFactory.create(AppModule);
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set('trust proxy', 1);

  app.use(cookieParser());

  // 1. Dynamic CORS allowing local dev, deployed frontend, apex domain, and admin panel
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, Postman, or server-to-server calls)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://www.ikisakitours.com',
        'https://ikisakitours.com',
        'https://ikisakitours-admin-panel.vercel.app',
        process.env.FRONTEND_URL,
        process.env.ADMINPANEL_URL,
      ].filter(Boolean) as string[];

      if (allowedOrigins.includes(origin) || 
        origin.endsWith('.ikisakitours.com') ||
        origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }

      return callback(new Error('Blocked by CORS policy'));
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'x-admin-key',],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // 2. Enable global validation and automatic query parameter transformation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // 3. Set global API prefix
  app.setGlobalPrefix('api');

  // 4. Dynamic port binding for local dev and serverless runtime
  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`NestJS Admin Backend running on port ${port}`);
}
bootstrap();