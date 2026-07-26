# Vasuki NFC Safe Upgrade V4

## Commercial plan

- New smart card: ₹699
- First year: included
- Annual renewal after the first year: ₹499
- Optional paid lifetime upgrade: ₹1,499 one-time
- Existing legacy customers: lifetime; no recharge required

## What changed

- Four customer-selectable card themes
- Instagram, Facebook, LinkedIn and YouTube links
- Google Review button
- ₹499 renewal text throughout the smart-card app
- ₹1,499 one-time Paid Lifetime checkout option
- Separate `LEGACY LIFETIME` and `PAID LIFETIME` labels
- Legacy Lifetime filter in the owner dashboard
- Existing permanent card URLs and Firebase formats remain supported

## Mandatory backend price change

The Razorpay order amount must always be decided by the backend. Keep the
`vasuki-nfc-website` card-renewal amount at `49900` paise (₹499). Do not
accept an amount sent by the browser.

The lifetime order must be exactly `149900` paise and use separate backend
routes:

- `POST /api/card-lifetime/create-order`
- `POST /api/card-lifetime/verify-payment`

After Razorpay signature verification, store the subscription as:

```json
{
  "status": "active",
  "lifetime": true,
  "plan": "paid_lifetime",
  "expiresAt": null,
  "amount": 1499
}
```

Never activate lifetime access from an unverified browser request.

After deploying the backend, make one ₹499 test payment and confirm:

1. Razorpay Checkout displays ₹499.
2. Payment verification succeeds.
3. The subscription receives 365 days.
4. `/api/health` remains healthy.

## Legacy protection

Do not delete, rename or move old Firebase records. The public loader checks:

1. `/publishedProfiles/CARD_ID`
2. `/customers/CARD_ID`
3. Root-level `/CARD_ID`

Cards found in either legacy location are treated as `legacy_lifetime`.
Their existing NFC/QR URL continues to work and no expiry screen is shown.

## Safe deployment order

1. Back up/export Firebase Realtime Database.
2. Deploy these static files to the `vasuki-nfc` GitHub Pages repository.
3. Verify one old card (for example `?id=hem_1`).
4. Verify a new subscription card.
5. Confirm the backend Razorpay amount is ₹499.
6. Run one live ₹499 payment test.
7. Run one live ₹1,499 lifetime payment test.
8. Confirm the card shows `PAID LIFETIME` and no recharge buttons.
