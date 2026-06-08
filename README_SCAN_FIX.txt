Agar scan count phir bhi update nahi ho, Firebase Console > Realtime Database > Rules me scans ke liye write allow karo.

Example rules:

{
  "rules": {
    "customers": {
      "$customerId": {
        ".read": true,
        ".write": "auth != null",
        "scans": {
          ".write": "auth != null || (newData.isNumber() && newData.val() >= 0)"
        }
      }
    }
  }
}

Note:
index.html aur firebase.js ko apni website me replace karo.
Replace ke baad browser me Ctrl + Shift + R karke hard refresh karo.
