/**
 * Request body for ATP fetch-qrcode demo endpoint.
 *
 * NOTE: This endpoint is for wiring/testing only. Real flow should call AtpClient
 * from the deposit order service.
 */
export class FetchQrcodeDto {
  outTradeNo!: string;
  amount!: number;
  currency?: string;
  subject?: string;
  notifyUrl?: string;
}
