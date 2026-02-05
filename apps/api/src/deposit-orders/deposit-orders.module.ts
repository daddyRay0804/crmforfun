import { Module } from '@nestjs/common';
import { DatabaseModule } from '../db/database.module';
import { DepositOrdersController } from './deposit-orders.controller';
import { DepositOrdersService } from './deposit-orders.service';

@Module({
  imports: [DatabaseModule],
  controllers: [DepositOrdersController],
  providers: [DepositOrdersService],
  exports: [DepositOrdersService],
})
export class DepositOrdersModule {}
