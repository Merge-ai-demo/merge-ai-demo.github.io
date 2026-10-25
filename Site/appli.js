"use strict";
(async () => {
  const zone = document.getElementById("programme");
  let p = window.MERGE_PONT;
  if (!p){
    const os = (location.hash.match(/os=(\w+)/) || [])[1] || "mac";
    const apercu = Programme.pontApercu(os);
    let tailles = {}, taillesImages = {};
    const go = l => Math.round(l.reduce((s, f) => s + f.octets, 0) / 1e8) / 10;
    try {
      const cat = await (await fetch("catalogue.json")).json();
      for (const [id, m] of Object.entries(cat.modeles)){
        tailles[id] = go(m.fichiers.filter(f => f.role !== "images"));
        if (m.fichiers.some(f => f.role === "images")) taillesImages[id] = go(m.fichiers.filter(f => f.role === "images"));
      }
    } catch (e) {}
    p = {os, interface: "../Moteur/index.html", pont: (action, d) => action === "diagnostic" ? apercu(action, d).then(x => ({...x, tailles, taillesImages}))
      : action === "ouvrirMerge" ? Promise.resolve({ok: true, essai: true, adresse: "../Moteur/index.html"}) : apercu(action, d)};
  }
  if (location.hash === "#demarrage"){
    zone.innerHTML = `<div class="fen"><div class="fen-corps"><ul class="verif"><li class="encours"><span class="rond"></span><b>${t("Starting your AI…")}</b><span class="val"></span></li></ul></div></div>`;
    try {
      const r = await p.pont("ouvrirMerge");
      if (r && r.pret === false) throw new Error(t("The AI is taking long to start. Open Merge, wait a minute, then click “Look again” in Settings."));
      if (r && r.adresse) location.href = r.adresse;
    }
    catch (err) {
      const esc = s => String(s).replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
      zone.innerHTML = `<div class="fen"><div class="fen-corps"><p class="alerte"><span>${esc(String(err && err.message || err))}</span></p>
        <div class="fen-btns"><button type="button" class="btn" id="p-quand-meme">${t("Open Merge anyway")}</button></div></div></div>`;
      zone.querySelector("#p-quand-meme").onclick = () => { if (p.interface) location.href = p.interface; };
    }
    return;
  }
  Programme.lancer(zone, {pont: p.pont, interface: p.interface, apercu: false});
})();
