import { Module } from '@nestjs/common';
import { WithdrawalRequestsController } from './withdrawal-requests.controller';
import { WithdrawalRequestsService } from './withdrawal-requests.service';

@Module({
  controllers: [WithdrawalRequestsController],
  providers: [WithdrawalRequestsService],
  exports: [WithdrawalRequestsService],
})
export class WithdrawalRequestsModule {}
