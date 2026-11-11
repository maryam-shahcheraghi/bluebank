import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module.js';
import { loadEnvironment } from './environment.js';

async function bootstrap() {
  const { port, host, origins } = loadEnvironment();
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { abortOnError: false },
  );
  app.enableShutdownHooks();
  app.useSecurityHeaders();
  if (origins.length > 0) {
    app.enableCors({ origin: origins, credentials: false });
  }
  await app.listen(port, host);
}

bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
