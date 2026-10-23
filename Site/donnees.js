
if (typeof Langue === "undefined"){
  window.Langue = {code: "en", codes: ["en"], noms: {en: "English"}, changer(){}, traduirePage(){}, manquants: new Set(),
    t: (s, v) => v ? s.replace(/\{(\w+)\}/g, (x, k) => k in v ? v[k] : x) : s, nomAppareil: n => String(n || ""), phrase: m => m ? m.phrase : "",
    enumerer: n => n.length < 2 ? (n[0] || "") : n.some(x => x.includes(" and ")) ? n.join("; ") : n.slice(0, -1).join(", ") + " and " + n[n.length - 1],
    go: x => (Math.round(x * 10) / 10).toLocaleString("en-US") + " GB"};
  window.t = window.Langue.t;
}

const MODELES = [
  {pc: true, id: "qwen3-0.6b", nom: "Qwen3 0.6B", famille: "Qwen3", editeur: "Alibaba", pays: "China", total: 0.6, actifs: 0.6, licence: "Apache 2.0", fr: false, sortie: "2025-04", bon: ["mail", "docs", "code", "trad", "raison", "agents"], phrase: "Thinks before it answers, or answers fast; 100+ languages.", plus: true},
  {id: "qwen3.5-0.8b", nom: "Qwen3.5 0.8B", editeur: "Alibaba", pays: "China", total: 0.8, actifs: 0.8, licence: "Apache 2.0", fr: false, sortie: "2026-02", bon: ["docs", "images"], phrase: "Very small and quick: ready in about a minute."},
  {id: "granite-4.0-nano-1b", nom: "Granite 4.0 Nano 1B", editeur: "IBM", pays: "USA", total: 1.5, actifs: 1.5, licence: "Apache 2.0", fr: true, sortie: "2025-10", bon: [], phrase: "IBM's tiny one, made for light devices."},
  {pc: true, id: "smollm2-1.7b", nom: "SmolLM2 1.7B", famille: "SmolLM2", editeur: "Hugging Face", pays: "USA", total: 1.7, actifs: 1.7, licence: "Apache 2.0", fr: false, sortie: "2024-10", bon: ["mail", "docs"], phrase: "Small model for rewriting, summaries and simple tools.", plus: true},
  {pc: true, id: "qwen3.5-2b", nom: "Qwen3.5 2B", famille: "Qwen3.5", editeur: "Alibaba", pays: "China", total: 1.9, actifs: 1.9, licence: "Apache 2.0", fr: false, sortie: "2026-02", bon: ["mail", "docs", "code", "trad", "images", "raison", "agents"], phrase: "Sees images, uses tools, thinks; 201 languages.", plus: true},
  {id: "smollm3-3b", nom: "SmolLM3 3B", editeur: "Hugging Face", pays: "USA", total: 3, actifs: 3, licence: "Apache 2.0", fr: true, sortie: "2025-07", bon: ["mail", "docs", "raison"], phrase: "Small, chatty, can think before it answers."},
  {pc: true, id: "granite-4.2-3b", nom: "Granite 4.2 3B", editeur: "IBM", pays: "USA", total: 3, actifs: 3, licence: "Apache 2.0", fr: true, sortie: "2026-08", bon: ["mail", "docs", "agents"], phrase: "Built for laptops, good with tools."},
  {id: "phi-4-mini", nom: "Phi-4 mini", editeur: "Microsoft", pays: "USA", total: 3.8, actifs: 3.8, licence: "MIT", fr: true, sortie: "2025-02", bon: ["mail", "docs", "trad"], phrase: "Small and multilingual."},
  {id: "ministral-3-3b", nom: "Ministral 3 3B", editeur: "Mistral AI", pays: "France", total: 3.8, actifs: 3.8, licence: "Apache 2.0", fr: true, sortie: "2025-12", bon: ["mail", "docs", "images"], phrase: "The small one from Mistral: emails, letters, documents."},
  {pc: true, id: "jan-v3.5-4b", nom: "Jan v3.5 4B", editeur: "Menlo Research", pays: "Singapore", total: 4, actifs: 4, licence: "Apache 2.0", fr: false, sortie: "2026-01", bon: ["mail", "raison"], phrase: "Conversation and maths."},
  {pc: true, id: "qwen3.5-4b", nom: "Qwen3.5 4B", famille: "Qwen3.5", editeur: "Alibaba", pays: "China", total: 4.2, actifs: 4.2, licence: "Apache 2.0", fr: false, sortie: "2026-02", bon: ["mail", "docs", "code", "trad", "images", "raison", "agents"], phrase: "Sees images, uses tools, thinks; 201 languages.", plus: true},
  {pc: true, id: "gemma-4-e2b", nom: "Gemma 4 E2B", editeur: "Google", pays: "USA", total: 5.1, actifs: 2.3, licence: "Apache 2.0", fr: false, sortie: "2026-04", bon: ["images"], phrase: "Made for small devices; understands images."},
  {pc: true, id: "granite-4.0-h-tiny", nom: "Granite 4.0 H Tiny", famille: "Granite 4.0", editeur: "IBM", pays: "USA", total: 6.9, actifs: 1.0, licence: "Apache 2.0", fr: true, sortie: "2025-09", bon: ["mail", "docs", "agents", "code"], phrase: "Fast mixture-of-experts model: 7B total, about 1B active.", plus: true},
  {pc: true, id: "olmo-3-7b", nom: "Olmo 3 7B", editeur: "Ai2", pays: "USA", total: 7, actifs: 7, licence: "Apache 2.0", fr: false, sortie: "2025-11", bon: ["raison"], phrase: "Fully open: even its training data is public."},
  {id: "granite-4.2-8b", nom: "Granite 4.2 8B", editeur: "IBM", pays: "USA", total: 8, actifs: 8, licence: "Apache 2.0", fr: true, sortie: "2026-08", bon: ["mail", "code", "agents"], phrase: "Multilingual chat, code and multi-step tasks."},
  {pc: true, id: "gemma-4-e4b", nom: "Gemma 4 E4B", editeur: "Google", pays: "USA", total: 8, actifs: 4.5, licence: "Apache 2.0", fr: false, sortie: "2026-04", bon: ["images"], phrase: "A small Gemma that sees images."},
  {id: "ministral-3-8b", nom: "Ministral 3 8B", editeur: "Mistral AI", pays: "France", total: 8.8, actifs: 8.8, licence: "Apache 2.0", fr: true, sortie: "2025-12", bon: ["mail", "docs", "images", "raison"], phrase: "A solid everyday helper for a 16 GB laptop."},
  {id: "qwen3.5-9b", nom: "Qwen3.5 9B", editeur: "Alibaba", pays: "China", total: 9, actifs: 9, licence: "Apache 2.0", fr: false, sortie: "2026-02", bon: ["docs", "images", "raison"], phrase: "All-rounder that can think before it answers."},
  {id: "gemma-4-12b", nom: "Gemma 4 12B", editeur: "Google", pays: "USA", total: 12, actifs: 12, licence: "Apache 2.0", fr: false, sortie: "2026-06", bon: ["docs", "images", "agents"], phrase: "Made for a 16 GB laptop, says Google."},
  {id: "phi-4", nom: "Phi-4", editeur: "Microsoft", pays: "USA", total: 14, actifs: 14, licence: "MIT", fr: false, sortie: "2025-01", bon: ["raison"], phrase: "Strong at reasoning and maths."},
  {pc: true, id: "ministral-3-14b", nom: "Ministral 3 14B", editeur: "Mistral AI", pays: "France", total: 14, actifs: 14, licence: "Apache 2.0", fr: true, sortie: "2025-10", bon: ["mail", "docs", "images", "agents"], phrase: "The big brother: more knowledge, a bit slower."},
  {pc: true, id: "qwen3-14b", nom: "Qwen3 14B", famille: "Qwen3", editeur: "Alibaba", pays: "China", total: 14.8, actifs: 14.8, licence: "Apache 2.0", fr: false, sortie: "2025-04", bon: ["mail", "docs", "code", "trad", "raison", "agents"], phrase: "Thinks before it answers, or answers fast; 100+ languages.", plus: true},
  {id: "gpt-oss-20b", nom: "gpt-oss 20B", editeur: "OpenAI", pays: "USA", total: 21, actifs: 3.6, licence: "Apache 2.0", fr: false, sortie: "2025-08", bon: ["raison", "agents"], phrase: "OpenAI's open model. Big, but quick on its feet."},
  {id: "eurollm-22b", nom: "EuroLLM 22B", editeur: "EuroLLM consortium", pays: "EU", total: 22.6, actifs: 22.6, licence: "Apache 2.0", fr: true, sortie: "2025-12", bon: ["trad", "mail"], phrase: "A European AI for translation and conversation."},
  {id: "mistral-small-3.2", nom: "Mistral Small 3.2", editeur: "Mistral AI", pays: "France", total: 24, actifs: 24, licence: "Apache 2.0", fr: true, sortie: "2025-06", bon: ["mail", "docs", "images"], phrase: "A very good assistant from Mistral, for 32 GB computers."},
  {id: "devstral-small-2", nom: "Devstral Small 2", editeur: "Mistral AI", pays: "France", total: 24, actifs: 24, licence: "Apache 2.0", fr: true, specialiste: "code", sortie: "2025-11", bon: ["code", "agents"], phrase: "Mistral's coding partner."},
  {id: "gemma-4-26b-a4b", nom: "Gemma 4 26B", editeur: "Google", pays: "USA", total: 25, actifs: 3.8, licence: "Apache 2.0", fr: false, sortie: "2026-04", bon: ["docs", "images"], phrase: "Big knowledge, small effort: fast for its size."},
  {id: "qwen3.6-27b", nom: "Qwen3.6 27B", editeur: "Alibaba", pays: "China", total: 27, actifs: 27, licence: "Apache 2.0", fr: false, sortie: "2026-04", bon: ["code", "agents", "docs", "images"], phrase: "Code and documents; can think or answer fast."},
  {id: "gemma-4-31b", nom: "Gemma 4 31B", editeur: "Google", pays: "USA", total: 31, actifs: 31, licence: "Apache 2.0", fr: false, sortie: "2026-04", bon: ["images"], phrase: "The most capable Gemma 4."},
  {id: "gpt-oss-120b", nom: "gpt-oss 120B", editeur: "OpenAI", pays: "USA", total: 117, actifs: 5.1, licence: "Apache 2.0", fr: false, sortie: "2025-08", bon: ["raison", "agents"], phrase: "One of the biggest open AIs. Reasons and uses tools."},
  {id: "mistral-small-4", nom: "Mistral Small 4", editeur: "Mistral AI", pays: "France", total: 119, actifs: 6, licence: "Apache 2.0", fr: true, sortie: "2026-01", bon: ["mail", "docs", "code", "images", "agents"], phrase: "A big Mistral model for 128 GB Macs: code and documents."},
  {id: "qwen3.5-122b-a10b", nom: "Qwen3.5 122B", editeur: "Alibaba", pays: "China", total: 122, actifs: 10, licence: "Apache 2.0", fr: false, sortie: "2026-02", bon: ["agents", "docs", "images"], phrase: "Multi-step tasks and long documents."},
];

