import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, set, get, update } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBg-MhiTCTG56NSSMZNwNVZ8CBOkD1YQ3c",
  authDomain: "vasuki-60ed9.firebaseapp.com", 
  projectId: "vasuki-60ed9",
storageBucket: "vasuki-60ed9.appspot.com",
  messagingSenderId: "233551822151",
  appId: "1:233551822151:web:9f43ad1e97fe6270c26062"
};

const app = initializeApp(firebaseConfig);

const db = getDatabase(app);
const auth = getAuth(app);
const storage = getStorage(app);

export {
  db, ref, set, get, update,
  auth, signInWithEmailAndPassword, onAuthStateChanged, signOut,
  storage, sRef, uploadBytes, getDownloadURL
};
