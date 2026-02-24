import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { appConfig } from './config/app.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Helpful for local demo + debugging tools.
  app.enableCors();

  // Serve demo profile pictures (seeded as http(s)://<host>/pfps/...).
  app.useStaticAssets(join(process.cwd(), 'public'));

  await app.listen(appConfig.apiPort);
}
bootstrap();