const USAGES = {
  mail: {icone: "mail", nom: "Writes"},
  docs: {icone: "file-text", nom: "Documents"},
  code: {icone: "code-xml", nom: "Codes"},
  images: {icone: "image", nom: "Sees images (coming later)"},
  trad: {icone: "languages", nom: "Translates"},
  raison: {icone: "brain", nom: "Thinks"},
  agents: {icone: "list-checks", nom: "Multi-step tasks"},
};

const MACHINES = [
  {id: "vieux", nom: "8 GB Mac", detail: "8 GB of memory", icone: "laptop", memoire: 8, dispo: 6, debit: 68},
  {id: "portable", nom: "16 GB Mac", detail: "16 GB of memory", icone: "laptop", memoire: 16, dispo: 12, debit: 68},
  {id: "pro", nom: "MacBook Pro", detail: "32 GB of memory", icone: "laptop", memoire: 32, dispo: 24, debit: 200},
  {id: "studio", nom: "Mac Studio", detail: "128 GB of memory", icone: "monitor", memoire: 128, dispo: 96, debit: 400},
];

let TAILLES = typeof TAILLES_CATALOGUE === "object" ? TAILLES_CATALOGUE : {};
const EST = {
  fichier: m => TAILLES[m.id] || Math.round(m.total * 0.6 * 10) / 10,
  memoire: (m, machine) => Math.round((EST.fichier(m) + (machine && machine.telephone ? 0.7 : m.total < 10 ? 1.5 : 2)) * 10) / 10,
    jetons: (m, machine) => ((machine.vram && EST.fichier(m) + 1 <= machine.vram) ? machine.debitGpu : machine.debit) / (m.actifs * 0.6) * 0.75,
  tient: (m, machine) => EST.memoire(m, machine) <= machine.dispo || (machine.vram > 0 && EST.fichier(m) + 1 <= machine.vram),
};

