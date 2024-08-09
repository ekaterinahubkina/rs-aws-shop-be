import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use((req, res, next) => {
    console.log(`Original req url: ${req.originalUrl}`);
    next();
  });
  await app.listen(process.env.PORT || 4000);
}
bootstrap();
