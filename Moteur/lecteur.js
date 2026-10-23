(() => {
  "use strict";
  const tr = window.LangueAppli ? window.LangueAppli.t : (s, v) => (v ? String(s).replace(/\{(\w+)\}/g, (x, k) => (k in v ? v[k] : x)) : s);
  const dec = new TextDecoder("utf-8"), latin1 = new TextDecoder("latin1");

  async function decompresser(octets, format){
    const flux = new Blob([octets]).stream().pipeThrough(new DecompressionStream(format));
    return new Uint8Array(await new Response(flux).arrayBuffer());
  }

  async function lireZip(buf){
    const v = new DataView(buf), u8 = new Uint8Array(buf);
    let fin = -1;
    for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 70000); i--) if (v.getUint32(i, true) === 0x06054b50){ fin = i; break; }
    if (fin < 0) throw new Error(tr("this file looks damaged (not a valid Office file)"));
    const n = v.getUint16(fin + 10, true);
    let p = v.getUint32(fin + 16, true);
    const fichiers = {};
    for (let k = 0; k < n; k++){
      if (v.getUint32(p, true) !== 0x02014b50) break;
      const methode = v.getUint16(p + 10, true), taille = v.getUint32(p + 20, true);
      const ln = v.getUint16(p + 28, true), le = v.getUint16(p + 30, true), lc = v.getUint16(p + 32, true);
      const local = v.getUint32(p + 42, true), nom = dec.decode(u8.subarray(p + 46, p + 46 + ln));
      fichiers[nom] = async () => {
        const debut = local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true);
        const brut = u8.subarray(debut, debut + taille);
        return dec.decode(methode === 0 ? brut : await decompresser(brut, "deflate-raw"));
      };
      p += 46 + ln + le + lc;
    }
    return fichiers;
  }
  const entites = t => t.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&amp;/g, "&");
  function texteXml(xml, bloc, morceau){
    const out = [];
    const reBloc = new RegExp(`<${bloc}[\\s>][\\s\\S]*?</${bloc}>|<${bloc}/>`, "g");
    const reMorceau = new RegExp(`<${morceau}(?:\\s[^>]*)?>([\\s\\S]*?)</${morceau}>|<(?:w:tab|text:tab)/>|<(?:w:br|text:line-break)/>`, "g");
    for (const b of xml.match(reBloc) || []){
      let ligne = "";
      for (const m of b.matchAll(reMorceau)) ligne += m[1] !== undefined ? entites(m[1].replace(/<[^>]+>/g, "")) : /tab/.test(m[0]) ? "\t" : "\n";
      out.push(ligne);
    }
    return out.join("\n");
  }
  const parNumero = (a, b) => (+(a.match(/(\d+)\.xml$/) || [0, 0])[1]) - (+(b.match(/(\d+)\.xml$/) || [0, 0])[1]);

  async function lireOffice(f, ext){
    const z = await lireZip(await f.arrayBuffer());
    if (ext === "docx"){
      if (!z["word/document.xml"]) throw new Error(tr("this Word file has no text"));
      return texteXml(await z["word/document.xml"](), "w:p", "w:t");
    }
    if (ext === "pptx"){
      const diapos = Object.keys(z).filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort(parNumero);
      const out = [];
      for (const [i, n] of diapos.entries()) out.push(`--- Slide ${i + 1} ---\n` + texteXml(await z[n](), "a:p", "a:t"));
      return out.join("\n\n");
    }
    if (ext === "xlsx"){
      const partages = z["xl/sharedStrings.xml"] ? (await z["xl/sharedStrings.xml"]()).match(/<si>[\s\S]*?<\/si>/g) || [] : [];
      const chaines = partages.map(si => entites((si.match(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g) || []).map(t => t.replace(/<[^>]+>/g, "")).join("")));
      const feuilles = Object.keys(z).filter(n => /^xl\/worksheets\/sheet\d+\.xml$/.test(n)).sort(parNumero);
      const out = [];
      for (const [i, n] of feuilles.entries()){
        const xml = await z[n](), lignes = [];
        for (const row of xml.match(/<row[\s\S]*?<\/row>/g) || []){
          const cellules = [];
          for (const c of row.match(/<c\s[^>]*?(?:\/>|>[\s\S]*?<\/c>)/g) || []){
            const type = (c.match(/\st="(\w+)"/) || [])[1], val = (c.match(/<v>([\s\S]*?)<\/v>/) || [])[1], inl = (c.match(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/) || [])[1];
            cellules.push(type === "s" && val != null ? chaines[+val] || "" : type === "inlineStr" ? entites(inl || "") : entites(val || ""));
          }
          lignes.push(cellules.join("\t"));
        }
        out.push(`--- Sheet ${i + 1} ---\n` + lignes.join("\n"));
      }
      return out.join("\n\n");
    }
    if (!z["content.xml"]) throw new Error(tr("this file has no text"));
    const xml = await z["content.xml"]();
    if (ext === "ods") return (xml.match(/<table:table-row[\s\S]*?<\/table:table-row>/g) || []).map(r => (r.match(/<table:table-cell[\s\S]*?(?:\/>|<\/table:table-cell>)/g) || []).map(c => entites(c.replace(/<[^>]+>/g, ""))).join("\t")).join("\n");
    return (xml.match(/<text:(p|h)[\s>][\s\S]*?<\/text:\1>/g) || []).map(par => entites(par.replace(/<text:tab\/>/g, "\t").replace(/<text:line-break\/>/g, "\n").replace(/<[^>]+>/g, ""))).join("\n");
  }

  async function lirePdf(f){
    const u8 = new Uint8Array(await f.arrayBuffer()), brut = latin1.decode(u8);
    if (!brut.startsWith("%PDF")) throw new Error(tr("this file is not a real PDF"));
    if (/\/Encrypt\s/.test(brut)) throw new Error(tr("this PDF is protected (encrypted). Open it, and save or print it as a new PDF without a password"));
    const objets = {};
    const flux = async (dict, debut, fin) => {
      const d = u8.subarray(debut, fin);
      if (/\/FlateDecode/.test(dict)) { try { return await decompresser(d, "deflate"); } catch { return null; } }
      if (/\/Filter/.test(dict)) return null;          // autre compression (images…) : pas du texte
      return d;
    };
    const reObj = /(\d+)\s+(\d+)\s+obj\b/g;
    let m;
    while ((m = reObj.exec(brut))){
      const debut = m.index + m[0].length, fin = brut.indexOf("endobj", debut);
      if (fin < 0) break;
      const corps = brut.slice(debut, fin), s = corps.indexOf("stream");
      const o = { dict: s >= 0 ? corps.slice(0, s) : corps };
      if (s >= 0){
        let a = debut + s + 6; if (brut[a] === "\r") a++; if (brut[a] === "\n") a++;
        let e = brut.lastIndexOf("endstream", fin);
        const lg = (o.dict.match(/\/Length\s+(\d+)(?!\s+\d+\s+R)/) || [])[1];
        if (lg && a + +lg <= e) e = a + +lg; else { while (e > a && (brut[e - 1] === "\n" || brut[e - 1] === "\r")) e--; }
        o.flux = () => flux(o.dict, a, e);
        o.debut = a; o.fin = e;
      }
      objets[m[1]] = o;
      reObj.lastIndex = fin;
    }
    for (const o of Object.values(objets)){
      if (!/\/Type\s*\/ObjStm/.test(o.dict) || !o.flux) continue;
      const d = await o.flux(); if (!d) continue;
      const t = latin1.decode(d), premier = +((o.dict.match(/\/First\s+(\d+)/) || [])[1] || 0);
      const nums = t.slice(0, premier).trim().split(/\s+/).map(Number);
      for (let i = 0; i < nums.length; i += 2){
        const a = premier + nums[i + 1], b = i + 3 < nums.length ? premier + nums[i + 3] : t.length;
        if (!objets[nums[i]]) objets[nums[i]] = { dict: t.slice(a, b) };
      }
    }
    const ref = t => (t.match(/^\s*(\d+)\s+\d+\s+R/) || [])[1];
    const resoudre = t => { const r = ref(t || ""); return r && objets[r] ? objets[r].dict : t; };
    const valeur = (dict, cle) => { const i = dict.indexOf("/" + cle); if (i < 0) return null; let t = dict.slice(i + cle.length + 1).trimStart();
      if (t.startsWith("<<")){ let n = 0, j = 0; for (; j < t.length; j++){ if (t.startsWith("<<", j)){ n++; j++; } else if (t.startsWith(">>", j)){ n--; j++; if (!n) break; } } return t.slice(0, j + 1); }
      if (t.startsWith("[")) return t.slice(0, t.indexOf("]") + 1);
      return (t.match(/^(\d+\s+\d+\s+R|\/\w+|[^\s/>\]]+)/) || [""])[0]; };
    const cmaps = {};
    async function cmapDe(fontRef){
      if (fontRef in cmaps) return cmaps[fontRef];
      cmaps[fontRef] = null;
      const font = objets[fontRef]; if (!font) return null;
      const tu = ref(valeur(font.dict, "ToUnicode") || ""); if (!tu || !objets[tu] || !objets[tu].flux) return null;
      const d = await objets[tu].flux(); if (!d) return null;
      const t = latin1.decode(d), map = {}; let octets = 1;
      const hex = h => h.length > 4 ? String.fromCodePoint(...(h.match(/.{4}/g) || []).map(x => parseInt(x, 16))) : String.fromCodePoint(parseInt(h, 16));
      for (const b of t.match(/beginbfchar[\s\S]*?endbfchar/g) || []) for (const x of b.matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g)){ map[parseInt(x[1], 16)] = hex(x[2]); if (x[1].length > 2) octets = 2; }
      for (const b of t.match(/beginbfrange[\s\S]*?endbfrange/g) || []) for (const x of b.matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*(<[0-9a-fA-F]+>|\[[^\]]*\])/g)){
        const a = parseInt(x[1], 16), z = parseInt(x[2], 16); if (x[1].length > 2) octets = 2;
        if (x[3].startsWith("[")){ (x[3].match(/<([0-9a-fA-F]+)>/g) || []).forEach((h, i) => { map[a + i] = hex(h.slice(1, -1)); }); }
        else { const base = parseInt(x[3].slice(1, -1), 16); for (let c = a; c <= z && c - a < 65536; c++) map[c] = String.fromCodePoint(base + c - a); }
      }
      return (cmaps[fontRef] = { map, octets });
    }
    const pages = [];
    const racine = Object.values(objets).find(o => /\/Type\s*\/Catalog/.test(o.dict));
    const parcourir = (r, vus = new Set()) => { if (!r || vus.has(r) || !objets[r]) return; vus.add(r); const d = objets[r].dict;
      if (/\/Type\s*\/Pages/.test(d)) (valeur(d, "Kids") || "").replace(/(\d+)\s+\d+\s+R/g, (_, k) => { parcourir(k, vus); return ""; });
      else if (/\/Type\s*\/Page\b/.test(d)) pages.push(r); };
    if (racine) parcourir(ref(valeur(racine.dict, "Pages") || ""));
    if (!pages.length) for (const [k, o] of Object.entries(objets)) if (/\/Type\s*\/Page\b/.test(o.dict)) pages.push(k);
    const chaineLit = s => s.replace(/\\(\d{1,3}|.)/gs, (_, e) => /^\d/.test(e) ? String.fromCharCode(parseInt(e, 8)) : ({ n: "\n", r: "\r", t: "\t", b: "\b", f: "\f" }[e] ?? (e === "\n" ? "" : e)));
    const sortie = [];
    for (const [i, p] of pages.entries()){
      const d = objets[p].dict;
      let res = "", n = d, garde = 0;
      while (n && !res && garde++ < 10){ res = resoudre(valeur(n, "Resources") || "") || ""; const par = ref(valeur(n, "Parent") || ""); n = !res && par && objets[par] ? objets[par].dict : null; }
      const fontsDict = resoudre(valeur(res, "Font") || "") || "";
      const polices = {};
      for (const x of fontsDict.matchAll(/\/([^\s/<>\[\]]+)\s+(\d+)\s+\d+\s+R/g)) polices[x[1]] = await cmapDe(x[2]);
      const contenus = valeur(d, "Contents") || "", refs = [...contenus.matchAll(/(\d+)\s+\d+\s+R/g)].map(x => x[1]);
      let texte = "";
      for (const r of refs){
        const o = objets[r]; if (!o || !o.flux) continue;
        const cs = await o.flux(); if (!cs) continue;
        const t = latin1.decode(cs);
        let cmap = null, taille = 10;
        const decode = (octets) => {
          if (!cmap) return octets.map(c => String.fromCharCode(c)).join("");
          let out = "";
          for (let k = 0; k < octets.length; k += cmap.octets){ const c = cmap.octets === 2 ? (octets[k] << 8) | (octets[k + 1] || 0) : octets[k]; out += cmap.map[c] ?? (cmap.octets === 1 ? String.fromCharCode(c) : ""); }
          return out;
        };
        const deChaine = s => s.startsWith("<") ? decode((s.slice(1, -1).replace(/\s/g, "").match(/.{1,2}/g) || []).map(h => parseInt(h.padEnd(2, "0"), 16)))
          : decode([...chaineLit(s.slice(1, -1))].map(c => c.charCodeAt(0) & 255));
        const reOp = /\/([^\s/<>\[\]()]+)\s+([-\d.]+)\s+Tf|(\((?:\\.|[^\\)])*\)|<[0-9a-fA-F\s]*>)\s*(Tj|'|")|\[((?:\((?:\\.|[^\\)])*\)|<[0-9a-fA-F\s]*>|[-\d.\s])*)\]\s*TJ|([-\d.]+)\s+([-\d.]+)\s+(Td|TD)|\bT\*|\bET\b/g;
        for (const x of t.matchAll(reOp)){
          if (x[1] !== undefined){ cmap = polices[x[1]] || null; taille = Math.abs(+x[2]) || 10; }
          else if (x[3] !== undefined){ texte += (x[4] !== "Tj" ? "\n" : "") + deChaine(x[3]); }
          else if (x[5] !== undefined){
            for (const y of x[5].matchAll(/(\((?:\\.|[^\\)])*\)|<[0-9a-fA-F\s]*>)|([-\d.]+)/g)) texte += y[1] ? deChaine(y[1]) : (+y[2] < -200 ? " " : "");
          }
          else if (x[8]){ texte += Math.abs(+x[7]) > 0.1 ? "\n" : (+x[6] > taille * 1.1 && !/\s$/.test(texte) ? " " : ""); }
          else if (x[0] === "T*"){ texte += "\n"; }
          else texte += " ";
        }
      }
      sortie.push(`--- Page ${i + 1} ---\n` + texte.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim());
    }
    const tout = sortie.join("\n\n");
    if (tout.replace(/--- Page \d+ ---/g, "").replace(/\s/g, "").length < 20){
      const images = [];
      for (const o of Object.values(objets)){
        if (images.length >= 12) break;
        if (!/\/Subtype\s*\/Image/.test(o.dict) || !/\/DCTDecode/.test(o.dict) || /\/FlateDecode/.test(o.dict) || !o.debut) continue;
        const jpeg = u8.subarray(o.debut, o.fin);
        if (jpeg.length < 2000 || jpeg.length > 6e6) continue;
        images.push(await new Promise(ok => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(new Blob([jpeg], { type: "image/jpeg" })); }));
      }
      if (images.length) return { scan: images };
      throw new Error(tr("this PDF seems to be scanned pictures of pages, with no text inside, in a format Merge can't open yet. Take a photo or screenshot of the pages and attach it as an image (with an AI that reads images)"));
    }
    return tout;
  }

  async function lire(f){
    const ext = (f.name.match(/\.([a-z0-9]+)$/i) || [, ""])[1].toLowerCase();
    if (typeof DecompressionStream !== "function") throw new Error(tr("this browser is too old to open this file here"));
    if (["doc", "xls", "ppt"].includes(ext)) throw new Error(tr("old {format} format: open it and save it as .{ext}x, then attach it again", { format: ext.toUpperCase(), ext }));
    if (f.type === "application/pdf" || ext === "pdf"){
      const r = await lirePdf(f);
      if (r && r.scan) return { texte: "", images: r.scan, note: tr("scanned PDF: its pages are sent as pictures") };
      return { texte: r, note: tr("text read from the PDF; layout may differ") };
    }
    if (ext === "epub") return { texte: await lireEpub(f), note: "" };
    if (ext === "rtf") return { texte: lireRtf(await f.text()), note: "" };
    if (ext === "html" || ext === "htm") return { texte: lireHtml(await f.text()), note: "" };
    if (["docx", "xlsx", "pptx", "odt", "ods", "odp"].includes(ext)) return { texte: await lireOffice(f, ext), note: "" };
    throw new Error(tr("this kind of file can't be read yet"));
  }
  async function lireEpub(f){
    const z = await lireZip(await f.arrayBuffer());
    const opfNom = Object.keys(z).find(n => n.endsWith(".opf"));
    let ordre = Object.keys(z).filter(n => /\.x?html?$/i.test(n)).sort();
    if (opfNom){
      const opf = await z[opfNom](), base = opfNom.includes("/") ? opfNom.slice(0, opfNom.lastIndexOf("/") + 1) : "";
      const items = Object.fromEntries([...opf.matchAll(/<item\s[^>]*id="([^"]+)"[^>]*href="([^"]+)"/g)].map(m => [m[1], base + decodeURIComponent(m[2])]));
      const spine = [...opf.matchAll(/<itemref\s[^>]*idref="([^"]+)"/g)].map(m => items[m[1]]).filter(n => n && z[n]);
      if (spine.length) ordre = spine;
    }
    const out = [];
    for (const n of ordre) out.push(lireHtml(await z[n]()));
    return out.join("\n\n");
  }
  function lireHtml(t){
    return entites(t.replace(/<(script|style|head)[\s\S]*?<\/\1>/gi, "").replace(/<br\s*\/?>|<\/(p|div|h\d|li|tr)>/gi, "\n").replace(/<[^>]+>/g, ""))
      .replace(/[ \t]+/g, " ").replace(/\n\s*\n\s*\n+/g, "\n\n").trim();
  }
  function lireRtf(t){
    return t.replace(/\{\\\*[^{}]*\}/g, "").replace(/\{\\(fonttbl|colortbl|stylesheet|info)[\s\S]*?\}\}?/g, "")
      .replace(/\\'([0-9a-f]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/\\u(-?\d+)\??/g, (_, n) => String.fromCharCode((+n + 65536) % 65536))
      .replace(/\\(par|line)\b ?/g, "\n").replace(/\\tab\b ?/g, "\t").replace(/\\[a-z]+-?\d* ?/gi, "").replace(/[{}]/g, "").replace(/\\(?=\n|$)/g, "").replace(/\n{3,}/g, "\n\n").trim();
  }
  const sait = f => /\.(pdf|docx|xlsx|pptx|odt|ods|odp|doc|xls|ppt|epub|rtf|html?)$/i.test(f.name) || f.type === "application/pdf";
  window.MergeLecteur = { lire, sait };
})();