function vitesse(m, machine){
  if (!EST.tient(m, machine)) return {niveau: 0, mot: t("Too big"), detail: t("Needs more memory than this computer has")};
  const j = EST.jetons(m, machine);
  if (j >= 25) return {niveau: 5, mot: t("Instant"), detail: t("Answers appear almost at once")};
  if (j >= 12) return {niveau: 4, mot: t("Fast"), detail: t("Writes faster than you read")};
  if (j >= 6) return {niveau: 3, mot: t("Steady"), detail: t("About as fast as you read")};
  if (j >= 3) return {niveau: 2, mot: t("Slow"), detail: t("Fine for short answers")};
  return {niveau: 1, mot: t("Very slow"), detail: t("You will wait for each sentence")};
}

function savoir(m){
  if (m.specialiste === "code") return {niveau: m.total < 6 ? 2 : m.total < 16 ? 3 : m.total < 50 ? 4 : 5, mot: t("Code specialist")};
  if (m.total < 2) return {niveau: 1, mot: t("The basics")};
  if (m.total < 6) return {niveau: 2, mot: t("Simple tasks")};
  if (m.total < 16) return {niveau: 3, mot: t("Everyday helper")};
  if (m.total < 50) return {niveau: 4, mot: t("Very good")};
  return {niveau: 5, mot: t("Excellent")};
}

