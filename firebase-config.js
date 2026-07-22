import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

// Replace these values with Firebase Console > Project settings > Your apps.
const firebaseConfig = {
  apiKey: "AIzaSyBg-MhiTCTG56NSSMZNwNVZ8CBOkD1YQ3c",
  authDomain: "vasuki-60ed9.firebaseapp.com",
  databaseURL: "https://vasuki-60ed9-default-rtdb.firebaseio.com",
  projectId: "vasuki-60ed9",
  storageBucket: "vasuki-60ed9.appspot.com",
  messagingSenderId: "233551822151",
  appId: "1:233551822151:web:9f43ad1e97fe6270c26062"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

export const SETTINGS = {
  brand: "Vasuki NFC",
  annualPrice: 499,
  supportPhone: "916377393721",
  supportEmail: "support@vasukinfc.in",
  website: "https://vasukinfc.in",
  apiBase: "https://vasukinfc.in"
};
