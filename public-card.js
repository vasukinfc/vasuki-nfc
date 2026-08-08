import { db, SETTINGS, ref, get, runTransaction, $, cleanPhone, now, registerSW } from "./shared.js";

registerSW();
const params = new URLSearchParams(location.search);
function legacyCardId() {
  let value = params.get("id") || params.get("card") || params.get("customer") || "";
  if (!value && location.hash.length > 1) value = location.hash.slice(1);
  if (!value) {
    const segment = location.pathname.split("/").filter(Boolean).pop() || "";
    if (segment && !/^(?:index\.html|vasuki-nfc)$/i.test(segment) && !segment.includes(".")) value = segment;
  }
  try { value = decodeURIComponent(value); } catch {}
  return String(value).trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 80);
}
const id = legacyCardId();
const demo = params.get("demo") === "1";
const FAST_CACHE_MS = 15 * 60 * 1000;

function fastCacheKey() { return `vasuki-fast-card-v13:${id}`; }
function readFastLifetimeCard() {
  try {
    const cached = JSON.parse(localStorage.getItem(fastCacheKey()) || "null");
    if (!cached || now() - Number(cached.savedAt || 0) > FAST_CACHE_MS) return null;
    if (!cached.subscription?.verified || cached.subscription?.lifetime !== true) return null;
    return cached;
  } catch { return null; }
}
function saveFastLifetimeCard(profile, subscription) {
  if (!subscription?.verified || subscription?.lifetime !== true) return;
  try { localStorage.setItem(fastCacheKey(), JSON.stringify({ profile, subscription, savedAt: now() })); } catch {}
}

$("#backSupport").href = `https://wa.me/${SETTINGS.supportPhone}?text=${encodeURIComponent("Hello Vasuki NFC, I need smart card support.")}`;
$("#renewWa").href = `https://wa.me/${SETTINGS.supportPhone}?text=${encodeURIComponent(`Hello Vasuki NFC, I want to recharge card ${id || ""} for ₹${SETTINGS.annualPrice}.`)}`;