const CONSEILLABLES = ["smollm3-3b", "phi-4-mini", "ministral-3-3b", "ministral-3-8b", "gpt-oss-20b", "mistral-small-3.2",
  "gemma-4-26b-a4b", "mistral-small-4", "gpt-oss-120b",
  "gemma-4-e2b", "qwen3.5-4b", "granite-4.0-h-tiny", "gemma-4-e4b", "ministral-3-14b"];
const IA_DE_DEPART = "qwen3.5-0.8b";

const modele = id => MODELES.find(m => m.id === id);
let LANGUE = "en";
function choisirLangue(l){ LANGUE = l === "fr" ? "fr" : "en"; }
choisirLangue(Langue.code);
const pourLaLangue = m => !m.langue || m.langue === LANGUE;
const bonusFrancais = m => LANGUE === "fr" && m.fr ? 1 : 0;
const pourLeSysteme = (m, machine) => !m.pc || (!!machine && (machine.os === "windows" || machine.os === "linux"));
const plusPetite = machine => (MODELES.filter(m => installable(m) && pourLaLangue(m) && pourLeSysteme(m, machine)).sort((a, b) => a.total - b.total)[0]) || MODELES[0];
let INSTALLABLES = Object.keys(TAILLES).length ? new Set(Object.keys(TAILLES)) : null;
const installable = m => !!m && (!INSTALLABLES || INSTALLABLES.has(m.id));
function connaitreCatalogue(tailles){
  if (!tailles || !MODELES.some(m => tailles[m.id])) return;
  TAILLES = tailles;
  INSTALLABLES = new Set(Object.keys(tailles));
}
function conseil(machine){
  const L = CONSEILLABLES.map(modele).filter(m => installable(m) && pourLaLangue(m) && pourLeSysteme(m, machine)), tiennent = L.filter(m => EST.tient(m, machine));
  if (!tiennent.length) return (LANGUE === "fr" && modele("luciole-1b")) || plusPetite(machine);
  const bons = tiennent.filter(m => vitesse(m, machine).niveau >= 3);
  if (!bons.length) return tiennent.slice().sort((a, b) => EST.jetons(b, machine) - EST.jetons(a, machine))[0];
  return bons.slice().sort((a, b) => savoir(b).niveau - savoir(a).niveau || (bonusFrancais(b) - bonusFrancais(a)) || (b.total - a.total))[0];
}

