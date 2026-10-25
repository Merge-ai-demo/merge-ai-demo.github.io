"use strict";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
const ico = (nom, cls = "") => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONES[nom] || ""}</svg>`;
const pieuvre = () => `<span class="lettre-m" aria-hidden="true">M</span>`;   // le « M » de Merge (18 oct. au soir), à la place de la pieuvre
const animer = () => typeof matchMedia === "function" && !matchMedia("(prefers-reduced-motion: reduce)").matches;
const go = n => Langue.go(n);

const MEM = {
  lire(k){ try { return JSON.parse(localStorage.getItem("merge_site_" + k)); } catch (e) { return null; } },
  ecrire(k, v){ try { localStorage.setItem("merge_site_" + k, JSON.stringify(v)); } catch (e) {} },
  effacer(k){ try { localStorage.removeItem("merge_site_" + k); } catch (e) {} },
};

function habiller(){
  $$("[data-icone]").forEach(e => { e.outerHTML = ico(e.dataset.icone); });
  $$("[data-pieuvre]").forEach(e => { e.innerHTML = pieuvre(); e.removeAttribute("data-pieuvre"); });
}

const VUES = ["accueil", "comment", "produit", "ia", "nous", "contact", "confidentialite", "telecharger", "installer"];
const RENDUS = {accueil: () => {}, comment: () => {}, produit: () => {}, ia: rendreIA, nous: () => {}, contact: () => {}, confidentialite: () => {}, telecharger: () => {}, installer: demarrerProgramme};
let vueActive = null, premiereVue = true, ancreEnAttente = null;
function montrer(){
  let id = (location.hash || "#accueil").slice(1);
  if (!VUES.includes(id) && ["faq", "obtenir"].includes(id)){ ancreEnAttente = id; id = "accueil"; }
  else if (!VUES.includes(id) && ["vie-privee", "plus-tard"].includes(id)){ ancreEnAttente = id; id = "produit"; }
  if (!VUES.includes(id)){
    const cible = id && document.getElementById(id);
    if (cible && vueActive){ cible.setAttribute("tabindex", "-1"); cible.focus(); return; }
    id = "accueil";
  }
  const changement = id !== vueActive;
  vueActive = id;
  VUES.forEach(v => { $("#vue-" + v).hidden = v !== id; });
  $$(".liens a").forEach(a => { if (a.getAttribute("href") === "#" + id && !a.dataset.ancre) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
  const vue = $("#vue-" + id);
  majTitre();
  if (changement) arreterProgramme();
  RENDUS[id]();
  observer(vue);
  if (changement){
    if (!ancreEnAttente) window.scrollTo(0, 0);
    const h = vue.querySelector("h1");
    if (h && !premiereVue && !ancreEnAttente){ h.setAttribute("tabindex", "-1"); h.focus({preventScroll: true}); }
    premiereVue = false;
  }
  if (ancreEnAttente){ const a = ancreEnAttente; ancreEnAttente = null; setTimeout(() => allerA(a), 30); }
}
function majTitre(){
  const vue = vueActive && $("#vue-" + vueActive); if (!vue) return;
  document.title = vueActive === "accueil" ? `Merge · ${t("Your own AI")}` : `${t(vue.dataset.titre)} · Merge`;
}
function allerA(id){
  const el = document.getElementById(id); if (!el) return;
  el.classList.add("vu");
  el.scrollIntoView({behavior: animer() ? "smooth" : "auto", block: "start"});
  el.setAttribute("tabindex", "-1"); el.focus({preventScroll: true});
}
document.addEventListener("click", e => {
  const haut = e.target.closest('a[href="#accueil"]:not([data-ancre])');
  if (haut && vueActive === "accueil"){ e.preventDefault(); window.scrollTo({top: 0, behavior: animer() ? "smooth" : "auto"}); return; }
  const a = e.target.closest("a[data-ancre]"); if (!a) return;
  e.preventDefault();
  const vue = a.dataset.vue || "accueil";
  if (vueActive === vue) allerA(a.dataset.ancre);
  else { ancreEnAttente = a.dataset.ancre; location.hash = "#" + vue; }
});

let obs = null;
function observer(vue){
  const elements = $$(".apparait:not(.vu)", vue);
  document.documentElement.classList.add("js");
  if (!animer() || typeof IntersectionObserver !== "function"){ elements.forEach(e => e.classList.add("vu")); return; }
  if (!obs) obs = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting){ en.target.classList.add("vu"); obs.unobserve(en.target); } }), {threshold: 0});
  elements.forEach(e => obs.observe(e));
  setTimeout(() => elements.forEach(e => e.classList.add("vu")), 1000);
}

let detection = null;
function detecter(){
  if (detection) return detection;
  const ua = navigator.userAgent || "", d = {os: "mac", puce: "", telephone: false, nom: "", memoire: 0};
  const ipad = /iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  d.telephone = /iPhone|iPod|Android/.test(ua) || ipad;
  if (/Android/.test(ua)) d.os = "android";
  else if (d.telephone) d.os = "iphone";
  else if (/Win/.test(ua)) d.os = "windows";
  else if (/Linux|CrOS/.test(ua)) d.os = "linux";
  try {
    const gl = document.createElement("canvas").getContext("webgl");
    const ext = gl && gl.getExtension("WEBGL_debug_renderer_info");
    const r = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : "";
    const puce = r.match(/Apple (M\d+)( Pro| Max| Ultra)?/);
    if (puce) d.puce = "Apple " + puce[1] + (puce[2] || "");
  } catch (e) {}
  if (navigator.deviceMemory) d.memoire = navigator.deviceMemory;
  d.nom = {mac: d.puce ? `Mac with ${d.puce}` : "Mac", windows: "Windows PC", iphone: ipad ? "iPad" : "iPhone",
    android: "Android phone", linux: /CrOS/.test(ua) ? "Chromebook" : "Linux computer"}[d.os];
  detection = d;
  if (d.os === "android" && navigator.userAgentData && navigator.userAgentData.getHighEntropyValues){
    navigator.userAgentData.getHighEntropyValues(["model"]).then(v => {
      if (!v.model) return;
      const marque = [[/^SM-|^Galaxy/i, "Samsung"], [/^Pixel/i, "Google"], [/^XQ-/i, "Sony"], [/^moto/i, "Motorola"], [/^Nokia/i, "Nokia"], [/Redmi|POCO|Xiaomi|^Mi /i, "Xiaomi"]]
        .find(([re]) => re.test(v.model));
      d.nom = marque ? `${marque[1]} phone (${v.model})` : `Android phone (${v.model})`;
      afficherDetection();
    }).catch(() => {});
  }
  return d;
}
const pourCeSysteme = os => os === "mac" || os === "windows";
function afficherDetection(){
  const d = detecter();
  $$("[data-detecte]").forEach(e => { e.textContent = pourCeSysteme(d.os)
    ? t("For your {nom}, recognized automatically. Merge checks the rest when it opens.", {nom: d.nom})
    : t("Merge is for Mac and Windows for now (this looks like a {nom}). Linux, iPhone and Android are planned for later updates.", {nom: d.nom}); });
}
function initOS(){
  afficherDetection();
  document.addEventListener("click", e => {
    if (window.name !== "merge-site" || window.parent === window) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest("a[href]");
    if (!a || !/(^|\/)Moteur\/index\.html$/.test(a.getAttribute("href"))) return;
    e.preventDefault();
    window.parent.postMessage({merge: "montrer", page: "moteur"}, "*");
  });
  document.addEventListener("click", async e => {
    const a = e.target.closest("a[data-app-telecharger]"); if (!a) return;
    e.preventDefault();
    const fichier = fichierDe(systeme), note = $("[data-app-note]");
    if (adresseGitHub(systeme)){
      location.href = fiche(systeme).adresse;
      note.textContent = t("Downloading {f}. Then follow the steps below.", {f: fichier});
      $("#ouvrir").scrollIntoView({behavior: animer() ? "smooth" : "auto"});
      return;
    }
    let present = false;
    if (fichier && /^https?:$/.test(location.protocol)){
      try { present = (await fetch(fichier, {method: "HEAD", cache: "no-store"})).ok; } catch (err) {}
    }
    if (present){
      const lien = document.createElement("a");
      lien.href = fichier; lien.download = fichier;
      document.body.appendChild(lien); lien.click(); lien.remove();
      note.textContent = t("Downloading {f}. Then follow the steps below.", {f: fichier});
    } else note.textContent = window.parent !== window || !/^https?:$/.test(location.protocol)
      ? t("This preview doesn't include the app file: on the website, the download starts here.")
      : t("The download isn't available right now. Please try again later, or write to us.");
    $("#ouvrir").scrollIntoView({behavior: animer() ? "smooth" : "auto"});
  });
  document.addEventListener("click", e => {
    const a = e.target.closest("a[data-telecharger]"); if (!a) return;
    e.preventDefault();
    telecharger(a.dataset.telecharger);
  });
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-systeme]"); if (!b) return;
    systeme = b.dataset.systeme; MEM.ecrire("systeme", systeme);
    demarrerProgramme();
  });
}
const EXTENSIONS = {mac: "dmg", windows: "zip"};
function fiche(os){
  const d = typeof TELECHARGEMENT === "object" && TELECHARGEMENT ? TELECHARGEMENT : null;
  if (!d) return null;
  return d[os] || (os === "mac" && d.fichier ? d : null);          // (ancienne fiche : Mac seul)
}
const fichierDe = os => { const f = fiche(os); return f && new RegExp(`^[\\w.-]+\\.${EXTENSIONS[os]}$`).test(f.fichier) ? f.fichier : ""; };
const adresseGitHub = os => !!fichierDe(os) && new RegExp(`^https:\\/\\/github\\.com\\/[\\w.-]+\\/[\\w.-]+\\/releases\\/latest\\/download\\/[\\w.-]+\\.${EXTENSIONS[os]}$`).test(fiche(os).adresse || "");
const mo = n => t("{n} MB", {n: Math.round(n / 1e6).toLocaleString("en-US")});
const CONFIG = {mac: "macOS 14 or later, Apple chip or Intel", windows: "Windows 10 or 11, 64-bit, Intel or AMD"};
function noteTelechargement(os){
  const nom = os === "windows" ? "Windows" : "Mac";
  if (!fichierDe(os)) return t("Free beta for {nom}: {config}.", {nom, config: t(CONFIG[os])});
  return t("Merge {v} for {nom}, free · {taille} · {config}.", {v: fiche(os).version, nom, taille: mo(fiche(os).octets), config: t(CONFIG[os])});
}
let systeme = null;
function telecharger(os){
  if (os !== "mac" && os !== "windows"){
    const d = detecter().os;
    if (!pourCeSysteme(d)){ location.hash = "#telecharger"; return; }   // l'IA choisie reste notée
    os = d;
  }
  systeme = os; MEM.ecrire("systeme", os);
  if (location.hash === "#installer") demarrerProgramme(); else location.hash = "#installer";
}

const GROUPES = [
  {titre: "For almost any computer", sous: "8 GB of memory is enough", max: 6, machine: "vieux"},
  {titre: "For a 16 GB computer", sous: "Most recent laptops, MacBook Air and Mac mini", max: 12, machine: "portable"},
  {titre: "For a 32 GB computer", sous: "A MacBook Pro, an iMac, or a PC with 32 GB", max: 24, machine: "pro"},
  {titre: "For a 64 GB computer", sous: "A MacBook Pro, a Mac Studio or a PC with 64 GB", max: 48, machine: null},
  {titre: "For a 128 GB computer", sous: "Like a Mac Studio, or a large workstation", max: 96, machine: "studio"},
  {titre: "Too big for any computer for now", sous: "They need more than 96 GB of memory", max: Infinity, machine: null},
];
const FILTRES = Object.entries(USAGES).map(([id, u]) => ({id, nom: u.nom, garde: x => x.bon.includes(id)}));
const iaEtat = {texte: "", filtres: new Set(), ouverts: new Set(), origine: "toutes", tri: "taille"};
const TRIS_IA = {taille: "Size", nom: "Name (A to Z)", recent: "Newest first", ancien: "Oldest first"};
const moisAnnee = d => { if (!d) return ""; const [a, m] = String(d).split("-"); try { return new Date(+a, (+m || 1) - 1, 1).toLocaleDateString(Langue.code === "fr" ? "fr-FR" : Langue.code === "es" ? "es" : "en-US", {month: "short", year: "numeric"}); } catch { return d; } };
const ordreIA = (p, q) => iaEtat.tri === "nom" ? p.nom.localeCompare(q.nom)
  : iaEtat.tri === "recent" ? String(q.sortie || "").localeCompare(String(p.sortie || "")) || p.nom.localeCompare(q.nom)
  : iaEtat.tri === "ancien" ? String(p.sortie || "9").localeCompare(String(q.sortie || "9")) || p.nom.localeCompare(q.nom)
  : p.total - q.total || p.nom.localeCompare(q.nom);
const PAR_GROUPE = 6;
const sansAccents = t => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
function iaVisibles(){
  const mots = sansAccents(iaEtat.texte).split(/\s+/).filter(Boolean);
  return MODELES.filter(x => pourLaLangue(x) && ORIGINES[iaEtat.origine].garde(x)
    && [...iaEtat.filtres].every(f => FILTRES.find(F => F.id === f).garde(x))
    && mots.every(m => sansAccents([x.nom, x.editeur, x.pays, t(x.pays || ""), x.famille || "", x.phrase, Langue.phrase(x)].join(" ")).includes(m)));
}
function rendreIA(){
  const usage = $("#ia-usage");
  if (!usage.options.length){ usage.innerHTML = `<option value="">${esc(t("Anything"))}</option>` + FILTRES.map(f => `<option value="${f.id}">${esc(t(f.nom))}</option>`).join(""); usage.value = [...iaEtat.filtres][0] || ""; }
  const tri = $("#ia-tri");
  if (!tri.options.length){ tri.innerHTML = Object.entries(TRIS_IA).map(([k, v]) => `<option value="${k}">${esc(t(v))}</option>`).join(""); tri.value = iaEtat.tri; }
  const pays = $("#ia-pays");
  if (!pays.options.length){ pays.innerHTML = Object.entries(ORIGINES).map(([k, v]) => `<option value="${k}">${esc(t(v.nom))}</option>`).join(""); pays.value = iaEtat.origine; }
  const visibles = iaVisibles(), cherche = iaEtat.texte || iaEtat.filtres.size || iaEtat.origine !== "toutes";
  const total = MODELES.filter(pourLaLangue).length;
  $("#ia-compte").textContent = cherche ? t("{n} of {total} AIs", {n: visibles.length, total}) : t("{total} AIs", {total});
  let deja = 0;
  $("#ia-liste").innerHTML = GROUPES.map((g, n) => {
    const liste = visibles.filter(x => EST.memoire(x) > deja && EST.memoire(x) <= g.max).sort(ordreIA);
    deja = g.max;
    if (!liste.length) return "";
    const pick = g.machine ? conseil(MACHINES.find(m => m.id === g.machine)).id : "";
    if (iaEtat.tri === "taille") liste.sort((a, b) => (b.id === pick) - (a.id === pick));
    const tout = cherche || iaEtat.ouverts.has(n), montrees = tout ? liste : liste.slice(0, PAR_GROUPE);
    return `<section class="ia-groupe"><h2>${esc(t(g.titre))}<span class="nb">${liste.length}</span></h2><p>${esc(t(g.sous))}</p>${montrees.map(x => `<div class="ia-ligne">
      <div><h3>${esc(x.nom)}${x.id === pick ? ` <span class="badge">${esc(t("Suggested"))}</span>` : ""}${x.pc ? ` <span class="badge doux" title="${esc(t("Offered by the Windows app only, for now"))}">${esc(t("Windows"))}</span>` : ""}${LANGUE === "fr" && x.fr ? ` <span class="badge doux" title="${esc(t("Its publisher lists French; not yet tested by us"))}">${esc(t("French listed"))}</span>` : ""}</h3>
        <p class="qui">${esc(x.editeur)}${x.pays ? " · " + esc(t(x.pays)) : ""}</p><p class="quoi">${esc(Langue.phrase(x))}</p>
        ${x.bon.length ? `<p class="bon">${esc(t("Good at: {x}", {x: x.bon.map(u => t(USAGES[u].nom).toLowerCase()).join(", ")}))}</p>` : ""}
        <p class="taille">${x.sortie ? esc(t("Released {d}", {d: moisAnnee(x.sortie)})) + " · " : ""}${esc(t("{a} download · needs about {b} of memory", {a: go(EST.fichier(x)), b: go(EST.memoire(x))}))}</p></div>
      <div class="ia-actions"><button type="button" class="lien-btn" data-details="${esc(x.id)}">${esc(t("Details"))}</button>
      ${installable(x) ? `<button type="button" class="lien-btn" data-installer="${x.id}">${esc(t("Get it with the app ›"))}</button>` : `<span class="pas-encore">${esc(t("Not in the app yet"))}</span>`}</div></div>`).join("")}
      ${montrees.length < liste.length ? `<p class="ia-plus"><button type="button" class="lien-btn" data-ouvrir="${n}">${esc(t("Show all {n} ›", {n: liste.length}))}</button></p>` : ""}</section>`;
  }).join("") + (visibles.length ? "" : `<p class="ia-note">${esc(t("No AI matches. Try fewer filters or another word."))}</p>`)
    + `<p class="ia-note">${esc(t("You don't have to choose: the Merge app suggests the right one for your computer. Sizes are estimates; each AI's licence will be checked before download opens."))}</p>`;
}
const APPAREILS = [
  {id: "vieux", nom: "8 GB computer", machine: MACHINES.find(m => m.id === "vieux")},
  {id: "portable", nom: "16 GB computer", machine: MACHINES.find(m => m.id === "portable")},
  {id: "pro", nom: "32 GB computer", machine: MACHINES.find(m => m.id === "pro")},
  {id: "m64", nom: "64 GB computer", machine: {id: "m64", nom: "Mac", memoire: 64, dispo: 48, debit: 200}},
  {id: "studio", nom: "128 GB computer", machine: MACHINES.find(m => m.id === "studio")},
];
const icoUsage = u => `<span class="ia-usage" title="${esc(t(USAGES[u].nom))}">${ico(USAGES[u].icone)}${esc(t(USAGES[u].nom))}</span>`;
let CATALOGUE_DEPOTS = null;
async function depotDe(id){
  if (CATALOGUE_DEPOTS === null){ try { const c = await (await fetch("catalogue.json")).json(); CATALOGUE_DEPOTS = Object.fromEntries(Object.entries(c.modeles || {}).map(([k, v]) => [k, v.depot])); } catch { CATALOGUE_DEPOTS = {}; } }
  return CATALOGUE_DEPOTS[id] || "";
}
async function ouvrirFiche(id){
  const x = modele(id); if (!x) return;
  const ligne = (k, v) => v ? `<div><dt>${esc(t(k))}</dt><dd>${v}</dd></div>` : "";
  const appareils = APPAREILS.filter(a => a.machine).map(a => {
    const ok = EST.tient(x, a.machine), v = ok ? vitesse(x, a.machine) : null;
    return `<li class="${ok ? "ok" : "non"}"><span>${esc(t(a.nom))}</span><b>${esc(ok ? t(v.mot) : t("Too big"))}</b></li>`;
  }).join("");
  const params = x.actifs && x.actifs < x.total - 0.05 ? t("{a} billion, {b} billion active at a time", {a: x.total, b: x.actifs}) : t("{a} billion", {a: x.total});
  const corps = $("#ia-fiche-corps");
  const remplir = depot => {
    corps.innerHTML = `<div class="fiche-haut"><div><p class="eti">${esc(x.editeur)}${x.pays ? " · " + esc(t(x.pays)) : ""}</p><h2 id="ia-fiche-titre">${esc(x.nom)}</h2></div>
        <button type="button" class="fiche-fermer" data-fermer aria-label="${esc(t("Close"))}">${ico("x")}</button></div>
      <p class="quoi">${esc(Langue.phrase(x))}</p>
      ${x.pc ? `<p class="petit">${esc(t("Offered by the Windows app only, for now (one of the 12 AIs added for the wide range of Windows PCs)."))}</p>` : ""}
      ${x.bon.length ? `<p class="ia-usages">${x.bon.map(icoUsage).join("")}</p>` : ""}
      <dl class="fiche-infos">
        ${ligne("Download", esc(go(EST.fichier(x))))}
        ${ligne("Memory needed", esc(t("about {b}", {b: go(EST.memoire(x))})))}
        ${ligne("Size of the AI", esc(params))}
        ${ligne("Released", esc(moisAnnee(x.sortie)))}
        ${ligne("License", esc(x.licence || ""))}
        ${ligne("Speciality", x.specialiste ? esc(t({code: "Code", trad: "Translation", documents: "Reading documents", maths: "Maths", sante: "Health", finance: "Finance"}[x.specialiste] || x.specialiste)) : "")}
        ${ligne("Family", esc(x.famille || ""))}
      </dl>
      <h3>${esc(t("Where it runs"))}</h3>
      <ul class="fiche-appareils">${appareils}</ul>
      <p class="petit">${esc(t("Speeds are estimates from the AI's size, for a Mac; a PC without a graphics card is often slower. Nothing has been measured on real devices yet."))}</p>
      <div class="fiche-bas">${depot ? `<a class="lien-btn" href="https://huggingface.co/${esc(depot)}" target="_blank" rel="noopener">${esc(t("See it on Hugging Face ↗"))}</a>` : "<span></span>"}
        ${installable(x) ? `<button type="button" class="btn" data-installer="${esc(x.id)}">${esc(t("Get it with the app"))}</button>` : `<span class="pas-encore">${esc(t("Not in the app yet"))}</span>`}</div>`;
  };
  remplir("");
  const d = $("#ia-fiche"); if (!d.open) d.showModal();
  const depot = await depotDe(id); if (d.open) remplir(depot);
}
function initIA(){
  $("#ia-fiche").addEventListener("click", e => {
    if (e.target.closest("[data-fermer]") || e.target === $("#ia-fiche")){ $("#ia-fiche").close(); return; }
    const b = e.target.closest("[data-installer]"); if (!b) return;
    $("#ia-fiche").close(); MEM.ecrire("choix", b.dataset.installer); telecharger();
  });
  $("#ia-liste").addEventListener("click", e => {
    const det = e.target.closest("[data-details]"); if (det){ ouvrirFiche(det.dataset.details); return; }
    const o = e.target.closest("[data-ouvrir]");
    if (o){ iaEtat.ouverts.add(+o.dataset.ouvrir); rendreIA(); return; }
    const b = e.target.closest("[data-installer]"); if (!b) return;
    MEM.ecrire("choix", b.dataset.installer);
    telecharger();
  });
  $("#ia-usage").addEventListener("change", e => { iaEtat.filtres = new Set([e.target.value].filter(Boolean)); rendreIA(); });
  $("#ia-tri").addEventListener("change", e => { iaEtat.tri = e.target.value; rendreIA(); });
  $("#ia-cherche").addEventListener("input", e => { iaEtat.texte = e.target.value.trim(); rendreIA(); });
  $("#ia-pays").addEventListener("change", e => { iaEtat.origine = e.target.value; rendreIA(); });
}

let arretProgramme = null;
function arreterProgramme(){ if (arretProgramme){ arretProgramme(); arretProgramme = null; } }
const BARRES = {
  mac: `<div class="fen-barre"><span class="feux"><i></i><i></i><i></i></span><span class="titre">Merge</span></div>`,
  windows: `<div class="fen-barre"><span class="titre">Merge</span></div>`,
};
let voulueSite = null;
function rendreAppli(){
  const win = systeme === "windows", reconnu = detecter().os === systeme, nom = win ? "PC" : "Mac";
  $$("[data-systeme]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.systeme === systeme)));
  $$("[data-ouvrir]").forEach(x => { x.hidden = x.dataset.ouvrir !== systeme; });
  $("[data-app-telecharger]").textContent = t(win ? "Download Merge for Windows" : "Download Merge for Mac");
  $("[data-app-titre]").innerHTML = `${esc(t(win ? "Get Merge for your Windows PC" : "Get Merge for your Mac"))}<span class="point">.</span>`;
  const choisie = modele(voulueSite), n = $("[data-app-choix]");
  n.hidden = !choisie;
  if (choisie) n.textContent = t("You picked {x}. In the app, choose it under “Other choices” if it fits your computer.", {x: choisie.nom});
  $("[data-app-sous]").textContent = (reconnu ? t("Your {x}, recognized automatically.", {x: detecter().nom}) + " " : "") + t("Get the Merge app: it checks your {nom} and suggests the AI that suits it.", {nom});
  $("[data-app-etapes]").innerHTML = (win ? [
    [t("Download the Merge app"), t("A zip file arrives in your Downloads. Extract it (right-click › Extract All).")],
    [t("Open Merge.cmd"), t("The first time, Windows may ask you to confirm (see below). Then Merge looks at your PC by itself: its memory, its processor, its graphics card, its free space.")],
    [t("Click Continue, then Install"), t("Merge suggests the best AI your PC can run, says what it will download and where, and installs it. Then the chat opens by itself.")],
  ] : [
    [t("Download the Merge app"), t("A file arrives in your Downloads. Open it, and drag Merge into Applications.")],
    [t("Open Merge"), t("The first time, your Mac asks you to confirm (see below). Then Merge looks at your Mac by itself: its memory, its chip, its free space.")],
    [t("Click Continue, then Install"), t("Merge suggests the best AI your Mac can run, says what it will download and where, and installs it. Then the chat opens by itself.")],
  ]).map(([titre, x], k) => `<li><span class="num">${k + 1}</span><span><b>${esc(titre)}</b><small>${esc(x)}</small></span></li>`).join("");
}
function demarrerProgramme(){
  arreterProgramme();
  if (systeme !== "mac" && systeme !== "windows"){
    const garde = MEM.lire("systeme");
    systeme = garde === "mac" || garde === "windows" ? garde : detecter().os === "windows" ? "windows" : "mac";
  }
  voulueSite = MEM.lire("choix"); MEM.effacer("choix");
  rendreAppli();
  $("[data-app-note]").textContent = noteTelechargement(systeme);
  $("[data-app-empreinte]").textContent = fichierDe(systeme) ? t("To check the file: SHA-256 {e}", {e: fiche(systeme).sha256}) : "";
  arretProgramme = Programme.lancer($("#programme"), {
    pont: Programme.pontApercu(systeme, detecter().os === systeme ? detecter() : null), apercu: true, barre: BARRES[systeme],
    voulue: voulueSite,
    fin: () => `<a class="btn discret" href="#accueil">${esc(t("Back to the website"))}</a><a class="btn" href="../Moteur/index.html">${ico("sparkles")}${esc(t("Open Merge"))}</a>`,
  });
}

function initMenuTel(){
  const bouton = $(".menu-tel"), liste = $("#menu-tel");
  if (!bouton || !liste) return;
  const fermer = () => { liste.hidden = true; bouton.setAttribute("aria-expanded", "false"); };
  let survol = 0;
  bouton.addEventListener("click", () => {
    if (Date.now() - survol < 800) return;          // déjà ouvert par le passage de la souris : le clic ne le referme pas
    const ouvrir = liste.hidden;
    liste.hidden = !ouvrir; bouton.setAttribute("aria-expanded", String(ouvrir));
    if (ouvrir) liste.querySelector("a")?.focus();
  });
  bouton.addEventListener("pointerenter", e => {
    if (e.pointerType === "mouse" && liste.hidden){ liste.hidden = false; bouton.setAttribute("aria-expanded", "true"); survol = Date.now(); }
  });
  $(".barre").addEventListener("pointerleave", e => { if (e.pointerType === "mouse") fermer(); });
  liste.addEventListener("click", e => { if (e.target.closest("a")) fermer(); });
  window.addEventListener("hashchange", fermer);
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !liste.hidden){ fermer(); bouton.focus(); } });
}

habiller();
initOS(); initIA(); initMenuTel();
window.addEventListener("hashchange", montrer);
montrer();
