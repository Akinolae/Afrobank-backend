import { Module } from '@nestjs/common';
import { AppController } from './Controllers/app.controller';
import { AuthController } from './Controllers/auth.controller';
import { AppService } from './Services/app.service';
import { AuthService } from './Services/auth.service';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [ConfigModule.forRoot(), CacheModule.register()],
  controllers: [AppController, AuthController],
  providers: [AppService, AuthService],
})
export class AppModule {}
