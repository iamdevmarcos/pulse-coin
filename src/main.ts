import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { WsAdapter } from '@nestjs/platform-ws';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useWebSocketAdapter(new WsAdapter(app));
  
  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  console.log(`\nPulseCoin is running at http://localhost:${port}`);
  console.log(`WebSocket endpoint: ws://localhost:${port}/prices\n`);
}

bootstrap();
