import { db, SETTINGS, ref, get, runTransaction, $, cleanPhone, now, registerSW } from "./shared.js";
registerSW();
const params=new URLSearchParams(location.search);
const id=params.get("id")?.trim().toLowerCase();
const demo=params.get("demo")==="1";
$("#support").href=`https://wa.me/${SETTINGS.supportPhone}?text=${encodeURIComponent("Hello Vasuki NFC, I need smart card support.")}`;
$("#renewWa").href=`https://wa.me/${SETTINGS.supportPhone}?text=${encodeURIComponent(`Hello Vasuki NFC, I want to recharge card ${id||""} for ₹${SETTINGS.annualPrice}.`)}`;
function show(which){["#loading","#cardWrap","#expired","#missing"].forEach(x=>$(x).classList.add("hidden"));$(which).classList.remove("hidden")}
function url(v){if(!v)return "#";return /^https?:\/\//i.test(v)?v:`https://${v}`}
function vcard(p){return `BEGIN:VCARD\nVERSION:3.0\nFN:${p.name||""}\nORG:${p.business||""}\nTEL:${p.phone||""}\nEMAIL:${p.publicEmail||p.email||""}\nURL:${p.website||""}\nADR:;;${p.location||p.address||""};;;;\nEND:VCARD`}
function bindOptional(selector,value){
 const element=$(selector);
 if(!value){element.classList.add("hidden");element.removeAttribute("href");return false}
 element.href=url(value);element.classList.remove("hidden");return true;
}
async function safeRead(path){try{return await get(ref(db,path))}catch{return null}}
async function apiSubscription(cardId,timeoutMs=8000){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
 try{
  const response=await fetch(`${SETTINGS.apiBase}/api/card-subscription/${encodeURIComponent(cardId)}`,{cache:"no-store",signal:controller.signal});
  if(!response.ok)throw new Error();
  return await response.json();
 }catch{return null}finally{clearTimeout(timer)}
}
async function boot(){
 if(demo){
  const p={name:"Hem Shankar Agarwal",business:"Vasuki NFC",tagline:"Smart Cards. Smart Future.",phone:"916377393721",whatsapp:"916377393721",website:"https://vasukinfc.in",location:"https://maps.google.com/?q=Jaipur",about:"Premium NFC business cards, smart digital profiles and modern printing solutions.",profileImage:""};
  renderCard(p,true);return;
 }
 if(!id){show("#missing");return}
 const [profileSnap,subSnap]=await Promise.all([safeRead(`publishedProfiles/${id}`),safeRead(`publicSubscriptions/${id}`)]);
 let p=profileSnap?.exists()?profileSnap.val():null,legacy=false;
 if(!p){let legacySnap=await safeRead(`customers/${id}`);if(!legacySnap?.exists())legacySnap=await safeRead(id);if(legacySnap?.exists()){legacy=true;const old=legacySnap.val();p=old.profile||{name:old.name||"",business:old.business||old.businessName||"",phone:old.phone||"",whatsapp:old.whatsapp||old.phone||"",publicEmail:old.email||"",website:old.website||"",location:old.location||"",profileImage:old.profileImage||"",tagline:old.tagline||"Digital Business Card",about:old.about||old.services||"",instagram:old.instagram||old.socialMedia||""}}}
 if(!p){show("#missing");return}
 const firebaseSub=subSnap?.exists()?subSnap.val():null;
 let sub;
 if(legacy){
  sub={plan:"legacy_lifetime",status:"active",lifetime:true};
 }else if(firebaseSub?.lifetime || (firebaseSub?.status==="active" && Number(firebaseSub.expiresAt||0)>now())){
  sub=firebaseSub;
 }else{
  sub=await apiSubscription(id);
  if(!sub)sub=firebaseSub||{status:"expired",lifetime:false,expiresAt:0};
 }
 if(!sub.lifetime && (sub.status!=="active" || Number(sub.expiresAt||0)<now())){show("#expired");return}
 renderCard(p,false);
}
async function renderCard(p,isDemo){
 document.body.dataset.cardTheme=["classic","midnight","royal","emerald"].includes(p.theme)?p.theme:"classic";
 $("#avatar").src=p.profileImage||"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='100%25' height='100%25' fill='%23d5b269'/%3E%3Ctext x='50%25' y='56%25' text-anchor='middle' font-size='80' fill='%23fff'%3EV%3C/text%3E%3C/svg%3E";
 $("#name").textContent=p.name||"Smart Card"; $("#business").textContent=p.business||""; $("#tagline").textContent=p.tagline||"";
 $("#call").href=`tel:+${cleanPhone(p.phone)}`; $("#wa").href=`https://wa.me/${cleanPhone(p.whatsapp||p.phone)}`; $("#web").href=url(p.website); $("#map").href=url(p.location);
 bindOptional("#review",p.googleReview);
 const socialStates=[["#instagram",p.instagram],["#facebook",p.facebook],["#linkedin",p.linkedin],["#youtube",p.youtube]].map(([selector,value])=>bindOptional(selector,value));
 const hasSocial=socialStates.some(Boolean);
 $("#socialLinks").classList.toggle("hidden",!hasSocial);
 $("#save").onclick=()=>{const blob=new Blob([vcard(p)],{type:"text/vcard"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`${p.name||"contact"}.vcf`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
 const scene=$("#scene");let startX=0;const flip=()=>scene.classList.toggle("flipped");scene.onclick=e=>{if(!e.target.closest("a,button"))flip()};scene.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();flip()}};scene.addEventListener("touchstart",e=>startX=e.touches[0].clientX,{passive:true});scene.addEventListener("touchend",e=>{if(Math.abs(e.changedTouches[0].clientX-startX)>45)flip()},{passive:true});$("#flipBtn").onclick=flip;
 $("#share").onclick=async()=>{const data={title:`${p.name||"Smart"} Visiting Card`,text:`Connect with ${p.name||"me"}`,url:location.href};if(navigator.share)await navigator.share(data);else{await navigator.clipboard.writeText(location.href);$("#share").textContent="Link Copied ✓"}};
 if(isDemo){$("#scans").textContent="Demo Preview • Tap or swipe to test the card";}else{try{const result=await runTransaction(ref(db,`scanCounts/${id}`),v=>Number(v||0)+1);$("#scans").textContent=`Card views: ${result.snapshot.val()}`;}catch{$("#scans").textContent=""}}
 show("#cardWrap");
}
boot().catch(()=>show("#missing"));
