# ATP ToPay (Out) integration notes

## Endpoints (from user)
- Signature test UI: https://atptopay.atptrade.site/#/out-signature-test
- Create order / fetch QRCode: https://atptopay.atptrade.site/api/payment/Out/fetchQrcode (POST)
- Docs: https://atptopay.atptrade.site/#/out-doc
- Anonymous order query UI: https://atptopay.atptrade.site/#/out-transfer?secretKey=***

## IP allowlist
- 47.82.100.193
- 8.209.254.191

## Secrets
Stored **outside git**. Use env vars:
- ATP_MERCHANT_ID
- ATP_ORDER_SECRET
- ATP_CALLBACK_SECRET

Never commit or log these values.
