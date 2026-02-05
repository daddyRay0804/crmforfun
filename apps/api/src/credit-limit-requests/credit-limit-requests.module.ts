import { Module } from '@nestjs/common';
import { DatabaseModule } from '../db/database.module';
import { CreditLimitRequestsController } from './credit-limit-requests.controller';
import { CreditLimitRequestsService } from './credit-limit-requests.service';

@Module({
  imports: [DatabaseModule],
  controllers: [CreditLimitRequestsController],
  providers: [CreditLimitRequestsService],
})
export class CreditLimitRequestsModule {}
