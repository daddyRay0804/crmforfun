import { Module } from '@nestjs/common';
import { DatabaseModule } from '../db/database.module';
import { CreditLimitsController } from './credit-limits.controller';
import { CreditLimitsService } from './credit-limits.service';

@Module({
  imports: [DatabaseModule],
  controllers: [CreditLimitsController],
  providers: [CreditLimitsService],
  exports: [CreditLimitsService],
})
export class CreditLimitsModule {}
