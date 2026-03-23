// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBg-MhiTCTG56NSSMZNwNVZ8CBOkD1YQ3c",
  authDomain: "vasuki-60ed9.firebaseapp.com",
  databaseURL: "https://vasuki-60ed9-default-rtdb.firebaseio.com",
  projectId: "vasuki-60ed9",
  storageBucket: "vasuki-60ed9.firebasestorage.app",
  messagingSenderId: "233551822151",
  appId: "1:233551822151:web:9f43ad1e97fe6270c26062",
  measurementId: "G-FKD654MJF5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
