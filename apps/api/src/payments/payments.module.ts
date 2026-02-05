import { Module } from '@nestjs/common';
import { AtpClient } from './atp/atp.client';
import { AtpController } from './atp/atp.controller';

@Module({
  controllers: [AtpController],
  providers: [AtpClient],
  exports: [AtpClient],
})
export class PaymentsModule {}
