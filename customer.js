import { auth,db,SETTINGS,ref,get,update,push,requireUser,signOut,$,dateText,statusOf,now,registerSW } from "./shared.js";
registerSW();
let ctx,record,deferred;
const fields=["name","business","phone","whatsapp","publicEmail","website","location","profileImage","tagline","about"];

async function fetchSubscription(){
  try{
    const response=await fetch(`${SETTINGS.apiBase}/api/card-subscription/${encodeURIComponent(record.cardId)}`,{cache:"no-store"});
    if(!response.ok) throw new Error("Subscription service unavailable");
    return response.json();
  }catch{
    return record.subscription?.expiresAt
      ? {status:statusOf(record.subscription.expiresAt),expiresAt:record.subscription.expiresAt,lifetime:false}
      : {status:"active",lifetime:true,plan:"legacy_lifetime"};
  }
}

async function renderSubscription(){
  record.apiSubscription=await fetchSubscription();
  const state=record.apiSubscription.lifetime?"active":record.apiSubscription.status==="active"?statusOf(record.apiSubscription.expiresAt):"expired";
  $("#subStatus").innerHTML=`<span class="badge ${state}">${record.apiSubscription.lifetime?"LEGACY LIFETIME":state==="active"?"ACTIVE":state==="soon"?"EXPIRING SOON":"EXPIRED"}</span>`;
  $("#expiry").textContent=record.apiSubscription.lifetime?"No recharge required":`Valid until: ${dateText(record.apiSubscription.expiresAt)}`;
  $("#recharge").classList.toggle("hidden",record.apiSubscription.lifetime===true);
}

async function boot(){
  ctx=await requireUser(["customer"]);
  const snapshot=await get(ref(db,`customers/${ctx.user.uid}`));
  if(!snapshot.exists()){alert("Customer profile is not linked. Contact Vasuki NFC.");return}
  record=snapshot.val();
  fields.forEach(key=>$("#"+key).value=record.profile?.[key]||"");
  $("#viewCard").href=`index.html?id=${encodeURIComponent(record.cardId)}`;
  await renderSubscription();
}

$("#profileForm").onsubmit=async event=>{
  event.preventDefault();
  if(!record.apiSubscription?.lifetime && record.apiSubscription?.status!=="active"){alert("Recharge is required before publishing changes.");return}
  const profile={};fields.forEach(key=>profile[key]=$("#"+key).value.trim());
  await update(ref(db),{[`customers/${ctx.user.uid}/profile`]:profile,[`publishedProfiles/${record.cardId}`]:profile});
  record.profile=profile;show("Card changes saved and published.");
};

$("#recharge").onclick=()=>$("#rechargeDialog").showModal();
$("#payRecharge").onclick=async()=>{
  try{
    const response=await fetch(`${SETTINGS.apiBase}/api/card-renewal/create-order`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({cardId:record.cardId})});
    const order=await response.json();if(!response.ok)throw new Error(order.error||"Unable to start payment");
    const checkout=new Razorpay({key:order.keyId,amount:order.amount,currency:order.currency,name:"Vasuki NFC",description:"Smart Card Annual Recharge",order_id:order.razorpayOrderId,prefill:{email:ctx.user.email||"",contact:record.profile?.phone||""},handler:async payment=>{
      const verify=await fetch(`${SETTINGS.apiBase}/api/card-renewal/verify-payment`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({localRenewalId:order.localRenewalId,...payment})});
      const result=await verify.json();if(!verify.ok)throw new Error(result.error||"Payment verification failed");
      await renderSubscription();show("Payment successful. Smart card activated for 365 days ✅");
    },theme:{color:"#b88b32"}});
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
