import { NestFactory } from '@nestjs/core';
import { ValidationPipe, INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';

let app: INestApplication;

async function bootstrap() {
  if (!app) {
    app = await NestFactory.create(AppModule, { bodyParser: true });
    app.enableCors({ origin: true, credentials: true });
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
  }
  return app;
}

export default async (req: any, res: any) => {
  const nestApp = await bootstrap();
  const instance = nestApp.getHttpAdapter().getInstance();
  instance(req, res);
};