const BESOINS = [
  {id: "quotidien", nom: "Everyday life", detail: "Emails, letters, questions, ideas", icone: "mail", tags: ["mail", "docs"]},
  {id: "etudes", nom: "Studies", detail: "Homework, revision, explanations", icone: "graduation-cap", tags: ["raison", "docs"]},
  {id: "code", nom: "Coding", detail: "Write and fix code", icone: "code-xml", tags: ["code", "agents"]},
  {id: "travail", nom: "Work", detail: "Letters, reports, documents", icone: "file-text", tags: ["docs", "agents"]},
  {id: "langues", nom: "Languages", detail: "Translate, write in Spanish and other languages", icone: "languages", tags: ["trad"]},
  {id: "forme", nom: "Health and fitness", detail: "Understand a result, sport, food, sleep", icone: "heart", tags: ["docs", "raison"], specialiste: "sante"},
];
const specialisteCode = m => m.specialiste === "code";
const SPECIALITES = {code: "code", trad: "trad", maths: "raison"};
const horsSpecialite = (m, principaux, metiers = []) => !m.specialiste || principaux.includes(SPECIALITES[m.specialiste]) || metiers.includes(m.specialiste);

const METIERS = [
  {id: "sante", nom: "Health and care", detail: "Doctor, nurse, therapist, caregiver", icone: "heart", tags: ["docs", "raison"], specialiste: "sante"},
  {id: "droit", nom: "Law", detail: "Lawyer, paralegal, notary", icone: "scale", tags: ["docs", "raison"], aussi: "documents"},
  {id: "finance", nom: "Accounting and finance", detail: "Accountant, bookkeeper, adviser", icone: "receipt", tags: ["docs", "raison"], specialiste: "finance", aussi: "documents"},
  {id: "enseignement", nom: "Teaching", detail: "Teacher, tutor, trainer", icone: "graduation-cap", tags: ["raison", "docs"]},
  {id: "ecriture", nom: "Writing and marketing", detail: "Content, social media, communication", icone: "pencil", tags: ["mail", "docs"]},
  {id: "informatique", nom: "Computing and code", detail: "Developer, IT, data", icone: "code-xml", tags: ["code", "agents"], specialiste: "code"},
  {id: "traduction", nom: "Translation", detail: "Translator, interpreter, languages", icone: "languages", tags: ["trad"], specialiste: "trad"},
  {id: "recherche", nom: "Research and journalism", detail: "Researcher, journalist, analyst", icone: "search", tags: ["docs", "raison"], aussi: "documents"},
  {id: "bureau", nom: "Office and admin", detail: "Assistant, HR, customer service", icone: "folder", tags: ["mail", "docs", "agents"], aussi: "documents"},
  {id: "commerce", nom: "Shop, restaurant, trades", detail: "Small business, craftsman, sales", icone: "wrench", tags: ["mail", "trad"]},
  {id: "autre", nom: "Something else", detail: "Merge will suggest an all-round AI", icone: "circle-help", tags: []},
];
const metierDe = besoins => METIERS.find(x => (besoins || []).includes(x.id)) || null;
function conseilsPour(machine, besoins){
  const metier = metierDe(besoins);
  const choisis = [...besoinsPour(machine), ...METIERS].filter(b => (besoins || []).includes(b.id));
  if (!choisis.some(b => b.tags.length || b.specialiste)) return [conseilPour(machine)];
  const tags = new Set(choisis.flatMap(b => b.tags)), principaux = [...new Set(choisis.map(b => b.tags[0]).filter(Boolean))];
  const metiers = [...new Set(choisis.map(b => b.specialiste).filter(Boolean))];
  const langues = principaux.includes("trad");
  const tourne = m => EST.tient(m, machine) && vitesse(m, machine).niveau >= vitesseMin(machine);
  const ok = iaPour(machine).filter(m => tourne(m) && horsSpecialite(m, principaux, metiers) && (!m.plus || m.specialiste));
  if (!ok.length) return [conseilPour(machine)];
  const points = m => savoir(m).niveau * 4 + principaux.filter(t => m.bon.includes(t)).length * 4
    + m.bon.filter(t => tags.has(t) && !principaux.includes(t)).length + bonusFrancais(m) * (langues ? 3 : 1)
    + (metiers.includes(m.specialiste) ? 12 : 0) - (m.plus ? 2 : 0)
    - (m.specialiste === "trad" && principaux.includes("mail") ? 8 : 0)
    - (principaux.length && !principaux.some(t => m.bon.includes(t)) && !metiers.includes(m.specialiste) ? 3 : 0);
  const images = principaux.includes("images") && ok.some(m => m.bon.includes("images"));
  const voit = m => images && m.bon.includes("images") ? 1 : 0;
  const liste = ok.slice().sort((a, b) => voit(b) - voit(a) || points(b) - points(a) || b.total - a.total);
  if (metier && metier.aussi){
    const lecteur = iaPour(machine).filter(m => tourne(m) && m.specialiste === metier.aussi).sort((a, b) => b.total - a.total)[0];
    if (lecteur){ const sans = liste.filter(m => m !== lecteur); sans.splice(2, 0, lecteur); return sans; }
  }
  return liste;
}
const ORIGINES = {
  toutes: {nom: "Any country", garde: () => true},
  usa: {nom: "USA and Canada", garde: m => ["USA", "Canada"].includes(m.pays)},
  europe: {nom: "Europe", garde: m => ["France", "EU", "Spain", "Germany", "Switzerland", "Italy", "Finland", "Poland", "Bulgaria", "UK", "Greece", "Netherlands"].includes(m.pays)},
  chine: {nom: "China", garde: m => m.pays === "China"},
  autres: {nom: "Other countries", garde: m => !!m.pays && !["USA", "Canada", "China", "France", "EU", "Spain", "Germany", "Switzerland", "Italy", "Finland", "Poland", "Bulgaria", "UK", "Greece", "Netherlands"].includes(m.pays)},
};
const PRIORITES = {equilibre: "Balanced", rapide: "Faster answers", savant: "More knowledge"};
function preferer(liste, machine, prefs){
  const o = ORIGINES[prefs.origine] || ORIGINES.toutes;
  const l = liste.filter(m => o.garde(m) && (!prefs.relues || !m.plus));
  if (prefs.priorite === "rapide") return l.slice().sort((a, b) => vitesse(b, machine).niveau - vitesse(a, machine).niveau);
  if (prefs.priorite !== "rapide" && prefs.origine && prefs.origine !== "toutes") return l.slice().sort((a, b) => savoir(b).niveau - savoir(a).niveau);
  if (prefs.priorite === "savant") return l.slice().sort((a, b) => savoir(b).niveau - savoir(a).niveau);
  return l;
}

