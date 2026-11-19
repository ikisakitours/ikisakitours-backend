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
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      /\.vercel\.app$/,
      process.env.FRONTEND_URI,
      process.env.FRONTEND_URL,
      process.env.ADMINPANEL_URL,
      'https://www.ikisakitours.com',
      'https://ikisakitours.com',
    ].filter(Boolean) as (string | RegExp)[],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-admin-key',
      'Accept',
      'X-Requested-With',
    ],
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
