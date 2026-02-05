export class AtpNotifyDto {
  // Merchant order id (usually our deposit order id)
  outTradeNo!: string;

  // Vendor order id (optional)
  tradeNo?: string;

  // Payment status (vendor-specific)
  status?: string;
  tradeStatus?: string;

  amount?: number;
  currency?: string;

  // signature fields (vendor-specific)
  sign?: string;
  signature?: string;

  // allow any extra fields without strict validation
  [k: string]: any;
}
