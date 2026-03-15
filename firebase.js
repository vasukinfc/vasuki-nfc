import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBGHfGSGZsdiIrAUmJxPkXJmCLuAk4ctYE",
  authDomain: "vasuki-nfc-d93db.firebaseapp.com",
  databaseURL: "https://vasuki-nfc-d93db-default-rtdb.firebaseio.com",
  projectId: "vasuki-nfc-d93db",
  storageBucket: "vasuki-nfc-d93db.firebasestorage.app",
  messagingSenderId: "159152694151",
  appId: "1:159152694151:web:e5b306ac03edb60f8de922",
  measurementId: "G-YR12LK0NB4"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, set };