function usagesNonCouverts(machine, besoins){
  const ok = iaPour(machine).filter(m => EST.tient(m, machine) && vitesse(m, machine).niveau >= vitesseMin(machine));
  return besoinsPour(machine).filter(b => (besoins || []).includes(b.id) && b.tags.length && !ok.some(m => m.bon.includes(b.tags[0])));
}

const iaPour = machine => MODELES.filter(m => installable(m) && pourLaLangue(m) && pourLeSysteme(m, machine) && (!(machine && machine.telephone) || (m.total <= 9 && !specialisteCode(m))));
const vitesseMin = machine => 3;

const BESOINS_TELEPHONE = [
  {id: "messages", nom: "Messages and emails", detail: "Reply, rephrase, fix your spelling", icone: "mail", tags: ["mail"]},
  {id: "questions", nom: "Quick questions", detail: "Ideas, recipes, how-tos, wherever you are", icone: "sparkles", tags: []},
  {id: "voyage", nom: "Travel and languages", detail: "Translate a sign, a menu, a conversation", icone: "languages", tags: ["trad"]},
  {id: "photos", nom: "Photos", detail: "Read a label, a document or a sign you photograph", icone: "image", tags: ["images"]},
  {id: "etudes", nom: "Studies on the go", detail: "Revise, explain a lesson, maths", icone: "graduation-cap", tags: ["raison", "docs"]},
  {id: "lire", nom: "Read and sum up", detail: "An article, a long message, a PDF", icone: "file-text", tags: ["docs"]},
  {id: "forme", nom: "Health and fitness", detail: "Sport, food, sleep, a word on a result", icone: "heart", tags: ["docs", "raison"], specialiste: "sante"},
  {id: "travail", nom: "For my job", detail: "Letters, reports, documents", icone: "handshake", tags: ["mail", "docs"]},
];
const besoinsPour = machine => machine && machine.telephone ? BESOINS_TELEPHONE : BESOINS;

