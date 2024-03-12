import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appConfig } from './lib/db';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { abortOnError: false });
  await app.listen(process.env.PORT, () => {
    // makes it easy to dynamically configure the db \\
    // just create a CLUSTER on atlas cloud, \\
    // pick the URL and add... voila!, you're connected to the DB! \\
    process.on('warning', (e) => console.warn(e.stack));
    console.log(`app is running ${process.env.PORT}`);
    appConfig({ type: 'db' });
  });
}
bootstrap();
