import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AgentsModule } from './agents/agents.module';
import { AuthModule } from './auth/auth.module';
import { UsersAdminModule } from './users/users-admin.module';

@Module({
  imports: [AuthModule, AgentsModule, UsersAdminModule],
  controllers: [AppController],
})
export class AppModule {}
