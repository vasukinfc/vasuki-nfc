# Backend contract for ₹1,499 one-time Lifetime Access

This static app expects two secure routes on `SETTINGS.apiBase`.

## 1. Create order

`POST /api/card-lifetime/create-order`

Request:

```json
{ "cardId": "customer_card_id" }
```

The backend must:

1. Validate that the card exists.
2. Refuse the request if it is already lifetime.
3. Create a Razorpay order for exactly `149900` paise.
4. Save a pending lifetime-payment record on the server.
5. Return:

```json
{
  "keyId": "public_razorpay_key_id",
  "amount": 149900,
  "currency": "INR",
  "razorpayOrderId": "order_...",
  "localLifetimeId": "server_record_id"
}
```

## 2. Verify payment

`POST /api/card-lifetime/verify-payment`

Request:

```json
{
  "localLifetimeId": "server_record_id",
  "razorpay_payment_id": "pay_...",
  "razorpay_order_id": "order_...",
  "razorpay_signature": "..."
}
```

The backend must:

1. Load the pending record by `localLifetimeId`.
2. Confirm its amount is exactly `149900`.
3. Verify the Razorpay HMAC signature with `RAZORPAY_KEY_SECRET`.
4. Prevent reuse of the same payment/order.
5. Set the card subscription to:

```json
{
  "status": "active",
  "lifetime": true,
  "plan": "paid_lifetime",
  "expiresAt": null,
  "amount": 1499
}
```

6. Return the verified lifetime subscription.

The existing public subscription endpoint must return `lifetime: true` and
`plan: "paid_lifetime"` for this card. Existing `legacy_lifetime` records
must not be changed.
