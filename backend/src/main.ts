import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;
  const frontendUrl = configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
  const backendUrl = configService.get<string>('BACKEND_URL');

  // Security middleware
  app.use(helmet());
  app.use(cookieParser());

  // CORS configuration - Allow frontend and backend URLs
  const allowedOrigins = [
    frontendUrl,
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3001',
  ];

  // Add backend URL if provided (for production)
  if (backendUrl) {
    allowedOrigins.push(backendUrl);
  }

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, or curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // No global prefix - routes define their own paths
  // This allows /auth/* to work directly from frontend

  await app.listen(port);

  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   🚀 ExpenseAI Backend is running!                            ║
║                                                                ║
║   📍 Server:     http://localhost:${port}                         ║
║   🔗 API:        http://localhost:${port}/api                     ║
║   🌐 Frontend:   ${frontendUrl}                    ║
║   📊 Health:     http://localhost:${port}/api/health              ║
║                                                                ║
║   Environment:   ${configService.get('NODE_ENV')}                               ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