const CONSEILLABLES_TELEPHONE = ["qwen3.5-0.8b", "luciole-1b", "granite-4.0-nano-1b", "smollm3-3b", "ministral-3-3b", "phi-4-mini",
  "gemma-4-e2b", "gemma-4-e4b", "ministral-3-8b"];
function conseilTelephone(machine){
  const tiennent = CONSEILLABLES_TELEPHONE.map(modele).filter(m => installable(m) && pourLaLangue(m)).filter(m => EST.tient(m, machine));
  if (!tiennent.length) return modele("qwen3.5-0.8b") || plusPetite();
  const bons = tiennent.filter(m => vitesse(m, machine).niveau >= vitesseMin(machine));
  if (!bons.length) return tiennent.slice().sort((a, b) => EST.jetons(b, machine) - EST.jetons(a, machine))[0];
  return bons.slice().sort((a, b) => savoir(b).niveau - savoir(a).niveau || (bonusFrancais(b) - bonusFrancais(a)) || (a.total - b.total))[0];
}
const conseilPour = machine => machine && machine.telephone ? conseilTelephone(machine) : conseil(machine);

const TELEPHONES = [
  {id: "iphone", os: "iphone", nom: "iPhone", detail: "8 GB of memory", memoire: 8, dispo: 2.8, debit: 35, telephone: true},
  {id: "android", os: "android", nom: "Android phone", detail: "12 GB of memory", memoire: 12, dispo: 4.8, debit: 10, telephone: true},
];

const NOM_APPAREIL = {mac: "Mac", windows: "PC", linux: "computer", iphone: "iPhone", ipad: "iPad", android: "phone"};
function debitPour(os, puce, memoire, intel){
  if (os === "mac" && intel) return 30;
  if (os === "mac"){
    if (/Ultra/.test(puce)) return 800;
    if (/Max/.test(puce)) return 400;
    if (/M3 Pro/.test(puce)) return 150;
    if (/M4 Pro/.test(puce)) return 273;
    if (/Pro/.test(puce)) return 200;
    if (/M\d/.test(puce)) return 100;
    return memoire >= 64 ? 400 : memoire >= 32 ? 200 : 100;
  }
  if (os === "iphone" || os === "ipad") return memoire >= 12 ? 55 : 35;
  if (os === "android"){
    if (/SM8750|SM8850|MT699[3-9]|Dimensity 9[45]\d\d|Snapdragon 8 Elite|8 Elite/i.test(puce)) return 30;
    if (/SM8[56]50|SM8635|MT69[89]\d|Dimensity 9[23]\d\d|Snapdragon 8s? Gen [23]|Tensor G[3-9]|Exynos ?2[45]\d\d|s5e99[4-5]\d/i.test(puce)) return 25;
    if (/SM8450|SM8475|Snapdragon 8\+? Gen 1|Dimensity 9000|Tensor G[12]|Exynos ?2200/i.test(puce)) return 20;
    return memoire >= 16 ? 25 : 10;
  }
  return memoire <= 8 ? 20 : 50;
}
function dispoTelephone(os, memoire){
  if (os === "iphone" || os === "ipad") return memoire >= 12 ? 4.8 : memoire >= 8 ? 2.8 : 1.5;
  return Math.round(memoire * (memoire >= 12 ? 0.4 : 0.35) * 10) / 10;
}
function dispoPour(os, memoire, intel, dispoApp){
  if (os === "iphone" || os === "ipad" || os === "android") return Math.round((dispoApp ? Math.min(dispoApp * 0.8, dispoTelephone(os, memoire)) : dispoTelephone(os, memoire)) * 10) / 10;
  return os === "mac" && !intel ? Math.round(memoire * 0.75) : Math.max(1.5, memoire - 4);
}
function machinePour(d){
  const os = d.os || "mac", memoire = Math.round(d.memoire), telephone = os === "iphone" || os === "ipad" || os === "android";
  const vram = !telephone && os !== "mac" && d.vram >= 4 ? Math.round(d.vram) : 0;
  const debitGpu = vram >= 24 ? 700 : vram >= 16 ? 450 : vram >= 12 ? 360 : vram >= 8 ? 250 : vram ? 150 : 0;
  return {id: "moi", os, nom: NOM_APPAREIL[os] || "computer", memoire, telephone, vram, debitGpu,
    dispo: dispoPour(os, memoire, d.intel, d.dispo), debit: debitPour(os, d.puce || "", memoire, d.intel)};
}

