import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, set, get, update } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
apiKey: "AIzaSyBGHfGSGZsdiIrAUmJxPkXJmCLuAk4ctYE",
authDomain: "vasuki-nfc-d93db.firebaseapp.com",
databaseURL: "https://vasuki-nfc-d93db-default-rtdb.firebaseio.com",
projectId: "vasuki-nfc-d93db",
storageBucket: "vasuki-nfc-d93db.appspot.com",
messagingSenderId: "159152694151",
appId: "1:159152694151:web:e5b306ac03edb60f8de922"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, set, get, update };
