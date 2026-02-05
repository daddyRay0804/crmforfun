import { Injectable, Logger } from '@nestjs/common';
import crypto from 'crypto';

export type AtpFetchQrcodeInput = {
  outTradeNo: string; // merchant order id
  amount: number;
  currency?: string;
  subject?: string;
  notifyUrl?: string;
};

export type AtpFetchQrcodeResult = {
  ok: boolean;
  qrcodeUrl?: string;
  raw?: unknown;
  mock?: boolean;
};

function mustGetEnv(name: string): string | undefined {
  const v = process.env[name];
  if (!v) return undefined;
  return String(v);
}

/**
 * ATP ToPay (Out) client.
 *
 * NOTE: Vendor signature algorithm/field names may differ.
 * This wrapper is intentionally conservative:
 * - never logs secrets
 * - supports a mock response when env is not configured
 */
@Injectable()
export class AtpClient {
  private readonly logger = new Logger(AtpClient.name);

  private baseUrl(): string {
    return mustGetEnv('ATP_BASE_URL') ?? 'https://atptopay.atptrade.site';
  }

  private merchantId(): string | undefined {
    return mustGetEnv('ATP_MERCHANT_ID');
  }

  private orderSecret(): string | undefined {
    return mustGetEnv('ATP_ORDER_SECRET');
  }

  /**
   * A generic signing helper: sort keys asc, join as k=v&..., then HMAC-SHA256.
   * Replace when ATP confirms exact signing rules.
   */
  private sign(payload: Record<string, unknown>, secret: string): string {
    const pairs = Object.keys(payload)
      .filter((k) => payload[k] !== undefined && payload[k] !== null && payload[k] !== '')
      .sort()
      .map((k) => `${k}=${String(payload[k])}`);
    const msg = pairs.join('&');
    return crypto.createHmac('sha256', secret).update(msg).digest('hex');
  }

  verifyNotify(payload: Record<string, unknown>): { ok: boolean; reason?: string; verified?: boolean } {
    const secret = this.orderSecret() ?? mustGetEnv('ATP_NOTIFY_SECRET');
    const provided = (payload.sign ?? payload.signature) as string | undefined;

    // If secret is not configured, we can't verify. For demo we accept but mark unverified.
    if (!secret) return { ok: true, verified: false, reason: 'ATP notify secret not configured' };

    if (!provided) return { ok: false, reason: 'Missing signature' };

    const toSign: Record<string, unknown> = { ...payload };
    delete (toSign as any).sign;
    delete (toSign as any).signature;

    const expected = this.sign(toSign, secret);
    if (String(provided) !== String(expected)) return { ok: false, reason: 'Bad signature' };

    return { ok: true, verified: true };
  }

  async fetchQrcode(input: AtpFetchQrcodeInput): Promise<AtpFetchQrcodeResult> {
    const merchantId = this.merchantId();
    const orderSecret = this.orderSecret();

    // No env configured -> return mock (safe for demo).
    if (!merchantId || !orderSecret) {
      return {
        ok: true,
        mock: true,
        qrcodeUrl: `https://example.com/mock-qrcode?outTradeNo=${encodeURIComponent(input.outTradeNo)}`,
        raw: { reason: 'ATP env not configured' },
      };
    }

    const notifyUrl = input.notifyUrl ?? mustGetEnv('ATP_NOTIFY_URL');

    const payload: Record<string, unknown> = {
      merchantId,
      outTradeNo: input.outTradeNo,
      amount: Number(input.amount),
      currency: (input.currency ?? 'CNY').toUpperCase(),
      subject: input.subject ?? 'deposit',
      notifyUrl,
      ts: Date.now(),
    };

    const signature = this.sign(payload, orderSecret);

    // Many vendors expect `sign` or `signature` field.
    // We include both for compatibility; ATP spec should decide one.
    const body = { ...payload, sign: signature, signature };

    const url = `${this.baseUrl()}/api/payment/Out/fetchQrcode`;

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

    const text = await resp.text();
    let json: any = undefined;
    try {
      json = JSON.parse(text);
    } catch {
      json = { text };
    }

    if (!resp.ok) {
      this.logger.warn(`ATP fetchQrcode failed: http ${resp.status}`);
      return { ok: false, raw: json };
    }

    // Try common response shapes.
    const qrcodeUrl =
      json?.data?.qrcodeUrl ??
      json?.data?.qrcode_url ??
      json?.qrcodeUrl ??
      json?.qrcode_url ??
      json?.data?.url ??
      json?.url;

    return {
      ok: true,
      qrcodeUrl: typeof qrcodeUrl === 'string' ? qrcodeUrl : undefined,
      raw: json,
    };
  }
}
