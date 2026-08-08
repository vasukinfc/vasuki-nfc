import { auth,db,SETTINGS,ref,get,update,push,requireUser,signOut,$,dateText,statusOf,now,registerSW } from "./shared.js";
registerSW();
let ctx,record,deferred;
const fields=["name","business","phone","whatsapp","publicEmail","website","location","profileImage","tagline","about","instagram","facebook","linkedin","youtube","theme"];

let razorpayPromise;
async function loadRazorpay(){
  if(window.Razorpay)return window.Razorpay;
  if(razorpayPromise)return razorpayPromise;
  razorpayPromise=new Promise((resolve,reject)=>{
    const script=document.createElement("script");
    script.src="https://checkout.razorpay.com/v1/checkout.js";
    script.async=true;
    script.onload=()=>window.Razorpay?resolve(window.Razorpay):reject(new Error("Secure checkout did not load"));
    script.onerror=()=>reject(new Error("Secure checkout could not load. Check your connection and try again."));
    document.head.appendChild(script);
  }).catch(error=>{razorpayPromise=null;throw error});
  return razorpayPromise;
}

async function verifyPayment(path, body, successMessage){
  try{
    const response=await fetch(`${SETTINGS.apiBase}${path}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    const result=await response.json();
    if(!response.ok)throw new Error(result.error||"Payment verification failed");
    await renderSubscription();
    $("#rechargeDialog").close();
    $("#lifetimeDialog").close();
    show(successMessage);
  }catch(error){alert(error.message)}
}

async function fetchSubscription(){
  try{
    const response=await fetch(`${SETTINGS.apiBase}/api/card-subscription/${encodeURIComponent(record.cardId)}`,{cache:"no-store"});
    if(!response.ok) throw new Error("Subscription service unavailable");
    return response.json();
  }catch{
    const local=record.subscription||{};
    if(local.plan==="legacy_lifetime" || (local.lifetime===true && local.verified===true))return {...local,status:"active",lifetime:true,verified:true};
    if(local.verified===true && Number(local.expiresAt||0)>now())return {...local,status:"active",lifetime:false};
    return {status:"expired",lifetime:false,verified:false,expiresAt:Number(local.expiresAt||0)};
  }
}

async function renderSubscription(){
  record.apiSubscription=await fetchSubscription();
  const state=record.apiSubscription.lifetime?"active":record.apiSubscription.status==="active"?statusOf(record.apiSubscription.expiresAt):"expired";
  const paidLifetime=record.apiSubscription.lifetime&&record.apiSubscription.plan!=="legacy_lifetime";
  $("#subStatus").innerHTML=`<span class="badge ${state}">${paidLifetime?"PAID LIFETIME":record.apiSubscription.lifetime?"LEGACY LIFETIME":state==="active"?"ACTIVE":state==="soon"?"EXPIRING SOON":"EXPIRED"}</span>`;
  $("#expiry").textContent=record.apiSubscription.lifetime?"No recharge required":`Valid until: ${dateText(record.apiSubscription.expiresAt)}`;
  $("#planChoices").classList.toggle("hidden",record.apiSubscription.lifetime===true);
  if(paidLifetime)$("#expiry").innerHTML='<div class="paid-lifetime">✓ Lifetime access active<br><small>No future recharge required</small></div>';
}

async function boot(){
  ctx=await requireUser(["customer"]);
  const snapshot=await get(ref(db,`customers/${ctx.user.uid}`));
  if(!snapshot.exists()){alert("Customer profile is not linked. Contact Vasuki NFC.");return}
  record=snapshot.val();
  fields.forEach(key=>{
    const value=record.profile?.[key]||"";
    $("#"+key).value=key==="theme"?({royal:"cream",emerald:"white"}[value]||value||"classic"):value;
  });
  $("#viewCard").href=`index.html?id=${encodeURIComponent(record.cardId)}`;
  await renderSubscription();
}

$("#profileForm").onsubmit=async event=>{
  event.preventDefault();
  if(!record.apiSubscription?.verified || (!record.apiSubscription.lifetime && (record.apiSubscription.status!=="active" || Number(record.apiSubscription.expiresAt||0)<=now()))){alert("A verified active subscription is required before publishing changes.");return}
  const profile={};fields.forEach(key=>profile[key]=$("#"+key).value.trim());
  await update(ref(db),{[`customers/${ctx.user.uid}/profile`]:profile,[`publishedProfiles/${record.cardId}`]:profile});
  record.profile=profile;show("Card changes saved and published.");
};

$("#recharge").onclick=()=>$("#rechargeDialog").showModal();
$("#lifetime").onclick=()=>$("#lifetimeDialog").showModal();
$("#payRecharge").onclick=async()=>{
  try{
    const response=await fetch(`${SETTINGS.apiBase}/api/card-renewal/create-order`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({cardId:record.cardId})});
    const order=await response.json();if(!response.ok)throw new Error(order.error||"Unable to start payment");
    await loadRazorpay();
    const checkout=new Razorpay({key:order.keyId,amount:order.amount,currency:order.currency,name:"Vasuki NFC",description:"Smart Card Annual Recharge",order_id:order.razorpayOrderId,prefill:{email:ctx.user.email||"",contact:record.profile?.phone||""},handler:payment=>verifyPayment("/api/card-renewal/verify-payment",{localRenewalId:order.localRenewalId,...payment},"Payment successful. Smart card activated for 365 days ✅"),theme:{color:"#b88b32"}});
    checkout.open();
  }catch(error){alert(error.message)}
};

$("#payLifetime").onclick=async()=>{
  try{
    const response=await fetch(`${SETTINGS.apiBase}/api/card-lifetime/create-order`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({cardId:record.cardId})});
    const order=await response.json();if(!response.ok)throw new Error(order.error||"Unable to start lifetime payment");
    await loadRazorpay();
    const checkout=new Razorpay({key:order.keyId,amount:order.amount,currency:order.currency,name:"Vasuki NFC",description:"Smart Card Lifetime Access — One-Time Payment",order_id:order.razorpayOrderId,prefill:{email:ctx.user.email||"",contact:record.profile?.phone||""},handler:payment=>verifyPayment("/api/card-lifetime/verify-payment",{localLifetimeId:order.localLifetimeId,...payment},"Payment successful. Lifetime access activated permanently ✅"),theme:{color:"#6b46b5"}});
    checkout.open();
  }catch(error){alert(error.message)}
};

$("#ticketBtn").onclick=()=>$("#ticketDialog").showModal();
$("#sendTicket").onclick=async()=>{const issue=$("#issue").value.trim();if(!issue){alert("Describe the problem.");return}await push(ref(db,"supportTickets"),{uid:ctx.user.uid,cardId:record.cardId,issue,status:"open",createdAt:now()});show("Support ticket created successfully.")};
$("#logout").onclick=()=>signOut(auth).then(()=>location.href="login.html");
function show(text){$("#notice").textContent=text;$("#notice").classList.remove("hidden")}
window.addEventListener("beforeinstallprompt",event=>{event.preventDefault();deferred=event;$("#install").classList.remove("hidden")});
$("#install").onclick=async()=>{if(deferred){deferred.prompt();await deferred.userChoice;deferred=null;$("#install").classList.add("hidden")}};
boot();
