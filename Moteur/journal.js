(() => {
  "use strict";
  const tr = window.LangueAppli ? window.LangueAppli.t : (s, v) => (v ? String(s).replace(/\{(\w+)\}/g, (x, k) => (k in v ? v[k] : x)) : s);
  const LANGUE = window.LangueAppli || null;
  const locale = () => (LANGUE ? LANGUE.locale : "en-US");
  const CLE = "merge.journal", CLE_REGLAGES = "merge.journal.reglages";
  const DUREES = { 1: "1 day", 7: "7 days", 30: "30 days", 365: "1 year" };
  const VOLUMES = { 100: "100 KB", 500: "500 KB", 1000: "1 MB" };
  const lireJ = (cle, defaut) => { try { const v = localStorage.getItem(cle); return v ? JSON.parse(v) : defaut; } catch { return defaut; } };
  const ecrireJ = (cle, v) => { try { localStorage.setItem(cle, JSON.stringify(v)); return true; } catch { return false; } };
  let reglages = { duree: 30, volume: 500, ...lireJ(CLE_REGLAGES, {}) };
  const coffre = () => window.MergeCoffre || null;
  let tampon = [];
  function lireL(){
    const c = coffre();
    try {
      if (c && c.protege(CLE)) { const v = c.lire(CLE); const l = v ? JSON.parse(v) : []; return Array.isArray(l) ? l : []; }
      if (c && c.verrouille && c.verrouille()) return tampon.slice();
    } catch { return []; }
    return lireJ(CLE, []);
  }
  function ecrireL(l){
    const c = coffre();
    if (c && c.protege(CLE)) { c.ecrire(CLE, JSON.stringify(l)); return true; }
    if (c && c.verrouille && c.verrouille()) { tampon = l; return true; }
    return ecrireJ(CLE, l);
  }
  window.addEventListener("merge-deverrouille", () => {
    if (tampon.length) { const l = [...lireL(), ...tampon]; tampon = []; ecrireL(nettoyer(l)); }
    if (typeof window.mergeJournalChange === "function") window.mergeJournalChange();   // le résumé, maintenant lisible
  });
  const horsLigne = () => false;
  if (!VOLUMES[reglages.volume]) reglages.volume = 500;
  let echec = false;          // la dernière écriture a échoué (stockage plein) : on le dit dans l'écran
  let prive = false;          // conversation privée en cours : la question d'une recherche web n'est pas gardée

  const IPV4 = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
  const PRIVES = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.)/;
  const surAppareil = (h) => ["localhost", "[::1]", "::1", "0.0.0.0", "[::]"].includes(h) || /^127\./.test(h) && IPV4.test(h);
  const aLaMaison = (h) => (IPV4.test(h) && (PRIVES.test(h) || /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(h))) || /^\[(f[cd][0-9a-f]{2}|fe[89ab][0-9a-f]):/i.test(h) || /\.local$/i.test(h) && !h.includes("..");
  function lieu(adresse){
    try {
      const u = new URL(adresse, location.href);
      if (!/^(https?|wss?):$/.test(u.protocol)) return "appareil";          // data:, blob:, app: (fichiers de l'app)
      if (surAppareil(u.hostname)) return "appareil";
      if (u.origin === location.origin && (surAppareil(location.hostname) || !/^https?:$/.test(location.protocol))) return "appareil";
      if (aLaMaison(u.hostname)) return "maison";
      return "internet";
    } catch { return "internet"; }
  }
  function phrase(e){
    const a = e.adresse || "";
    if (e.texte) {
      let m;
      if ((m = e.texte.match(/^Finished downloading (.+); every file checked$/))) return tr("Finished downloading {nom}; every file checked", { nom: m[1] });
      if ((m = e.texte.match(/^Started downloading (.+?) and (.+) from Hugging Face$/))) return tr("Started downloading {nom} and {autre} from Hugging Face", { nom: m[1], autre: m[2] });
      if ((m = e.texte.match(/^Started downloading (.+) from Hugging Face$/))) return tr("Started downloading {nom} from Hugging Face", { nom: m[1] });
      return tr(e.texte);
    }
    const hote = e.hote || tr("a website");
    if (e.statut === "blocked") return tr("Refused by “Offline only”: Merge did not connect to {hote}", { hote });
    if (/wikipedia\.org.*Current_events/i.test(a)) return tr("Read Wikipedia's list of recent events (no search words sent)");
    if (/wikipedia\.org/.test(a)) return tr("Searched Wikipedia with a few search words");
    if (/gdeltproject\.org/.test(a)) return tr("Searched the GDELT news database with a few search words");
    if (/ncbi\.nlm\.nih\.gov/.test(a)) return tr("Searched PubMed (medical articles) with a few search words");
    if (/openalex\.org/.test(a)) return tr("Searched OpenAlex (scientific publications) with a few search words");
    if (/\/search\?/.test(a)) return tr("Searched your SearXNG for your question");
    if (typeof e.statut === "string") return tr("Tried to reach {hote}: no answer", { hote });
    if (/\/v1\/chat\/completions/.test(a)) return e.lieu === "appareil" ? tr("The AI on this device wrote an answer") : e.lieu === "maison" ? tr("Your message went to the AI on a computer at home") : tr("Your message went to an AI on the internet ({hote})", { hote: e.hote || "" });
    if (/\/v1\/models|\/api\/show|\/api\/tags/.test(a)) return tr("Checked which AI is running");
    if (/merge-plugin\.json/.test(a)) return tr("Read a plugin (text only, no code) from {hote}", { hote });
    if (/huggingface\.co/.test(a)) return tr("Downloaded an AI from Hugging Face");
    if (/github\.com|githubusercontent/.test(a)) return tr("Downloaded the AI engine from GitHub");
    if (/\/api\/vivant/.test(a)) return tr("Merge checked that its installer is still open");
    return e.lieu === "appareil" ? tr("Talked to Merge on this device") : tr("Connected to {hote}", { hote });
  }

  function nettoyer(liste){
    const limite = Date.now() - reglages.duree * 864e5;
    let l = liste.filter(e => e.quand >= limite);
    const trop = () => JSON.stringify(l).length > reglages.volume * 1000;
    while (l.length && trop()){
      const k = l.findIndex(e => e.lieu === "appareil");
      if (k >= 0) l.splice(k, Math.max(1, Math.ceil(l.filter(e => e.lieu === "appareil").length / 10)));
      else l = l.slice(Math.ceil(l.length / 10));
    }
    return l;
  }
  function ajouter(e){
    const entree = { quand: Date.now(), ...e };
    entree.lieu = entree.lieu || lieu(entree.adresse || "");
    try { const u = new URL(entree.adresse, location.href); if (u.username || u.password) { u.username = ""; u.password = ""; entree.adresse = u.href; } } catch {}
    try { entree.hote = entree.hote || new URL(entree.adresse, location.href).host; } catch {}
    if ((entree.lieu !== "internet" || prive) && entree.adresse){ try { const u = new URL(entree.adresse, location.href); if (u.search && entree.lieu === "internet") entree.cache = true; entree.adresse = u.origin + u.pathname; } catch {} }
    const liste = lireL(), dern = liste[liste.length - 1];
    if (entree.lieu !== "internet" && dern && dern.lieu === entree.lieu && dern.adresse === entree.adresse && dern.statut === entree.statut && entree.quand - dern.quand < 36e5){
      dern.fois = (dern.fois || 1) + 1; dern.quand = entree.quand; dern.recu = (dern.recu || 0) + (entree.recu || 0);
    } else liste.push(entree);
    echec = !ecrireL(nettoyer(liste));
    if (typeof window.mergeJournalChange === "function") window.mergeJournalChange();
  }

  const fetchOrigine = window.fetch.bind(window);
  window.fetch = async (ressource, init = {}) => {
    const adresse = typeof ressource === "string" ? ressource : (ressource && ressource.url) || String(ressource);
    const methode = (init.method || (ressource && ressource.method) || "GET").toUpperCase();
    const envoye = typeof init.body === "string" ? new Blob([init.body]).size : 0;
    const debut = performance.now();
    if (horsLigne() && lieu(adresse) === "internet") {
      let hote = adresse; try { hote = new URL(adresse, location.href).host; } catch {}
      ajouter({ adresse, methode, envoye: 0, statut: "blocked", lieu: "bloque", duree: 0 });   // l'adresse est gardée sans la question
      const err = new Error(tr("“Offline only” is on: Merge did not connect to {hote}, which is on the internet.", { hote }));
      err.horsLigne = true;
      throw err;
    }
    if (horsLigne()) init = { ...init, redirect: "error" };
    try {
      const rep = await fetchOrigine(ressource, init);
      const taille = Number(rep.headers.get("content-length")) || null;
      ajouter({ adresse, methode, envoye, recu: taille, statut: rep.status, duree: Math.round(performance.now() - debut) });
      return rep;
    } catch (err) {
      ajouter({ adresse, methode, envoye, statut: err && err.name === "AbortError" ? "stopped" : "failed", duree: Math.round(performance.now() - debut) });
      throw err;
    }
  };

  const $ = id => document.getElementById(id);
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const octets = n => n == null ? "" : n < 1000 ? tr("{n} B", { n }) : n < 1e6 ? tr("{n} KB", { n: Math.round(n / 1000) })
    : n < 1e9 ? tr("{n} MB", { n: (n / 1e6).toLocaleString(locale(), { maximumFractionDigits: 1, minimumFractionDigits: 1 }) }) : tr("{n} GB", { n: (n / 1e9).toLocaleString(locale(), { maximumFractionDigits: 2, minimumFractionDigits: 2 }) });
  const LIEUX = { appareil: ["Stayed on this device", "ok"], maison: ["Went to a computer at home", "maison"], internet: ["Left for the internet", "dehors"], bloque: ["Refused (Offline only)", "ok"] };
  let filtre = "tout";

  function resume(){
    const l = nettoyer(lireL()), jour = Date.now() - 864e5;
    const dehors24 = l.filter(e => e.lieu === "internet" && e.quand >= jour);
    const chats = l.filter(e => e.quand >= jour && /\/v1\/chat\/completions/.test(e.adresse || ""));
    const ou = [...new Set(chats.map(e => e.lieu))];
    const conv = !chats.length ? "" : " " + (ou.length === 1 && ou[0] === "appareil" ? tr("Your conversations stayed on this device.")
      : ou.includes("internet") ? tr("Some messages went to an AI on the internet (see the log).") : tr("Some messages went to a computer at home."));
    const n = dehors24.length;
    const refus = l.filter(e => e.lieu === "bloque" && e.quand >= jour).length;
    const noteRefus = !refus ? "" : " " + (LANGUE ? LANGUE.pluriel(refus, "{n} connection to the internet was refused (“Offline only”).", "{n} connections to the internet were refused (“Offline only”).") : `${refus} connection(s) to the internet refused (“Offline only”).`);
    const el = $("journal-resume");
    if (el) el.textContent = echec ? tr("The log could not be saved: this browser's storage is full.")
      : !l.length ? tr("Nothing recorded yet.")
      : (!n ? tr("Last 24 hours: Merge did not go on the internet.") : LANGUE ? LANGUE.pluriel(n, "Last 24 hours: {n} time Merge went, or tried to go, on the internet.", "Last 24 hours: {n} times Merge went, or tried to go, on the internet.")
        : `Last 24 hours: ${n} time${n > 1 ? "s" : ""} Merge went, or tried to go, on the internet.`) + noteRefus + conv;
  }
  function rendre(){
    const l = nettoyer(lireL()).slice().reverse();
    const liste = filtre === "tout" ? l : l.filter(e => e.lieu === "internet");
    const n = { appareil: 0, maison: 0, internet: 0 };
    l.forEach(e => { n[e.lieu] = (n[e.lieu] || 0) + 1; });
    $("journal-totaux").innerHTML = Object.entries(LIEUX).filter(([k]) => k !== "bloque" || n[k]).map(([k, [t, c]]) => `<li class="${c}"><b>${n[k] || 0}</b> ${esc(tr(t).toLowerCase())}</li>`).join("");
    $("journal-liste").innerHTML = liste.length ? liste.slice(0, 300).map(e => {
      const [t, c] = LIEUX[e.lieu] || LIEUX.internet;
      const quand = new Date(e.quand).toLocaleString(locale(), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const details = [e.lieu === "internet" ? e.adresse : e.hote === "this device" ? tr("this device") : e.hote, e.envoye ? tr("sent {taille}", { taille: octets(e.envoye) }) : "", e.recu ? tr("received {taille}", { taille: octets(e.recu) }) : "", typeof e.statut === "number" ? (e.statut < 400 ? "OK" : tr("error {n}", { n: e.statut })) : e.statut ? tr(e.statut) : ""].filter(Boolean).join(" · ");
      const fois = e.fois > 1 ? " · " + tr("{n} times, last at", { n: e.fois }) : "";
      const note = e.cache ? " " + tr("(private chat: your question was not kept)") : "";
      const prevu = e.prevu ? tr("about {taille} to download", { taille: octets(e.prevu) }) : "";
      return `<li class="${c}"><span class="pastille" aria-hidden="true"></span><span><b>${esc(phrase(e) + note)}</b><small>${esc(tr(t))}${esc(fois ? fois + " " : " · ")}${esc(quand)}</small><small class="brut">${esc([details, prevu].filter(Boolean).join(" · "))}</small></span></li>`;
    }).join("") : `<li class="vide">${esc(filtre === "tout" ? tr("Nothing recorded yet.") : tr("Nothing left this device."))}</li>`;
    const taille = JSON.stringify(lireL()).length;
    $("journal-place").textContent = (echec ? tr("The last entry could not be saved: this browser's storage is full.") + " " : "")
      + tr("The log uses {taille} of this browser's storage, out of {volume} allowed (your chats share this space). Entries older than {duree} are deleted; when space runs out, what stayed on this device goes first.", { taille: octets(taille), volume: tr(VOLUMES[reglages.volume]), duree: tr(DUREES[reglages.duree]) });
  }

  function brancher(){
    if (!$("journal")) return;
    resume();
    window.mergeJournalChange = () => { resume(); if ($("journal").open) rendre(); };
    $("ouvrir-journal").addEventListener("click", () => {
      $("journal-duree").value = String(reglages.duree); $("journal-volume").value = String(reglages.volume);
      rendre(); $("journal").showModal();
    });
    $("journal-filtre").addEventListener("change", e => { filtre = e.target.value; rendre(); });
    $("journal-duree").addEventListener("change", e => { reglages.duree = Number(e.target.value); ecrireJ(CLE_REGLAGES, reglages); ecrireL(nettoyer(lireL())); rendre(); resume(); });
    $("journal-volume").addEventListener("change", e => { reglages.volume = Number(e.target.value); ecrireJ(CLE_REGLAGES, reglages); ecrireL(nettoyer(lireL())); rendre(); resume(); });
    $("journal-telecharger").addEventListener("click", () => {
      const contenu = JSON.stringify({ quoi: "Merge connection log: the requests made by Merge's chat window in this browser, and the AI downloads its installer noted here", exporte_le: new Date().toISOString(), reglages, entrees: lireL() }, null, 2);
      const url = URL.createObjectURL(new Blob([contenu], { type: "application/json" }));
      const a = Object.assign(document.createElement("a"), { href: url, download: `merge-log-${new Date().toISOString().slice(0, 10)}.json` });
      document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
    });
    let arme = null;
    window.addEventListener("merge-langue", () => window.mergeJournalChange());
    $("journal-effacer").addEventListener("click", e => {
      const b = e.currentTarget;
      if (!arme){ b.textContent = tr("Click again to clear"); arme = setTimeout(() => { arme = null; b.textContent = tr("Clear the log"); }, 3000); return; }
      clearTimeout(arme); arme = null; b.textContent = tr("Clear the log");
      ecrireL([]); rendre(); resume();
    });
  }
  window.MergeJournal = { ajouter, lieu, horsLigne, effacer: () => { ecrireL([]); resume(); }, privee: v => { prive = !!v; } };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", brancher); else brancher();
})();