function capacitesAnglais(choisi, machine){
  const nom = machine.nom, n = EST.tient(choisi, machine) ? savoir(choisi).niveau : 0, b = choisi.bon;
  const avec = (liste, cle, texte) => cle !== "images" && b.includes(cle) ? [...liste, texte] : liste;
  if (machine.telephone){
    if (n === 0) return {titre: t("Your {nom} is short on memory for an AI.", {nom}), peut: (["Very short answers, slowly"]), lent: (["Almost everything else"])};
    if (n <= 2) return {titre: t("Your {nom} can run a small AI for simple things.", {nom}),
      peut: avec(avec(["Reply to a message, fix your spelling", "Sum up an article or a long message", "Answer simple questions, even offline"], "images", "Read a sign or a label from a photo"), "trad", "Translate a sentence"),
      lent: (["Long documents and hard questions: your computer does them better"])};
    return {titre: t("Your {nom} can run a good everyday AI.", {nom}),
      peut: avec(avec(["Write and reply to your messages", "Sum up articles and documents", "Answer everyday questions, even offline"], "images", "Read a sign or a label from a photo"), "trad", "Translate a conversation"),
      lent: (["Long tasks in several steps"])};
  }
  if (n === 0) return {titre: t("Your {nom} is short on memory for an AI.", {nom}), peut: (["Short rewrites and simple questions, slowly"]), lent: (["Almost everything else"])};
  if (n <= 2) return {titre: t("Your {nom} can run a small AI for simple things.", {nom}),
    peut: avec(["Rewrite and correct your emails", "Sum up a letter or a short document", "Answer simple questions"], "images", "Look at a photo and describe it"),
    lent: (["Long documents and tasks in several steps"])};
  if (n === 3) return {titre: t("Your {nom} can run a good everyday AI.", {nom}),
    peut: avec(["Write your emails and letters", "Sum up your documents", "Answer everyday questions, help with homework"], "images", "Look at a photo and describe it"),
    lent: (["Long tasks in several steps"])};
  if (n === 4) return {titre: t("Your {nom} can run a very good AI.", {nom}),
    peut: avec(["Write and sum up almost anything", "Think through harder questions", "Read long documents"], "code", "Help you write code"),
    lent: (["The hardest questions, where the big online AIs are still ahead"])};
  return {titre: t("Your {nom} can run one of the biggest free AIs we list.", {nom}), peut: (avec(["Everything an everyday AI does", "Tasks in several steps"], "code", "Help you write code")), lent: ([])};
}
function capacites(choisi, machine){
  const c = capacitesAnglais(choisi, machine);
  return {titre: c.titre, peut: c.peut.map(x => t(x)), lent: c.lent.map(x => t(x))};
}
function propositions(machine){
  const reco = conseilPour(machine);
  const liste = (machine.telephone ? CONSEILLABLES_TELEPHONE : CONSEILLABLES).map(modele).filter(m => installable(m) && pourLaLangue(m) && pourLeSysteme(m, machine));
  const tiennent = liste.filter(x => EST.tient(x, machine) && x.id !== reco.id);
  const plusLegere = tiennent.filter(x => x.total < reco.total).sort((a, b) => b.total - a.total)[0];
  const plusForte = tiennent.filter(x => x.total > reco.total).sort((a, b) => a.total - b.total)[0];
  const encore = tiennent.filter(x => x.total < reco.total && x !== plusLegere).sort((a, b) => b.total - a.total)[0];
  return {reco, liste: [reco, plusLegere, plusForte || encore].filter(Boolean)};
}
