import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Enable CORS so your Next.js frontend can call this backend
  app.enableCors({
    origin: ['http://localhost:3000'],
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

  // 3. Set global API prefix (e.g., http://localhost:4000/api/...)
  app.setGlobalPrefix('api');

  await app.listen(4000);
  console.log(`NestJS Admin Backend running on: http://localhost:4000/api`);
}
bootstrap();