import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { DepositOrdersService } from '../../deposit-orders/deposit-orders.service';
import { AtpClient } from './atp.client';
import { FetchQrcodeDto } from './dto/fetch-qrcode.dto';
import { AtpNotifyDto } from './dto/notify.dto';

@Controller('payments/atp')
export class AtpController {
  constructor(
    private readonly atp: AtpClient,
    private readonly deposits: DepositOrdersService,
  ) {}

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
      notifyUrl: body.notifyUrl,
    });
    return { data: res };
  }

  /**
   * ATP async notify callback.
   * Must be public (no auth), but signature verification + idempotency are required.
   */
  @Post('notify')
  async notify(@Body() body: AtpNotifyDto) {
    const v = this.atp.verifyNotify(body);
    if (!v.ok) throw new UnauthorizedException(v.reason ?? 'notify verification failed');

    const outTradeNo = String(body.outTradeNo ?? '').trim();
    if (!outTradeNo) throw new UnauthorizedException('Missing outTradeNo');

    const result = await this.deposits.markPaidFromAtpNotify({
      outTradeNo,
      tradeNo: body.tradeNo,
      status: body.status ?? body.tradeStatus,
      amount: body.amount,
      currency: body.currency,
      verified: v.verified ?? false,
    });

    // Most vendors accept any 200 as ACK.
    return { ok: true, ...result };
  }
}
