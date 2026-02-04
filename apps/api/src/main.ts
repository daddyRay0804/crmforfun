import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  app.enableCors({ origin: true, credentials: true });
  await app.listen(port, '0.0.0.0');
}
bootstrap();
