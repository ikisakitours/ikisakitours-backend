import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Dynamic CORS allowing local dev, deployed frontend, and admin panel
  const allowedOrigins = [
    'http://localhost:3000',      // Local laptop frontend
    'http://localhost:3001',      // Local laptop admin panel (if applicable)
    process.env.FRONTEND_URL,     // Production frontend on Vercel
    process.env.ADMINPANEL_URL,   // Production admin panel on Vercel
  ].filter(Boolean) as string[];  // Strips undefined values

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,POST,PUT,DELETE,PATCH',
    credentials: true,
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

  // 4. Dynamic port binding for Vercel dynamic routing
  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`NestJS Admin Backend running on port ${port}`);
}
bootstrap();