function show(which) {
  ["#loading", "#cardWrap", "#expired", "#missing"].forEach(selector => $(selector).classList.add("hidden"));
  $(which).classList.remove("hidden");
}
function url(value) {
  const raw = String(value || "").trim();
  if (!raw || /^(?:javascript|data|vbscript|file):/i.test(raw)) return "";
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const parsed = new URL(candidate);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : "";
  } catch { return ""; }
}
function profileSocial(profile, network) {
  const aliases = {
    instagram: ["instagram", "instagramUrl", "instagramLink"],
    facebook: ["facebook", "facebookUrl", "facebookLink"],
    linkedin: ["linkedin", "linkedIn", "linkedinUrl", "linkedinLink"],
    youtube: ["youtube", "youTube", "youtubeUrl", "youtubeLink"]
  };
  const nested = [profile.social, profile.socials, profile.socialLinks].filter(value => value && typeof value === "object");
  for (const key of aliases[network]) {
    if (profile[key]) return String(profile[key]).trim();
    for (const value of nested) if (value[key]) return String(value[key]).trim();
  }
  return "";
}
function socialUrl(network, value) {
  const raw = String(value || "").trim();
  const direct = /^https?:\/\//i.test(raw) ? url(raw) : "";
  if (direct) return direct;
  const handle = raw.replace(/^@/, "").replace(/^\/+|\/+$/g, "");
  if (!handle || !/^[\w.\-@/]+$/.test(handle)) return "";
  const base = { instagram: "https://instagram.com/", facebook: "https://facebook.com/", linkedin: "https://linkedin.com/in/", youtube: "https://youtube.com/@" }[network];
  return `${base}${encodeURI(handle)}`;
}
function contactPhone(value) { const digits = cleanPhone(value); return /^\d{10}$/.test(digits) ? `91${digits}` : digits; }
function vcard(profile) {
  const clean = value => String(value || "").replace(/[\r\n]+/g, " ");
  return `BEGIN:VCARD\nVERSION:3.0\nFN:${clean(profile.name)}\nORG:${clean(profile.business)}\nTEL:${clean(profile.phone)}\nEMAIL:${clean(profile.publicEmail || profile.email)}\nURL:${clean(profile.website)}\nADR:;;${clean(profile.location || profile.address)};;;;\nEND:VCARD`;
}
async function safeRead(path) { try { return await get(ref(db, path)); } catch { return null; } }
async function api(path, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${SETTINGS.apiBase}${path}`, { cache: "no-store", signal: controller.signal });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Card service unavailable");
    return data;
  } finally { clearTimeout(timer); }
}
function subscriptionIsActive(subscription) {
  if (!subscription?.verified) return false;
  if (subscription.lifetime === true) return true;
  return subscription.status === "active" && Number(subscription.expiresAt || 0) > now();
}

async function boot() {
  if (demo) {
    const profile = { name: "Hem Shankar Agarwal", business: "Vasuki NFC", tagline: "Smart Cards. Smart Future.", phone: "916377393721", whatsapp: "916377393721", website: "https://vasukinfc.in", location: "https://maps.google.com/?q=Jaipur", about: "Premium NFC business cards, smart digital profiles and modern printing solutions.", profileImage: "" };
    renderCard(profile, { verified: true, lifetime: true, plan: "demo" }, true);
    return;
  }
  if (!id) { show("#missing"); return; }

  const cached = readFastLifetimeCard();
  if (cached) {
    renderCard(cached.profile, cached.subscription, false);
    return;
  }

  const [profileSnap, subscriptionSnap, legacyCustomerSnap] = await Promise.all([
    safeRead(`publishedProfiles/${id}`),
    safeRead(`publicSubscriptions/${id}`),
    safeRead(`customers/${id}`)
  ]);
  let profile = profileSnap?.exists() ? profileSnap.val() : null;
  let subscription = subscriptionSnap?.exists() ? subscriptionSnap.val() : null;
  const legacyCustomer = legacyCustomerSnap?.exists() ? legacyCustomerSnap.val() : null;
  const isRootKeyLegacyCustomer = legacyCustomer && typeof legacyCustomer === "object" && !legacyCustomer.cardId;

  // The oldest Vasuki cards (for example ?id=002) are stored directly under
  // customers/{cardId}. They were sold with lifetime access and predate the
  // annual subscription system.
  if (!profile && isRootKeyLegacyCustomer) profile = legacyCustomer.profile || legacyCustomer;
  if (!subscriptionIsActive(subscription) && isRootKeyLegacyCustomer) {
    subscription = { status: "active", lifetime: true, plan: "legacy_lifetime", amount: 0, verified: true };
  }

  if (!profile) {
    try {
      const resolved = await api(`/api/card-profile/${encodeURIComponent(id)}`);
      profile = resolved.profile;
    } catch { show("#missing"); return; }
  }

  if (!subscriptionIsActive(subscription)) {
    try { subscription = await api(`/api/card-subscription/${encodeURIComponent(id)}`); }
    catch { subscription = null; }
  }
  if (!subscriptionIsActive(subscription)) { show("#expired"); return; }
  saveFastLifetimeCard(profile, subscription);
  renderCard(profile, subscription, false);
}

function configureLink(selector, href) {
  const element = $(selector);
  if (!href) { element.classList.add("hidden"); element.removeAttribute("href"); return; }
  element.classList.remove("hidden");
  element.href = href;
}

async function renderCard(profile, subscription, isDemo) {
  const legacyThemeMap = { royal: "cream", emerald: "white" };
  const requestedTheme = legacyThemeMap[profile.theme] || profile.theme;
  document.body.dataset.cardTheme = ["classic", "midnight", "cream", "white"].includes(requestedTheme) ? requestedTheme : "classic";
  const fallbackAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='100%25' height='100%25' fill='%23d5b269'/%3E%3Ctext x='50%25' y='56%25' text-anchor='middle' font-size='80' fill='%23fff'%3EV%3C/text%3E%3C/svg%3E";
  $("#avatar").src = profile.profileImage || fallbackAvatar;
  $("#avatar").onerror = () => { $("#avatar").onerror = null; $("#avatar").src = fallbackAvatar; };
  $("#name").textContent = profile.name || "Smart Card";
  $("#business").textContent = profile.business || "";
  $("#tagline").textContent = profile.tagline || "";
  $("#verifiedBadge").classList.toggle("hidden", !subscription.verified);

  configureLink("#call", contactPhone(profile.phone) ? `tel:+${contactPhone(profile.phone)}` : "");
  configureLink("#wa", contactPhone(profile.whatsapp || profile.phone) ? `https://wa.me/${contactPhone(profile.whatsapp || profile.phone)}` : "");
  configureLink("#web", url(profile.website));
  configureLink("#map", url(profile.location));
  const socialLinks = [
    ["instagram", "Instagram", "IG"], ["facebook", "Facebook", "FB"], ["linkedin", "LinkedIn", "IN"], ["youtube", "YouTube", "YT"]
  ].map(([network, label, icon]) => [label, icon, socialUrl(network, profileSocial(profile, network))]).filter(([, , href]) => href);
  const socials = $("#socialLinks");
  const socialToggle = $("#socialToggle");
  socials.replaceChildren(...socialLinks.map(([label, icon, href]) => {
    const anchor = document.createElement("a");
    anchor.href = href; anchor.target = "_blank"; anchor.rel = "noopener noreferrer";
    anchor.innerHTML = `<strong>${icon}</strong><span>${label}</span>`; anchor.setAttribute("aria-label", label);
    return anchor;
  }));
  socialToggle.classList.toggle("hidden", socialLinks.length === 0);
  socials.classList.add("hidden");
  socialToggle.setAttribute("aria-expanded", "false");
  socialToggle.onclick = event => {
    event.stopPropagation();
    const opening = socials.classList.contains("hidden");
    socials.classList.toggle("hidden", !opening);
    socialToggle.setAttribute("aria-expanded", String(opening));
    socialToggle.querySelector("i").textContent = opening ? "⌃" : "⌄";
  };

  $("#save").onclick = () => {
    const blob = new Blob([vcard(profile)], { type: "text/vcard" });
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `${String(profile.name || "contact").replace(/[^a-z0-9 _-]/gi, "-")}.vcf`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(anchor.href), 1000);
  };

  const scene = $("#scene");
  const dots = [...document.querySelectorAll(".flip-dots span")];
  const supportFab = $("#supportFab");
  const supportPopup = $("#supportPopup");
  let startX = 0;
  const closeSupport = () => { supportPopup.classList.add("hidden"); supportFab.setAttribute("aria-expanded", "false"); };
  const flip = () => {
    const flipped = scene.classList.toggle("flipped");
    dots.forEach((dot, index) => dot.classList.toggle("active", index === (flipped ? 1 : 0)));
    supportFab.classList.toggle("hidden", !flipped);
    if (!flipped) closeSupport();
  };
  supportFab.onclick = () => {
    const opening = supportPopup.classList.contains("hidden");
    supportPopup.classList.toggle("hidden", !opening);
    supportFab.setAttribute("aria-expanded", String(opening));
  };
  $("#closeSupport").onclick = closeSupport;
  scene.onclick = event => { if (!event.target.closest("a,button")) flip(); };
  scene.onkeydown = event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); flip(); } };
  scene.addEventListener("touchstart", event => { startX = event.touches[0].clientX; }, { passive: true });
  scene.addEventListener("touchend", event => { if (Math.abs(event.changedTouches[0].clientX - startX) > 45) flip(); }, { passive: true });
  $("#flipBtn").onclick = flip;
  $("#share").onclick = async () => {
    const data = { title: `${profile.name || "Smart"} Visiting Card`, text: `Connect with ${profile.name || "me"}`, url: location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(location.href); $("#share").querySelector("b").textContent = "Link Copied ✓"; }
    } catch (error) { if (error.name !== "AbortError") alert("Unable to share this card."); }
  };
  if (isDemo) $("#scans").textContent = "Demo Preview • Tap or swipe to test the card";
  else {
    try {
      const result = await runTransaction(ref(db, `scanCounts/${id}`), value => Number(value || 0) + 1);
      $("#scans").textContent = `Card views: ${result.snapshot.val()}`;
    } catch { $("#scans").textContent = ""; }
  }
  show("#cardWrap");
}

boot().catch(error => { console.warn("Smart card failed to open:", error.message); show("#missing"); });
