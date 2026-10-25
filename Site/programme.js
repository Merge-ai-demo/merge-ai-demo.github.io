"use strict";

const Programme = (() => {
  const esc = s => String(s).replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
  const ico = (nom, cls = "") => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONES[nom] || ""}</svg>`;
  const pieuvre = () => `<span class="lettre-m" aria-hidden="true">M</span>`;   // le « M » de Merge (18 oct. au soir), à la place de la pieuvre
  const go = n => Langue.go(n);
  const animer = () => typeof matchMedia === "function" && !matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ecouteurs = [];
  window.mergeEvenement = e => ecouteurs.forEach(f => f(e));

  function lancer(zone, o){
    let actif = true, minuteurs = [], diag = null, machine = null, emplacements = [], choixDossier = null;
    let redessiner = null;
    let besoins = Array.isArray(o.besoins) ? o.besoins.slice() : [], voulue = modele(o.voulue) || null, premierEcran = true;
    let dejaRepondu = Array.isArray(o.besoins);
    const plus = t => minuteurs.push(t);
    const arreter = () => { actif = false; minuteurs.forEach(clearTimeout); minuteurs = []; ecouteurs.length = 0; };
    const vite = animer() ? 1 : 0.1;
    const pont = o.pont;
    const tel = () => machine && machine.telephone;
    const nom = () => machine ? machine.nom : "computer";     // en anglais : t() le traduit ({nom})
    const taille = m => EST.fichier(m);   // vraie taille (catalogue) si on la connaît, sinon estimation
    const bandeauDefaut = () => o.apercu ? t("Preview: nothing is downloaded or installed") : (diag && diag.essai ? t("Trial mode: nothing is downloaded or installed") : "");

    const ecran = (corps, bandeau, redessin = null) => {
      if (!actif) return;
      redessiner = redessin;
      const b = bandeau === undefined ? bandeauDefaut() : bandeau;
      zone.innerHTML = `<div class="fen">${o.barre || ""}${b ? `<div class="apercu">${esc(b)}</div>` : ""}<div class="fen-corps">${corps}</div></div>`;
      const f = ["[data-focus]", ".btn:not(:disabled)"].map(x => zone.querySelector(x)).find(Boolean);
      if (f && !premierEcran) f.focus({preventScroll: true});
      premierEcran = false;
      if (o.apercu){ const r = zone.getBoundingClientRect(); if (r.top < 60) window.scrollTo({top: window.scrollY + r.top - 80, behavior: animer() ? "smooth" : "auto"}); }
    };
    const entete = (t, s) => `<div class="entete"><span class="app">${pieuvre()}</span><div><h2 id="install-titre" tabindex="-1" data-focus>${t}</h2><p>${s}</p></div></div>`;
    const liste_ = n => Langue.enumerer(n);
    const exemple = () => !o.apercu ? undefined : diag.reconnu
      ? t(diag.puceExemple ? "Preview: your {nom} is recognized; its chip, memory and free space are an example ({m}). The real Merge reads them. Nothing is downloaded."
        : "Preview: your {nom} is recognized; its memory and free space are an example ({m}). The real Merge reads them. Nothing is downloaded.", {nom: diag.appareil, m: go(machine.memoire)})
      : t("Preview: the values are an example (a {m} {nom}). Nothing is read, sent or downloaded.", {nom: machine.nom, m: go(machine.memoire)});

    const langues = () => Langue.codes.length < 2 ? "" : `<p class="p-langues" role="group" aria-label="${esc(t("Language"))}">${Langue.codes.map(c => c === Langue.code
      ? `<span lang="${c}" aria-current="true">${esc(Langue.noms[c])}</span>` : `<button type="button" class="lien-btn" lang="${c}" data-langue="${c}">${esc(Langue.noms[c])}</button>`).join(" · ")}</p>`;
    const lignes = () => {
      const L = [[t("Memory"), go(machine.memoire)]];
      if (tel()) L.unshift([t("Phone"), Langue.nomAppareil(diag.appareil || machine.nom)]);
      else {
        if (diag.appareil) L.unshift([t(machine.os === "mac" ? "Mac" : "Computer"), Langue.nomAppareil(diag.appareil)]);
        L.push([t(machine.os === "mac" ? "Chip" : "Processor"), diag.puce || "—"]);
      }
      if (diag.libre != null) L.push([t("Free space"), go(diag.libre)]);
      return L;
    };
    const carte = b => `<button type="button" class="besoin" aria-pressed="${besoins.includes(b.id)}" data-besoin="${b.id}">${ico(b.icone)}<span><b>${esc(t(b.nom))}</b><small>${esc(t(b.detail))}</small></span></button>`;
    const usages = () => besoinsPour(machine).filter(b => !b.groupe && (!b.voix || machine.os === "mac" || machine.os === "windows"));
    const aLire = () => besoinsPour(machine).filter(b => b.groupe === "lire" && (!b.photos || photosPossibles(machine)));
    let examine = false;
    const accueil = () => {
      const L = lignes();
      ecran(`<div class="entete accueil-entete"><span class="app">${pieuvre()}</span><div><h2 id="install-titre" tabindex="-1" data-focus>${esc(t("Let's set up your free AI"))}</h2>
          <p>${esc(t(tel() ? "Merge has looked at your phone. Nothing was sent anywhere." : machine.os === "mac" ? "Merge has looked at your Mac. Nothing was sent anywhere." : "Merge has looked at your computer. Nothing was sent anywhere."))}</p></div></div>
        <ul class="verif compacte" aria-label="${esc(t("What Merge looked at"))}">${L.map(([l, v], k) => `<li data-k="${k}" class="${examine ? "fait" : ""}"><span class="rond">${examine ? ico("check") : ""}</span><b>${esc(l)}</b><span class="val">${esc(v)}</span></li>`).join("")}</ul>
        <p class="q-titre">${esc(t("What will you use it for?"))} <small>${esc(t("Pick any, or none: Merge suggests the AI that suits you."))}</small></p>
        <div class="besoins" role="group" aria-label="${esc(t("What you will use Merge for"))}">${usages().map(carte).join("")}</div>
        ${aLire().length ? `<p class="q-titre">${esc(t("Will you give it things to read?"))}</p><div class="besoins" role="group" aria-label="${esc(t("What you will give it to read"))}">${aLire().map(carte).join("")}</div>` : ""}
        <div class="fen-btns"><button type="button" class="btn" id="p-suite">${esc(t("Continue"))}</button></div>${langues()}`, exemple(), () => accueil());
      if (examine) return;
      examine = true;
      L.forEach((x, k) => {
        plus(setTimeout(() => { const li = zone.querySelector(`[data-k="${k}"]`); if (li) li.classList.add("encours"); }, k * 260 * vite));
        plus(setTimeout(() => { const li = zone.querySelector(`[data-k="${k}"]`); if (!li) return; li.classList.remove("encours"); li.classList.add("fait"); li.querySelector(".rond").innerHTML = ico("check"); }, (k * 260 + 240) * vite));
      });
    };
    const questions = () => accueil();
    const suite = () => resultat();

    const decimales = v => Object.fromEntries(Object.entries(v).map(([k, x]) => [k, typeof Langue === "object" && Langue.code === "fr" ? String(x).replace(/(\d)\.(\d)/g, "$1,$2") : x]));
    let choisie = null, wifiSeulement = true, prefs = {origine: "toutes", priorite: "equilibre", relues: false};
    const noter = e => { if (o.apercu || (diag && diag.essai)) return; const x = {lieu: "internet", hote: "huggingface.co", ...e};
      if (window.MergeJournal) return window.MergeJournal.ajouter(x);
      try { const l = JSON.parse(localStorage.getItem("merge.journal") || "[]"); l.push({quand: Date.now(), ...x}); localStorage.setItem("merge.journal", JSON.stringify(l.slice(-300))); } catch (_) {} };
    const resultat = () => {
      let liste, reco;
      const ok = m => installable(m);
      if (besoins.length){ liste = conseilsPour(machine, besoins).filter(ok).slice(0, 3); reco = liste[0]; }
      else { const p = propositions(machine); liste = p.liste.filter(ok); reco = p.reco; }
      let horsPrefs = false;
      if (prefs.origine !== "toutes" || prefs.priorite !== "equilibre" || prefs.relues){
        const tous = conseilsPour(machine, besoins.length ? besoins : [tel() ? "messages" : "quotidien"]).filter(ok);
        let l = preferer(tous, machine, prefs).slice(0, 3);
        if (!l.length) l = preferer(iaPour(machine).filter(y => ok(y) && EST.tient(y, machine) && vitesse(y, machine).niveau >= vitesseMin(machine) && !y.specialiste)
          .sort((a, b) => savoir(b).niveau - savoir(a).niveau || b.total - a.total), machine, prefs).slice(0, 3);
        if (l.length){ liste = l; reco = l[0]; } else horsPrefs = true;
      }
      if (!reco || !ok(reco)){ reco = liste[0] || iaPour(machine).filter(ok)[0]; if (!liste.length && reco) liste = [reco]; }
      if (!reco){         // catalogue vide ou illisible : on le dit au lieu de planter
        ecran(`<p class="alerte">${ico("alert")}<span>${esc(t("Merge could not read its list of AIs. Please download Merge again."))}</span></p>
          <div class="fen-btns"><button type="button" class="btn discret" id="p-annuler">${esc(t("Cancel"))}</button></div>`);
        return;
      }
      if (voulue && ok(voulue) && !liste.includes(voulue)) liste.splice(1, 0, voulue);
      if (choisie && !liste.includes(choisie)) liste.push(choisie);
      if (!choisie) choisie = voulue && ok(voulue) ? voulue : reco;
      const B = [...besoinsPour(machine), ...METIERS], metier = metierDe(besoins);
      const nomsBesoins = B.filter(b => besoins.includes(b.id) && !(metier && b.id === "travail") && b.id !== "autre").map(b => t(b.nom).toLowerCase());
      const pour = x => [...new Set([...(metier && x.specialiste && [metier.specialiste, metier.aussi].includes(x.specialiste) ? [t(metier.nom)] : []),
        ...besoinsPour(machine).filter(b => b.id !== "travail" && besoins.includes(b.id) && b.tags.length && (b.photos ? voitImages(x) : x.bon.includes(b.tags[0]))
          && (!b.specialiste || x.specialiste === b.specialiste)).map(b => t(b.nom))])];
      const li = (texte, lent) => `<li class="${lent ? "lent" : ""}">${ico(lent ? "clock" : "check")}<span>${lent ? esc(t("Slower: {x}", {x: texte.charAt(0).toLowerCase() + texte.slice(1)})) : esc(texte)}</span></li>`;
      const option = x => {
        const v = vitesse(x, machine), s = savoir(x), p = pour(x);
        return `<label class="option"><input type="radio" name="ia" value="${esc(x.id)}"${x === choisie ? " checked" : ""}><span><b>${esc(x.nom)}${x === reco ? ` <span class="badge">${esc(t("Recommended"))}</span>` : ""}${x === voulue && x !== reco ? ` <span class="badge doux">${esc(t("Your pick"))}</span>` : ""}</b>
          <span class="quoi">${esc(Langue.phrase(x))}</span>${p.length ? `<span class="pour">${esc(t("Good for: {x}", {x: p.join(", ")}))}</span>` : ""}<span class="infos">${esc(v.mot)} · ${esc(s.mot)} · ${go(taille(x))}${LANGUE === "fr" && x.fr ? " · " + esc(t("French listed")) : ""}</span>
          <span class="origine">${esc(t("Made by {e}", {e: x.editeur + (x.pays ? ", " + t(x.pays) : "")}))}</span></span></label>`;
      };
      const toutes = iaPour(machine).filter(ok).slice().sort((a, b) => a.total - b.total);
      const manque = usagesNonCouverts(machine, besoins).map(b => t(b.nom).toLowerCase());
      const cc = capacites(choisie, machine, photosVoulues(), voixVoulue());
      const v = vitesse(choisie, machine), sv = savoir(choisie), pc = pour(choisie);
      const autresOuvert = choisie !== reco || prefs.origine !== "toutes" || prefs.priorite !== "equilibre" || prefs.relues;
      ecran(`<h2 class="res-titre" id="install-titre" tabindex="-1" data-focus>${esc(capacites(reco, machine, photosVoulues(), voixVoulue()).titre)}</h2>
        ${nomsBesoins.length ? `<p class="q-sous">${esc(t("Chosen for {x}.", {x: liste_(nomsBesoins)}))} <button type="button" class="lien-btn" id="p-retour">${esc(t("Change my answers"))}</button></p>`
          : `<p class="q-sous"><button type="button" class="lien-btn" id="p-retour">${esc(t("Tell Merge what you'll use it for"))}</button> ${esc(t("to get a better match."))}</p>`}
        ${manque.length ? `<p class="alerte">${ico("alert")}<span>${esc(t("This {nom} is a little small for {x}: the AIs below can only help a little with it.", {nom: nom(), x: liste_(manque)}))}</span></p>` : ""}
        ${liste.some(y => y.specialiste === "sante") ? `<p class="alerte">${ico("alert")}<span>${esc(t("AIs trained on medical texts can still be wrong. Use them to help you think, never in place of your own judgement."))}</span></p>` : ""}
        ${B.filter(b => besoins.includes(b.id) && b.specialiste && !liste.some(y => y.specialiste === b.specialiste)).slice(0, 1).map(b => `<p class="q-sous">${esc(t(!MODELES.some(m => installable(m) && m.specialiste === b.specialiste) ? (b.specialiste === "sante" ? "Merge has no AI made for {x} yet: here are the best all-round ones. They can be wrong on health questions." : "Merge has no AI made for {x} yet: here are the best all-round ones.") : b.specialiste === "sante" ? "No AI made for {x} fits this {nom} yet: here are the best all-round ones. They can be wrong on health questions." : "No AI made for {x} fits this {nom} yet: here are the best all-round ones.", {x: t(b.nom).toLowerCase(), nom: nom()}))}</p>`).join("")}
        <div class="carte-ia"><p class="carte-nom"><b>${esc(choisie.nom)}</b>${choisie === reco ? ` <span class="badge">${esc(t("Recommended"))}</span>` : ""}</p>
          <p class="quoi">${esc(Langue.phrase(choisie))}</p>${pc.length ? `<p class="pour">${esc(t("Good for: {x}", {x: pc.join(", ")}))}</p>` : ""}
          <p class="infos">${esc(v.mot)} · ${esc(sv.mot)} · ${go(taille(choisie) + (photosVoulues() && voitImages(choisie) ? tailleImages(choisie) : 0))}</p>
          <ul class="peut">${cc.peut.map(t => li(t)).join("")}${cc.lent.map(t => li(t, true)).join("")}</ul></div>
        <div id="p-alerte"></div>
        ${voixVoulue() ? voixDispo() : ""}
        <div class="rassure"><p class="rassure-titre">${ico("shield-check")}${esc(t("What happens when you click Install"))}</p><ol id="p-ce-qui-se-passe"></ol></div>
        <div class="fen-btns"><button type="button" class="btn discret" id="p-annuler">${esc(t("Cancel"))}</button><button type="button" class="btn" id="p-installer">${esc(t("Install"))}</button></div>
        <details class="autres"${autresOuvert ? " open" : ""}><summary>${esc(t("Other choices"))}</summary>
          <p class="choix-titre">${esc(t("Choose your AI"))}</p><fieldset class="choix-ia"><legend class="cache-ecran">${esc(t("Choose your AI"))}</legend>${liste.map(option).join("")}</fieldset>
          <label class="voir-tout"><span>${esc(t("Or pick any of the {n} AIs for this {nom}:", {n: toutes.length, nom: nom()}))}</span>
            <select id="p-toutes"><option value="">${esc(t("All AIs, smallest first…"))}</option>${[[t("Fit this {nom}", {nom: nom()}), toutes.filter(x => EST.tient(x, machine))], [t("Too big for this {nom}", {nom: nom()}), toutes.filter(x => !EST.tient(x, machine))]]
              .filter(([, l]) => l.length).map(([groupe, l]) => `<optgroup label="${esc(groupe)}">${l.map(x => `<option value="${esc(x.id)}">${esc(x.nom)} · ${esc(x.editeur)} · ${go(taille(x))}</option>`).join("")}</optgroup>`).join("")}</select></label>
          <div class="prefs">
            <label>${esc(t("Made in"))} <select id="p-origine">${Object.entries(ORIGINES).map(([k, v]) => `<option value="${k}"${prefs.origine === k ? " selected" : ""}>${esc(t(v.nom))}</option>`).join("")}</select></label>
            <label>${esc(t("What matters most"))} <select id="p-priorite">${Object.entries(PRIORITES).map(([k, v]) => `<option value="${k}"${prefs.priorite === k ? " selected" : ""}>${esc(t(v))}</option>`).join("")}</select></label>
            <small>${esc(t("Every AI runs on this {nom} and keeps nothing elsewhere, wherever it comes from.", {nom: nom()}))}</small>
            ${horsPrefs ? `<p class="alerte">${ico("alert")}<span>${esc(t("No AI fits these preferences on this {nom}: here is Merge's usual choice.", {nom: nom()}))}</span></p>` : ""}
          </div>
          ${tel() ? "" : `<div class="dossier"><span>${ico("folder")}${esc(t("Put it in"))}</span><select id="p-dossier" aria-label="${esc(t("Where to put the AI"))}">${emplacements.map(d => `<option value="${esc(d.chemin)}"${d.chemin === choixDossier ? " selected" : ""}>${esc(t(d.nom))}</option>`).join("")}<option value="__autre">${esc(t("Choose another folder…"))}</option></select></div>`}
          ${tel() ? `<label class="wifi"><input type="checkbox" id="p-wifi"${wifiSeulement ? " checked" : ""}><span>${esc(t("Download only on Wi-Fi (Merge waits for Wi-Fi, so your mobile data is not used)"))}</span></label>` : ""}
        </details>`,
        o.apercu ? t("Preview: example {m} {nom}. Speeds are estimates. Nothing is downloaded.", {m: go(machine.memoire), nom: machine.nom}) : undefined, () => resultat());
      majChoix();
      zone.querySelector(".choix-ia").addEventListener("change", () => { choisie = modele(zone.querySelector("input[name=ia]:checked").value); resultat(); });
      $p("#p-toutes").addEventListener("change", e => { const x = modele(e.target.value); if (!x) return; choisie = x; resultat(); });
      const w = $p("#p-wifi"); if (w) w.addEventListener("change", e => { wifiSeulement = e.target.checked; });
      $p("#p-origine").addEventListener("change", e => { prefs.origine = e.target.value; choisie = null; resultat(); });
      $p("#p-priorite").addEventListener("change", e => { prefs.priorite = e.target.value; choisie = null; resultat(); });
      zone.querySelector("#p-alerte").addEventListener("click", e => { const b = e.target.closest("#p-plus-petite, #p-reco"); if (!b) return; const y = modele(b.dataset.ia); if (y){ choisie = y; resultat(); } });
      zone.querySelector("#p-alerte").addEventListener("change", e => { if (e.target.id === "p-compris"){ compris = e.target.checked ? choisie.id : null; majChoix(); } });
      const sel = $p("#p-dossier");
      if (sel) sel.addEventListener("change", async e => {
        if (e.target.value !== "__autre"){ choixDossier = e.target.value; majChoix(); return; }
        const d = await pont("choisirDossier").catch(() => null);
        if (d){ emplacements = emplacements.filter(x => x.chemin !== d.chemin).concat(d); choixDossier = d.chemin; }
        resultat();
      });
    };
    const $p = s => zone.querySelector(s);
    const voixDispo = () => {
      const mac = machine.os === "mac";
      const lignes = [
        [t("Standard voice"), t(mac ? "Comes with your Mac: nothing to download, very light. Merge starts with it." : "Comes with Windows: nothing to download, very light. Merge starts with it.")],
        [t(mac ? "More natural voice" : "More voices"), t(mac ? "An Apple “Enhanced” or “Premium” voice, free. You download it in System Settings › Accessibility › Spoken Content (Read & Speak on recent macOS) › System voice › Manage Voices, then choose it in Merge. It sounds more human and uses a little more power." : "Merge uses the voices installed on this PC that work offline. Windows comes with a few; how natural they sound depends on your Windows.")],
        [t("AI voices, even more natural"), t("Coming in an update. They will need a download of a few hundred MB, and more memory and battery.")],
      ];
      return `<div class="voix-choix"><p class="rassure-titre">${ico("mic")}${esc(t("Your AI's voice"))}</p><ul>${lignes.map(([a, b]) => `<li><b>${esc(a)}</b> ${esc(b)}</li>`).join("")}</ul>
        <small>${esc(t("Talking uses your {nom}'s own dictation and voice: nothing to download, much less memory than the AI, and your voice stays on your {nom}.", {nom: nom()}))}${vitesse(choisie, machine).niveau < 4 ? " " + esc(t("For talking, a faster AI answers sooner: see Other choices.")) : ""}</small></div>`;
    };
    const photosVoulues = () => besoins.includes("photos") && photosPossibles(machine);
    const voixVoulue = () => besoins.includes("voix") && !tel() && (machine.os === "mac" || machine.os === "windows");
    const depart = () => modele(IA_DE_DEPART);
    const avecDepart = x => !tel() && x.id !== IA_DE_DEPART && x.total > depart().total && installable(depart());
    const dossierChoisi = () => emplacements.find(d => d.chemin === choixDossier) || emplacements[0];
    let compris = null;
    function majChoix(){
      const x = choisie, img = photosVoulues() && voitImages(x) ? tailleImages(x) : 0;
      const dl = taille(x) + img + (avecDepart(x) ? taille(depart()) : 0), place = dl + 1, d = dossierChoisi();
      const libre = d ? d.libre : diag.libre, manque = libre != null && libre < place;
      const ou = tel() ? t("inside the Merge app") : d ? t(d.nom).replace(/\s*\((Merge folder|dossier Merge|carpeta de Merge)\)$/i, "") : t("Merge's folder");
      const etapes = [
        (avecDepart(x) ? t("Download {x} ({s}) from Hugging Face, the website where AI makers share their AIs. A small AI ({a}) comes first, so you can start chatting in a minute or two.", {x: x.nom, s: go(taille(x) + img), a: go(taille(depart()))})
          : t("Download {x} ({s}) from Hugging Face, the website where AI makers share their AIs.", {x: x.nom, s: go(taille(x) + img)}))
          + ((machine.os === "windows" || machine.os === "linux") && !(diag && diag.moteur) ? " " + t("Also the small program that runs it (about 30 MB), from GitHub, where its makers publish it.") : ""),
        machine.os === "windows" ? t("Save it in one folder ({ou}) and add a Merge shortcut to your desktop and Start menu. Your files, settings and other apps are not touched.", {ou})
          : machine.os === "linux" ? t("Save it in one folder ({ou}) and add Merge to your apps menu. Your files, settings and other apps are not touched.", {ou})
          : t("Save it in one folder ({ou}). Your files, settings and other apps are not touched.", {ou}),
        t("Open the chat. From then on, your AI works on this {nom}, even without internet. You can delete it at any time in Settings › Your AI.", {nom: nom()}),
      ];
      const ol = $p("#p-ce-qui-se-passe");
      if (ol) ol.innerHTML = etapes.map(e => `<li>${esc(e)}</li>`).join("")
        + `<li class="petit">${esc([libre == null ? t("Needs about {p} of free space.", {p: go(place)}) : tel() ? t("Needs about {p} of free space; {l} free on this {nom}.", {p: go(place), l: go(libre), nom: nom()}) : t("Needs about {p} of free space; {l} free there.", {p: go(place), l: go(libre)}),
          t("Files already on this {nom} are not downloaded again.", {nom: nom()}), t("If the connection drops, nothing is lost: click Try again to pick up where it stopped.")].join(" "))}</li>`;
      const tientDisque = y => taille(y) + (avecDepart(y) ? taille(depart()) : 0) + 1 <= libre;
      const autre = manque ? [...(besoins.length ? conseilsPour(machine, besoins) : propositions(machine).liste),
        ...iaPour(machine).filter(y => !y.specialiste && !y.plus && vitesse(y, machine).niveau >= vitesseMin(machine)).sort((a, b) => savoir(b).niveau - savoir(a).niveau || b.total - a.total)]
        .find(y => y !== x && installable(y) && EST.tient(y, machine) && tientDisque(y)) : null;
      const pasAssez = (o.apercu ? "Not enough free space" : "Maybe not enough free space") + (tel() ? "." : " there.");
      const memoireIA = Math.round((EST.memoire(x, machine) + img) * 10) / 10;
      const tropGrosse = !EST.tient(x, machine) || (img > 0 && memoireIA > machine.dispo && !(machine.vram > 0 && EST.fichier(x) + img + 1 <= machine.vram));
      const reco = besoins.length ? conseilsPour(machine, besoins).find(y => installable(y) && EST.tient(y, machine)) : conseilPour(machine);
      $p("#p-alerte").innerHTML = (manque ? `<p class="alerte">${ico("alert")}<span>${esc(t(pasAssez))} ${esc(t(tel() ? "Free up some space, or choose a smaller AI." : "Choose another place, or free up some space."))}${o.apercu ? "" : " " + esc(t("Merge checks exactly before downloading."))}${autre ? ` <button type="button" class="lien-btn" id="p-plus-petite" data-ia="${esc(autre.id)}">${esc(t("Take {x} instead ({s})", {x: autre.nom, s: go(taille(autre))}))}</button>` : ""}</span></p>` : "")
        + (tropGrosse ? `<div class="alerte danger" role="alert">${ico("alert")}<span><b>${esc(t("Careful: {x} is too big for this {nom}.", {x: x.nom, nom: nom()}))}</b>
            ${esc(t("It needs about {m} of memory, and this {nom} can only give an AI about {d} of its {k} (the rest is for the system and your apps). While it answers, your {nom} may freeze, other apps may close, and it may even restart. Unsaved work in other apps could be lost.", {m: go(memoireIA), d: go(Math.floor(machine.dispo * 10) / 10), k: go(machine.memoire), nom: nom()}))}
            ${reco && reco !== x ? ` <button type="button" class="lien-btn" id="p-reco" data-ia="${esc(reco.id)}">${esc(t("Take {x} instead, made for this {nom}", {x: reco.nom, nom: nom()}))}</button>` : ""}
            <label class="compris"><input type="checkbox" id="p-compris"${compris === x.id ? " checked" : ""}> ${esc(t("I understand the risk and want to install it anyway"))}</label></span></div>` : "");
      const bouton = $p("#p-installer");
      bouton.textContent = tropGrosse ? t("Install anyway") : t("Install {x}", {x: x.nom});
      bouton.classList.toggle("risque", tropGrosse);
      bouton.disabled = (!!manque && !!o.apercu) || (tropGrosse && compris !== x.id);
    }

    const installer = (dejaLancee = false) => {
      const enCours = dejaLancee && diag && diag.enCours ? diag.enCours : null;
      const x = choisie, dep = enCours ? (modele(enCours.depart) || null) : avecDepart(x) ? depart() : null;
      const avecImages = enCours ? enCours.images === true || enCours.images === "oui" : photosVoulues() && voitImages(x);
      const ETAPES = [
        {id: "merge", t: t("Getting Merge ready")},
        {id: "moteur", t: t("Getting the program that runs your AI ready"), s: machine.os === "mac" ? t("It comes with Merge: nothing to download") : ""},
        ...(dep ? [{id: "depart", t: t("Downloading {x}", {x: dep.nom}), s: t("{s} · a small AI, so you can start sooner", {s: go(taille(dep))}), dl: true}] : []),
        {id: "choisie", t: t("Downloading {x}", {x: x.nom}), s: t("{s} · from Hugging Face", {s: go(taille(x) + (avecImages ? tailleImages(x) : 0))}), dl: true},
        {id: "verif", t: t("Checking every file is intact"), s: t("Each file must match the one its maker published")},
      ];
      ecran(`${entete(esc(t("Installing your AI…")), esc([t(tel() ? "Keep Merge open until it's done." : "You can keep using your {nom} meanwhile.", {nom: nom()}), tel() && wifiSeulement ? t("Downloading on Wi-Fi only.") : "", t("If the connection drops, nothing is lost.")].filter(Boolean).join(" ")))}
        <p class="rassure court">${ico("shield-check")}<span>${esc(t("Merge is only downloading your AI and saving it in one folder. It doesn't change anything else on your {nom}.", {nom: nom()}))}</span></p>
        <ol class="etapes">${ETAPES.map(e => `<li data-id="${e.id}"><span class="rond"></span><span>${esc(e.t)}<small>${e.s ? esc(e.s) : ""}</small>${e.dl ? `<span class="barre-dl"><i></i></span>` : ""}</span></li>`).join("")}</ol>
        <div id="p-note"></div>
        <div class="fen-btns"><button type="button" class="btn discret" id="p-arreter">${esc(t("Stop"))}</button></div>`);
      ecouteurs.length = 0;
      const mesures = {};
      const resteTemps = s => {
        if (s < 60) return t("less than a minute left");
        const min = Math.round(s / 60);
        return min < 60 ? t("about {n} min left", {n: min}) : t("about {h} h {m} min left", {h: Math.floor(min / 60), m: min % 60});
      };
      const estimation = (id, recus, total) => {
        const maintenant = Date.now(), m = mesures[id] = mesures[id] || [];
        if (m.length && recus < m[m.length - 1].recus) m.length = 0;          // téléchargement repris de zéro
        m.push({quand: maintenant, recus});
        while (m.length > 2 && maintenant - m[0].quand > 15000) m.shift();
        const duree = (maintenant - m[0].quand) / 1000, gagne = recus - m[0].recus;
        if (duree < 1.5 || gagne <= 0) return t("estimating the time left…");
        return resteTemps((total - recus) / (gagne / duree));
      };
      ecouteurs.push(e => {
        if (!actif) return;
        if (e.type === "etape"){
          const li = zone.querySelector(`.etapes [data-id="${e.id}"]`); if (!li) return;
          for (let a = li.previousElementSibling; a; a = a.previousElementSibling) if (!a.classList.contains("fait")){ a.classList.remove("encours"); a.classList.add("fait"); a.querySelector(".rond").innerHTML = ico("check"); }
          li.classList.toggle("encours", e.etat === "encours");
          li.classList.toggle("fait", e.etat === "fait");
          if (e.etat === "fait") li.querySelector(".rond").innerHTML = ico("check");
          const def = ETAPES.find(y => y.id === e.id), petit = li.querySelector("small");
          if (e.total){
            const i = li.querySelector(".barre-dl i"); if (i) i.style.width = Math.min(100, 100 * e.recus / e.total) + "%";
            petit.textContent = e.etat === "encours"
              ? t("{a} of {b} from Hugging Face", {a: go(e.recus / 1e9), b: go(e.total / 1e9)}) + " · " + estimation(e.id, e.recus, e.total)
              : (def.s || "");
          }
          if (e.detail) petit.textContent = t(e.detail);
        } else if (e.type === "departPret" && dep){
          $p("#p-note").innerHTML = `<p class="alerte ok">${ico("check")}<span><b>${esc(t("{x} is ready.", {x: dep.nom}))}</b> ${esc(t("You can start chatting now; {y} keeps downloading and takes over when it's done. Or wait here: the chat opens by itself when {y} is ready.", {y: x.nom}))} <button type="button" class="btn petit" id="p-maintenant">${esc(t("Start chatting now"))}</button></span></p>`;
        } else if (e.type === "pret"){
          ecouteurs.length = 0; if (!e.essai) noter({texte: `Finished downloading ${x.nom}; every file checked`});
          if (o.apercu) pret(e.essai); else ouvrirMerge();
        } else if (e.type === "annule"){
          ecouteurs.length = 0; resultat();
        } else if (e.type === "erreur"){
          ecouteurs.length = 0;
          const li = zone.querySelector(".etapes li.encours");
          if (li){ li.classList.remove("encours"); li.querySelector(".rond").innerHTML = ico("x"); }
          $p("#p-note").innerHTML = `<p class="alerte">${ico("alert")}<span>${esc(e.modele ? t(e.modele, decimales(e.v || {})) : t(String(e.message || "")))}${e.reprenable === false ? "" : " " + esc(t("If the connection dropped, click Try again: Merge picks up where it stopped."))}</span></p>`;
          $p(".fen-btns").innerHTML = `<button type="button" class="btn discret" id="p-retour-res">${esc(t("Back"))}</button><button type="button" class="btn" id="p-reessayer" data-focus>${esc(t("Try again"))}</button>`;
          $p("#p-reessayer").focus();
        }
      });
      if (!dejaLancee) noter({texte: `Started downloading ${x.nom}${dep ? ` and ${dep.nom}` : ""} from Hugging Face`, prevu: Math.round((taille(x) + (dep ? taille(dep) : 0)) * 1e9)});
      if (!dejaLancee) pont("installer", {modele: x.id, depart: dep ? dep.id : null, dossier: tel() ? null : (dossierChoisi() || {}).chemin, wifiSeulement: tel() && wifiSeulement,
        images: avecImages})
        .catch(err => window.mergeEvenement({type: "erreur", message: String(err && err.message || err)}));
    };

    const pret = essai => {
      const fin = o.apercu ? (typeof o.fin === "function" ? o.fin() : o.fin || "") : `<button type="button" class="btn discret" id="p-fermer">${esc(t("Close"))}</button><button type="button" class="btn" id="p-ouvrir">${ico("sparkles")}${esc(t("Open Merge"))}</button>`;
      ecran(`<div class="pret"><span class="rond-ok">${ico("check")}</span><h2 id="install-titre" tabindex="-1" data-focus>${esc(t("Merge is ready"))}</h2>
        <p>${esc(essai && !o.apercu ? t("Trial mode: the whole path worked, but nothing was downloaded and Merge did not start any AI.") : t("{x} is installed on this {nom}. Ask as much as you like.", {x: choisie.nom, nom: nom()}))}</p>
        <div class="fen-btns">${fin}</div></div>`, undefined, () => pret(essai));
    };

    const ouvrirMerge = async () => {
      ecouteurs.length = 0;
      ecran(`${entete(esc(t(diag.essai ? "Opening Merge…" : "Starting your AI…")), diag.essai ? "" : esc(t("This can take a minute the first time")))}<ul class="verif"><li class="encours"><span class="rond"></span><b>Merge</b><span class="val"></span></li></ul>`);
      try {
        const r = await pont("ouvrirMerge");
        if (r && r.pret === false) throw new Error(t("The AI is taking long to start. Open Merge, wait a minute, then click “Look again” in Settings."));
        if (r && r.adresse) location.href = r.adresse;
      } catch (err) {
        ecran(`${entete("Merge", "")}<p class="alerte">${ico("alert")}<span>${esc(String(err && err.message || err))}</span></p>
          <div class="fen-btns"><button type="button" class="btn" id="p-quand-meme" data-focus>${esc(t("Open Merge anyway"))}</button></div>`);
      }
    };

    zone.onclick = e => {
      const b = e.target.closest("[data-besoin]");
      const lg = e.target.closest("[data-langue]");
      if (lg){ Langue.changer(lg.dataset.langue); const x = zone.querySelector(".p-langues button, .p-langues [aria-current]"); if (x) x.focus({preventScroll: true}); return; }
      if (b){ const id = b.dataset.besoin; besoins = besoins.includes(id) ? besoins.filter(x => x !== id) : [...besoins, id]; b.setAttribute("aria-pressed", String(besoins.includes(id))); return; }
      const id = (e.target.closest("button[id]") || {}).id;
      if (id === "p-suite"){ choisie = null; besoins = besoins.filter(x => !METIERS.some(y => y.id === x)); suite(); }
      else if (id === "p-passer"){ besoins = []; choisie = null; resultat(); }
      else if (id === "p-retour") questions();
      else if (id === "p-installer") installer();
      else if (id === "p-annuler"){
        if (o.apercu){ besoins = Array.isArray(o.besoins) ? o.besoins.slice() : []; voulue = null; choisie = null; accueil(); }
        else if (diag.dejaFait) pont("ouvrirMerge").then(r => { if (r && r.adresse) location.href = r.adresse; }).catch(() => {});
        else pont("quitter");
      }
      else if (id === "p-arreter"){ if (o.apercu){ arreter(); actif = true; besoins = []; voulue = null; choisie = null; accueil(); } else pont("annuler"); }
      else if (id === "p-retour-res") resultat();
      else if (id === "p-reessayer") installer();
      else if (id === "p-maintenant" || id === "p-ouvrir") ouvrirMerge();
      else if (id === "p-quand-meme"){ if (o.interface) location.href = o.interface; }
      else if (id === "p-fermer") pont("quitter");
    };

    (async () => {
      try {
        [diag, emplacements] = await Promise.all([pont("diagnostic"), pont("emplacements").catch(() => [])]);
      } catch (err) {
        ecran(`<p class="alerte">${ico("alert")}<span>${esc(t("Merge could not look at this device: {e}", {e: String(err && err.message || err)}))}</span></p>`, "");
        return;
      }
      if (!actif) return;
      if (!o.apercu && diag.tailles) connaitreCatalogue(diag.tailles, diag.taillesImages);
      machine = machinePour(diag);
      emplacements = emplacements || [];
      choixDossier = emplacements.length ? emplacements[0].chemin : null;
      if (!voulue && diag.choix) voulue = modele(diag.choix) || null;
      if (Array.isArray(diag.besoins) && !dejaRepondu){ besoins = diag.besoins.filter(id => [...besoinsPour(machine), ...METIERS].some(b => b.id === id)); dejaRepondu = true; }
      if (diag.enCours && modele(diag.enCours.modele)){        // installation déjà en cours (fenêtre rouverte)
        choisie = modele(diag.enCours.modele);
        return installer(true);
      }
      if (dejaRepondu && besoins.length) resultat(); else accueil();
    })();
    const surLangue = () => { if (actif && machine && redessiner) redessiner(); };
    window.addEventListener("merge-langue", surLangue);
    return () => { arreter(); window.removeEventListener("merge-langue", surLangue); };
  }

  function pontApercu(os, reconnu){
    const tel = os === "iphone" || os === "android";
    const d = tel ? TELEPHONES.find(t => t.os === os) : null;
    const diag = tel ? {os, memoire: d.memoire, appareil: os === "iphone" ? "iPhone (example)" : "Android phone (example)", libre: 60, essai: true}
      : {os, memoire: 16, puce: os === "mac" ? "Apple M2" : "Intel Core i5", libre: 180, essai: true};
    if (reconnu){
      diag.reconnu = true;
      diag.appareil = reconnu.nom;
      if (reconnu.nom === "iPad") diag.os = "ipad";
      if (reconnu.puce) diag.puce = reconnu.puce; else diag.puceExemple = !tel;
      if (reconnu.memoire && reconnu.memoire < 8) diag.memoire = reconnu.memoire;
    }
    const lieux = {mac: ["This Mac", "An external drive"], windows: ["This PC", "Another drive (D:)"], linux: ["This computer", "Another drive"]}[os] || [];
    let annule = false;
    return (action, x) => {
      const attendre = ms => new Promise(r => setTimeout(r, ms * (animer() ? 1 : 0.1)));
      if (action === "diagnostic") return Promise.resolve(diag);
      if (action === "emplacements") return Promise.resolve(lieux.map((n, k) => ({nom: n, chemin: "exemple-" + k, libre: k ? 400 : 180})));
      if (action === "choisirDossier") return Promise.resolve({nom: "Documents", chemin: "exemple-documents", libre: 180});
      if (action === "annuler"){ annule = true; return Promise.resolve({ok: true}); }
      if (action === "installer"){
        annule = false;
        (async () => {
          const ev = e => window.mergeEvenement(e);
          for (const id of ["merge", "moteur"]){ ev({type: "etape", id, etat: "encours"}); await attendre(600); if (annule) return ev({type: "annule"}); ev({type: "etape", id, etat: "fait"}); }
          for (const [cle, id] of [...(x.depart ? [["depart", x.depart]] : []), ["choisie", x.modele]]){
            const total = EST.fichier(modele(id)) * 1e9;
            for (let k = 0; k <= 25; k++){ if (annule) return ev({type: "annule"}); ev({type: "etape", id: cle, etat: "encours", recus: total * k / 25, total}); await attendre(cle === "depart" ? 80 : 110); }
            ev({type: "etape", id: cle, etat: "fait", recus: total, total});
          }
          ev({type: "etape", id: "verif", etat: "encours"}); await attendre(700);
          ev({type: "etape", id: "verif", etat: "fait"});
          ev({type: "pret", essai: true});
        })();
        return Promise.resolve({ok: true});
      }
      return Promise.resolve({ok: true});
    };
  }

  return {lancer, pontApercu};
})();
