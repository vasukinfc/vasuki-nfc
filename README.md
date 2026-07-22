# Vasuki NFC Smart Card — Subscription Edition

This is a new, separate Firebase-based smart-card system. It includes:

- Permanent public NFC/QR card URL
- First-year free subscription and ₹499 annual renewal
- Customer login and self-edit panel
- Owner/team dashboard with active, expiring and expired filters
- Manual payment approval and 365-day activation
- PWA installation on phone
- Scan counting, renewal history and support tickets
- Secure role-based Firebase Realtime Database rules

## Setup

1. Create/choose a Firebase project and enable **Email/Password** in Authentication.
2. Copy your Firebase web configuration into `firebase-config.js`.
3. Paste `database.rules.json` into Realtime Database → Rules and publish.
4. In Firebase Authentication create the owner account and each customer account.
5. Copy the owner's Firebase UID and create this database value once:

```json
{
  "roles": {
    "OWNER_FIREBASE_UID": "owner"
  }
}
```

6. Open `owner.html`, sign in as owner and add a customer using the customer's Firebase UID.
7. Host all files together on Firebase Hosting, GitHub Pages or another HTTPS static host.

## Permanent card link

Use this in the NFC chip and QR code:

`https://your-domain.com/index.html?id=CARD_ID`

The URL never changes after recharge. Only its subscription status changes.

## Instant design preview

For the easiest offline preview, double-click `DEMO-SMART-CARD.html`. It works without Firebase or a local server.

Alternatively, run the folder through a local web server and open:

`http://localhost:8000/index.html?demo=1`

The demo mode shows a sample flip card without requiring a Firebase customer record.

## Payment flow

Customer pays ₹499 from the customer panel using Razorpay. The Vasuki NFC backend verifies the signature and activates 365 days automatically. The owner can also use **+365 days** as a manual backup after checking payment.

Cards created before the subscription system have no backend subscription record and are automatically treated as **Legacy Lifetime**. Their existing URL stays active and they never see a recharge requirement.

## Important

- Never store customer passwords in Realtime Database.
- `firebase-config.js` is safe to serve publicly; security comes from Authentication and Database Rules.
- Automated AI chat and WhatsApp reminders require third-party APIs/backend. This version includes FAQ assistance, WhatsApp support and support tickets without paid APIs.
- Google Photos share pages are not direct image files. Prefer a direct HTTPS image URL ending in JPG/PNG/WEBP, or add Firebase Storage upload later.
