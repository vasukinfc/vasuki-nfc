# Vasuki NFC 360° Smart Card

Separate static frontend for Vasuki digital cards. Keep this repository separate from the main shopping website because both projects have their own `index.html`, login and service worker.

## Features

- Permanent NFC/QR URL: `index.html?id=PERMANENT_CARD_ID`
- Existing legacy URLs using `?card=`, `?customer=`, `#CARD_ID` or a path Card ID remain supported
- Firebase-first public profile loading, with secure backend fallback for legacy IDs
- 360° front/back flip card, contact sharing, social links and scan count
- Expandable Social Media button with Instagram, Facebook, LinkedIn and YouTube support, including legacy field names
- Verified badge only for an active backend-confirmed subscription
- The blue verified badge is placed on the customer profile photo
- Existing customers remain Legacy Lifetime without changing IDs or URLs
- New cards include the first 365 days; renewal is ₹499/year
- Optional Paid Lifetime upgrade is ₹1,499 once
- No customer-review feature in the smart-card app

## Deploy

1. Deploy this folder to its own static host, preferably `https://card.vasukinfc.in` or the existing GitHub Pages repository.
2. Do not merge these files into the main website repository root.
3. In Firebase Realtime Database, replace the Rules with `database.rules.json` and publish.
4. In Firebase Authentication, create the first owner account.
5. Set its database role once:

```json
{
  "roles": {
    "OWNER_FIREBASE_UID": "owner"
  }
}
```

6. Open `owner.html`, log in, enter the backend admin PIN when prompted, then create customers using email, temporary password and permanent Card ID. The backend creates Firebase Authentication, profile mapping and the free first-year subscription together.

The backend is `https://vasukinfc.in`. It must have MongoDB, Firebase Admin, Razorpay and smart-card CORS environment variables configured as documented in the website project.

## Safe legacy behavior

The public card reads `publishedProfiles/{cardId}` and `publicSubscriptions/{cardId}` first. If an older ID is not available there, the backend resolves the existing Firebase legacy path and marks only that confirmed legacy record as `legacy_lifetime`. Missing or unverified records fail closed and show the renewal/not-found screen; they are never silently granted lifetime access.

## Local preview

Run a static server instead of double-clicking the HTML file:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/index.html?demo=1`. Real Firebase and backend flows still require network access and production configuration.
