import { Module } from '@nestjs/common';
import { RolesGuard } from '../auth/roles.guard';
import { DatabaseModule } from '../db/database.module';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AgentsController],
  providers: [AgentsService, RolesGuard],
})
export class AgentsModule {}
