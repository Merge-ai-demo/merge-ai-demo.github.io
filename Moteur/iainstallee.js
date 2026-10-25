(() => {
  "use strict";
  const tr = window.LangueAppli ? window.LangueAppli.t : (s, v) => { s = String(s).split("|")[0]; return v ? s.replace(/\{(\w+)\}/g, (x, k) => (k in v ? v[k] : x)) : s; };
  const $ = (id) => document.getElementById(id);
  const apple = () => !!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.mergeIA);
  const android = () => !!(window.MergeAndroid && window.MergeAndroid.iaInstallee);
  const pc = () => location.protocol === "http:" && /^\/merge\//.test(location.pathname);
  const go = (o) => (o / 1e9).toLocaleString(window.LangueAppli ? window.LangueAppli.locale : "en-US", { maximumFractionDigits: 1 });

  async function demander(action, d = {}) {
    if (apple()) return window.webkit.messageHandlers.mergeIA.postMessage({ action, ...d });
    if (android()) {
      if (action === "iaInstallee") return JSON.parse(window.MergeAndroid.iaInstallee() || "{}");
      if (action === "supprimerIA") { const r = JSON.parse(window.MergeAndroid.supprimerIA(d.id) || "{}"); if (r.erreur) throw new Error(tr(r.erreur)); return r; }
      if (action === "installer") { window.MergeAndroid.installer(); return { ok: true }; }
    }
    if (pc()) {
      if (action === "installer") { location.href = "/installateur/index.html"; return { ok: true }; }
      const rep = await fetch("/api/" + action, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) });
      const r = await rep.json();
      if (r.erreur) throw new Error(tr(r.erreur));
      return r.resultat;
    }
    return null;
  }

  let actuelle = null, confirme = false, aEffacer = null;
  const rechercher = () => { const b = $("rechercher"); if (b) b.click(); };
  async function utiliser(ia, bouton) {
    if (bouton) { bouton.disabled = true; bouton.textContent = tr("Starting…"); }
    try {
      await demander("utiliserIA", { id: ia.id, dossier: ia.dossier });
      await afficher();
      $("ia-installee-texte").textContent += " " + tr("Merge now uses this AI.");
      rechercher();
    } catch (e) { alert(e.message || tr("Merge could not do it. Try again.")); await afficher(); }
  }
  function afficherAutres() {
    const zone = $("ia-autres");
    if (!zone) return;
    const autres = (actuelle && actuelle.installee && Array.isArray(actuelle.autres)) ? actuelle.autres : [];
    zone.hidden = !autres.length;
    zone.innerHTML = "";
    if (!autres.length) return;
    const titre = document.createElement("p"); titre.className = "aide"; titre.textContent = tr("Other AIs kept on this device:");
    zone.append(titre);
    autres.forEach((ia) => {
      const ligne = document.createElement("div"); ligne.className = "ia-autre";
      const nom = document.createElement("span");
      nom.textContent = tr("{nom} · {taille} GB", { nom: (window.nomCourtIA || String)(ia.nom), taille: go(ia.octets) }) + (ia.images ? " · " + tr("sees photos") : "");
      const prendre = document.createElement("button"); prendre.type = "button"; prendre.className = "bouton-second"; prendre.textContent = tr("Use this one");
      prendre.addEventListener("click", () => utiliser(ia, prendre));
      const effacer = document.createElement("button"); effacer.type = "button"; effacer.className = "bouton-lien"; effacer.textContent = tr("Delete");
      effacer.addEventListener("click", async () => {
        if (aEffacer !== ia) { aEffacer = ia; effacer.textContent = tr("Click again to delete it ({taille} GB freed)", { taille: go(ia.octets) }); return; }
        try { await demander("supprimerIA", { id: ia.id, dossier: ia.dossier }); aEffacer = null; await afficher(); }
        catch (e) { alert(e.message || tr("Merge could not do it. Try again.")); }
      });
      ligne.append(nom, prendre, effacer);
      zone.append(ligne);
    });
  }
  async function afficher() {
    const groupe = $("groupe-ia-installee");
    if (!groupe) return;
    if (!apple() && !android() && !pc()) { groupe.hidden = true; return; }
    try { actuelle = await demander("iaInstallee"); } catch { actuelle = null; }
    groupe.hidden = !actuelle;
    if (!actuelle) return;
    confirme = false;
    const b = $("ia-supprimer");
    b.hidden = !actuelle.installee;
    b.textContent = tr("Delete this AI");
    $("ia-installee-texte").textContent = actuelle.installee
      ? tr("{nom} · {taille} GB, on this device.", { nom: (window.nomCourtIA || String)(actuelle.nom), taille: go(actuelle.octets) })
        + (actuelle.images ? " " + tr("It can look at photos.") : "")
      : actuelle.essai ? tr("Trial mode: no AI is installed on this device.") : tr("No AI is installed on this device.");
    afficherAutres();
  }

  function brancher() {
    if (!$("groupe-ia-installee")) return;
    $("ia-supprimer").addEventListener("click", async () => {
      if (!actuelle || !actuelle.installee) return;
      if (!confirme) {                              // deux clics : on dit ce qui va se passer
        confirme = true;
        $("ia-supprimer").textContent = tr("Click again to delete it ({taille} GB freed)", { taille: go(actuelle.octets) });
        return;
      }
      try {
        const r = await demander("supprimerIA", { id: actuelle.id, dossier: actuelle.dossier });
        const taille = go(actuelle.octets);
        if (r && r.suivante) { await utiliser(r.suivante); $("ia-installee-texte").textContent = tr("Deleted: {taille} GB freed.", { taille }) + " " + $("ia-installee-texte").textContent; return; }
        await afficher();
        $("ia-installee-texte").textContent = r && r.ok === false
          ? tr("The AI is no longer used, but some of its files could not be deleted. You can delete this folder yourself: {dossier}", { dossier: r.restes || "?" })
          : tr("Deleted: {taille} GB freed. To chat again, install an AI.", { taille });
      } catch (e) { alert(e.message || tr("Merge could not do it. Try again.")); }
    });
    $("ia-installer").addEventListener("click", () => demander("installer").catch(() => {}));
    const onglet = $("onglet-modele");
    if (onglet) onglet.addEventListener("click", afficher);
    afficher();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", brancher); else brancher();
  window.MergeIAInstallee = { afficher };
})();
