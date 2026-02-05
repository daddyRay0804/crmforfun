import { Module } from '@nestjs/common';
import { RolesGuard } from '../auth/roles.guard';
import { DatabaseModule } from '../db/database.module';
import { UsersAdminController } from './users-admin.controller';
import { UsersAdminService } from './users-admin.service';

@Module({
  imports: [DatabaseModule],
  controllers: [UsersAdminController],
  providers: [UsersAdminService, RolesGuard],
})
export class UsersAdminModule {}
