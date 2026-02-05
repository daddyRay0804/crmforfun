import { Body, Controller, Post } from '@nestjs/common';
import { AtpClient } from './atp.client';

class FetchQrcodeDto {
  outTradeNo!: string;
  amount!: number;
  currency?: string;
  subject?: string;
}

@Controller('payments/atp')
export class AtpController {
  constructor(private readonly atp: AtpClient) {}

  /**
   * Demo endpoint for wiring + parsing.
   * In production, this should be called from deposit order flow, not directly.
   */
  @Post('fetch-qrcode')
  async fetchQrcode(@Body() body: FetchQrcodeDto) {
    const res = await this.atp.fetchQrcode({
      outTradeNo: body.outTradeNo,
      amount: body.amount,
      currency: body.currency,
      subject: body.subject,
    });
    return { data: res };
  }
}
