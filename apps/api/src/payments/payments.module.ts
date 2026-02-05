import { Module } from '@nestjs/common';
import { DepositOrdersModule } from '../deposit-orders/deposit-orders.module';
import { AtpClient } from './atp/atp.client';
import { AtpController } from './atp/atp.controller';

@Module({
  imports: [DepositOrdersModule],
  controllers: [AtpController],
  providers: [AtpClient],
  exports: [AtpClient],
})
export class PaymentsModule {}
