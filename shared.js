import { auth, db, SETTINGS } from "./firebase-config.js";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { ref, get, set, update, push, runTransaction } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

export { auth, db, SETTINGS, ref, get, set, update, push, runTransaction, onAuthStateChanged, signInWithEmailAndPassword, signOut };
export const $ = (s, root=document) => root.querySelector(s);
export const $$ = (s, root=document) => [...root.querySelectorAll(s)];
export const esc = value => String(value ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
export const now = () => Date.now();
export const days = n => n * 86400000;
export const dateText = ms => ms ? new Date(ms).toLocaleDateString("en-IN", {day:"2-digit",month:"short",year:"numeric"}) : "—";
export const statusOf = expiry => !expiry || expiry < now() ? "expired" : expiry - now() <= days(30) ? "soon" : "active";
export const cleanPhone = value => String(value || "").replace(/\D/g, "");
export async function roleOf(uid){ const snap=await get(ref(db,`roles/${uid}`)); return snap.val() || "customer"; }
export async function requireUser(roles=[]){
  return new Promise(resolve => onAuthStateChanged(auth, async user => {
    if(!user){ location.href="login.html"; return; }
    const role=await roleOf(user.uid);
    if(roles.length && !roles.includes(role)){ alert("You do not have permission for this page."); location.href="login.html"; return; }
    resolve({user,role});
  }));
}
export function registerSW(){ if("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(()=>{}); }

