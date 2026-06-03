// wf-lib.jsx — shared wireframe primitives + placeholder data.
// Exports to window: WF { Icon, Donut, Bars, Spark, Progress, money, data }

const money = (n) => {
  // group thousands with thin spaces; francophone format
  const s = Math.abs(Math.round(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return (n < 0 ? "-" : "") + s;
};

// ---- minimal line icons -------------------------------------------------
const ICONS = {
  grid: <><rect x="4" y="4" width="6.5" height="6.5" rx="1.4"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.4"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.4"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.4"/></>,
  exchange: <><path d="M8 4v15"/><path d="M5 16l3 3 3-3"/><path d="M16 20V5"/><path d="M19 8l-3-3-3 3"/></>,
  gauge: <><path d="M5 17a7 7 0 0 1 14 0"/><path d="M12 17l4.5-3.2"/><circle cx="12" cy="17" r="1.1" fill="currentColor" stroke="none"/></>,
  target: <><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/></>,
  analytics: <><path d="M4 20h16"/><path d="M6 20v-7"/><path d="M11 20V6"/><path d="M16 20v-4"/><path d="M20.5 20v-9"/></>,
  wallet: <><path d="M4 8.5C4 7 5 6 6.5 6H18v3"/><path d="M4 8.5V18a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1V9H6"/><circle cx="16.5" cy="14" r="1.1" fill="currentColor" stroke="none"/></>,
  bank: <><path d="M4 9l8-5 8 5"/><path d="M5 9h14"/><path d="M6 9v8M10 9v8M14 9v8M18 9v8"/><path d="M4 20h16"/></>,
  bell: <><path d="M6 9a6 6 0 0 1 12 0c0 5 1.8 6.5 1.8 6.5H4.2S6 14 6 9z"/><path d="M10 19a2 2 0 0 0 4 0"/></>,
  gear: <><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1"/></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.8-4.8"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  chevron: <><path d="M9 5l7 7-7 7"/></>,
  calendar: <><rect x="4" y="5.5" width="16" height="15" rx="2"/><path d="M4 10h16M8.5 3v4M15.5 3v4"/></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
  up: <><path d="M7 17L17 7"/><path d="M9 7h8v8"/></>,
  down: <><path d="M7 7l10 10"/><path d="M17 9v8h-8"/></>,
  filter: <><path d="M4 6h16M7 12h10M10 18h4"/></>,
  flag: <><path d="M6 21V4"/><path d="M6 4h11l-2 3.5L17 11H6"/></>,
  arrowR: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
  home: <><path d="M4 11l8-7 8 7"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/></>,
  more: <><circle cx="6" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="18" cy="12" r="1.4" fill="currentColor" stroke="none"/></>,
  bolt: <><path d="M13 3L5 13h6l-1 8 8-11h-6z"/></>,
  lock: <><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.1" fill="currentColor" stroke="none"/></>,
  unlock: <><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/><circle cx="12" cy="15.5" r="1.1" fill="currentColor" stroke="none"/></>,
  user: <><circle cx="12" cy="8.5" r="3.4"/><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6"/></>,
  shield: <><path d="M12 3l7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/></>,
  globe: <><circle cx="12" cy="12" r="8"/><path d="M4 12h16"/><path d="M12 4c2.6 2.4 2.6 13.6 0 16M12 4c-2.6 2.4-2.6 13.6 0 16"/></>,
  tag: <><path d="M4 12.8V5.5A1.5 1.5 0 0 1 5.5 4h7.3a2 2 0 0 1 1.4.6l5.2 5.2a2 2 0 0 1 0 2.8l-6.3 6.3a2 2 0 0 1-2.8 0L4.6 14.2A2 2 0 0 1 4 12.8z"/><circle cx="8.5" cy="8.5" r="1.1" fill="currentColor" stroke="none"/></>,
  help: <><circle cx="12" cy="12" r="8"/><path d="M9.4 9.3a2.8 2.8 0 0 1 5.3 1c0 1.9-2.7 2.2-2.7 3.9"/><circle cx="12" cy="17" r="1" fill="currentColor" stroke="none"/></>,
  logout: <><path d="M14 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4"/><path d="M14 12H4M7 8l-4 4 4 4"/></>,
  check: <><path d="M5 13l4 4L19 7"/></>,
  moon: <><path d="M20 13.5A8 8 0 1 1 10.5 4 6.5 6.5 0 0 0 20 13.5z"/></>,
  download: <><path d="M12 4v10M8 11l4 4 4-4M5 19h14"/></>,
  trash: <><path d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6.5 7l1 13h9l1-13"/></>,
  edit: <><path d="M4 20h4L18 10l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></>,
  card: <><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/></>,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.6"/></>,
  eyeOff: <><path d="M4 4l16 16"/><path d="M9.6 5.8A9.3 9.3 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-3 3.6M6.2 7.7A16 16 0 0 0 2.5 12S6 18.5 12 18.5c.9 0 1.7-.1 2.5-.4"/><path d="M9.8 10a2.6 2.6 0 0 0 3.7 3.7"/></>,
  inbox: <><path d="M4 13l2.5-7.5h11L20 13"/><path d="M4 13v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5h-5l-1.5 2.5h-3L9 13z"/></>,
  alert: <><path d="M12 4l9 16H3z"/><path d="M12 10v4.5"/><circle cx="12" cy="17.5" r="1" fill="currentColor" stroke="none"/></>,
  message: <><path d="M5 5h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H10l-4 3.2V15H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/><path d="M8.5 9.5h7M8.5 12h4"/></>,
  send: <><path d="M5 12l14-7-5.5 15-3-6z"/><path d="M19 5l-8 7"/></>,
  repeat: <><path d="M19 12a7 7 0 1 1-2.2-5.1"/><path d="M20 4.5V9h-4.5"/></>,
  trendUp: <><path d="M4 20h16"/><path d="M5 16l4.5-4.5 3 3L18 8"/><path d="M14.5 8H18v3.5"/></>,
  mic: <><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0"/><path d="M12 17.5V21M8.5 21h7"/></>,
  stop: <><rect x="6" y="6" width="12" height="12" rx="2.5"/></>,
  layers: <><path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/></>,
  sliders: <><path d="M5 5v6M5 15v4M12 5v3M12 12v7M19 5v8M19 17v2"/><circle cx="5" cy="13" r="2"/><circle cx="12" cy="10" r="2"/><circle cx="19" cy="15" r="2"/></>,
  phone: <><rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M10.5 18.5h3"/></>,
  cash: <><rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v5M18 9.5v5"/></>,
  pause: <><rect x="7" y="5" width="3.5" height="14" rx="1"/><rect x="13.5" y="5" width="3.5" height="14" rx="1"/></>,
  refresh: <><path d="M3.5 12a8.5 8.5 0 0 1 14.5-6M20.5 12a8.5 8.5 0 0 1-14.5 6"/><path d="M18 3v3.5h-3.5M6 21v-3.5h3.5"/></>,
  finger: <><path d="M12 4.5c-3 0-5.5 2.4-5.5 5.4v2.3"/><path d="M12 8.2a1.9 1.9 0 0 0-1.9 1.9v3.7a8 8 0 0 1-.7 3.3"/><path d="M12 10.1v3.6a12 12 0 0 1-1.3 5.5"/><path d="M15.5 10.4v3.3a16 16 0 0 1-.9 5.3"/><path d="M17.5 12.4V10a5.5 5.5 0 0 0-8.4-4.7"/></>,
  mail: <><rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M4 7.5l8 5 8-5"/></>,
  chat: <><path d="M4 5.5h16a1 1 0 0 1 1 1V16a1 1 0 0 1-1 1H9l-4 3.5V17H4a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1z"/></>,
  upload: <><path d="M12 16V5M8 9l4-4 4 4M5 19h14"/></>,
  cloud: <><path d="M7 18a4 4 0 0 1-.5-7.97A5.5 5.5 0 0 1 17 9.5a3.5 3.5 0 0 1 .5 8.5z"/></>,
  folder: <><path d="M3.5 7.5A1.5 1.5 0 0 1 5 6h4l2 2.5h8a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 19 18.5H5A1.5 1.5 0 0 1 3.5 17z"/></>,
  book: <><path d="M5 4.5h11A2.5 2.5 0 0 1 18.5 7v12.5H7A2 2 0 0 1 5 17.5z"/><path d="M5 4.5v13"/><path d="M9 8.5h6M9 11.5h4"/></>,
  palette: <><path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.4 0 2-1 2-1.8 0-1.3-1.3-1.5-1.3-2.7 0-.8.7-1.5 1.6-1.5H16a4.5 4.5 0 0 0 4.5-4.5C20.5 6.4 16.7 3.5 12 3.5z"/><circle cx="8" cy="11" r="1.1" fill="currentColor" stroke="none"/><circle cx="12" cy="8" r="1.1" fill="currentColor" stroke="none"/><circle cx="16" cy="10.5" r="1.1" fill="currentColor" stroke="none"/></>,
  clock: <><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></>,
};

function Icon({ name, size = 20, stroke = 1.7, className = "" }) {
  return (
    <svg className={"wf-ic " + className} width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      {ICONS[name] || null}
    </svg>
  );
}

// ---- donut (grayscale + optional one signal slice) ----------------------
function Donut({ segments, size = 132, hole = 0.62, label, sub, valSize }) {
  const stops = [];
  let acc = 0;
  segments.forEach((s) => {
    stops.push(`${s.color} ${acc}% ${acc + s.v}%`);
    acc += s.v;
  });
  if (acc < 100) stops.push(`var(--line-soft) ${acc}% 100%`);
  const vs = valSize || Math.max(11, Math.round(size * 0.15));
  return (
    <div className="wf-donut" style={{ width: size, height: size, background: `conic-gradient(${stops.join(",")})` }}>
      <div className="wf-donut-hole" style={{ inset: `${(1 - hole) * 50}%` }}>
        {label && <div className="wf-donut-val" style={{ fontSize: vs }}>{label}</div>}
        {sub && <div className="wf-donut-sub">{sub}</div>}
      </div>
    </div>
  );
}

// ---- grouped bars (cashflow) --------------------------------------------
function Bars({ data, height = 140 }) {
  const max = Math.max(...data.flatMap((d) => [d.rev, d.dep]));
  return (
    <div className="wf-bars" style={{ height }}>
      {data.map((d, i) => (
        <div className="wf-bargrp" key={i}>
          <div className="wf-barpair">
            <span className="wf-bar rev" style={{ height: `${(d.rev / max) * 100}%` }} />
            <span className="wf-bar dep" style={{ height: `${(d.dep / max) * 100}%` }} />
          </div>
          <span className="wf-barlbl">{d.m}</span>
        </div>
      ))}
    </div>
  );
}

// ---- sparkline ----------------------------------------------------------
function Spark({ pts, w = 160, h = 44, stroke = "var(--accent)", fill = "var(--accent-wash)" }) {
  const max = Math.max(...pts), min = Math.min(...pts);
  const span = max - min || 1;
  const step = w / (pts.length - 1);
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${(h - ((p - min) / span) * (h - 6) - 3).toFixed(1)}`).join(" ");
  return (
    <svg className="wf-spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <path d={`${d} L${w},${h} L0,${h} Z`} fill={fill} stroke="none" />
      <path d={d} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ---- progress bar -------------------------------------------------------
function Progress({ pct, tone = "" }) {
  return (
    <div className="wf-prog">
      <i className={"wf-prog-fill " + tone} style={{ width: Math.min(pct, 100) + "%" }} />
    </div>
  );
}

// ---- half-circle gauge --------------------------------------------------
function Gauge({ pct, tone = "", size = 152, stroke = 13 }) {
  const r = (size - stroke) / 2;
  const cy = size / 2;
  const circ = Math.PI * r;
  const shown = Math.max(0, Math.min(pct, 100));
  const col = tone === "over" ? "var(--neg)" : tone === "warn" ? "var(--warn)" : tone === "ok" ? "var(--pos)" : "var(--accent)";
  const h = cy + stroke / 2 + 2;
  const d = `M ${stroke / 2} ${cy} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${cy}`;
  return (
    <div style={{ position: "relative", width: size, height: h }}>
      <svg width={size} height={h} viewBox={`0 0 ${size} ${h}`} style={{ display: "block" }}>
        <path d={d} fill="none" stroke="var(--panel-2)" strokeWidth={stroke} strokeLinecap="round" />
        <path d={d} fill="none" stroke={col} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - shown / 100)} />
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: cy - 32, textAlign: "center" }}>
        <div className="t-mono" style={{ fontSize: 26, fontWeight: 600, color: col, lineHeight: 1 }}>{pct}%</div>
        <div className="t-faint" style={{ fontSize: 10.5, fontWeight: 600, marginTop: 3 }}>consommé</div>
      </div>
    </div>
  );
}

// ---- shared placeholder data --------------------------------------------
const data = {
  user: "Aïcha",
  period: "Mai 2026",
  total: 2480000,
  totalDelta: 3.2,
  revenus: 850000,
  depenses: 612000,
  epargne: 238000,
  spark: [60, 58, 63, 61, 67, 64, 70, 68, 74, 72, 78, 80],
  cashflow: [
    { m: "Déc", rev: 780, dep: 640 },
    { m: "Jan", rev: 810, dep: 590 },
    { m: "Fév", rev: 760, dep: 700 },
    { m: "Mar", rev: 830, dep: 620 },
    { m: "Avr", rev: 820, dep: 580 },
    { m: "Mai", rev: 850, dep: 612 },
  ],
  repartition: [
    { name: "Alimentation", v: 28, color: "#3a3a3e" },
    { name: "Transport", v: 19, color: "#6f6f76" },
    { name: "Logement", v: 22, color: "#9a9aa1" },
    { name: "Factures", v: 14, color: "#c1c1c6" },
  ],
  comptes: [
    { name: "Compte courant", bank: "NSIA Banque", bal: 1120000 },
    { name: "Épargne", bank: "Ecobank", bal: 980000 },
    { name: "Orange Money", bank: "Mobile money", bal: 245000 },
    { name: "Wave", bank: "Mobile money", bal: 135000 },
  ],
  budgets: [
    { name: "Transport", spent: 54000, cap: 50000, pct: 108, tone: "over" },
    { name: "Alimentation", spent: 185000, cap: 200000, pct: 92, tone: "warn" },
    { name: "Loisirs", spent: 38000, cap: 50000, pct: 76, tone: "ok" },
  ],
  objectifs: [
    { name: "Fonds d'urgence", at: 1200000, goal: 2000000, pct: 60 },
    { name: "Voyage Dakar", at: 320000, goal: 800000, pct: 40 },
    { name: "Ordinateur", at: 450000, goal: 600000, pct: 75 },
  ],
  txns: [
    { name: "Marché de Cocody", cat: "Alimentation", acc: "Orange Money", amt: -25000, when: "Auj." },
    { name: "Salaire", cat: "Revenu", acc: "Compte courant", amt: 850000, when: "28 mai" },
    { name: "SODECI — eau", cat: "Factures", acc: "Compte courant", amt: -18500, when: "27 mai" },
    { name: "Transfert épargne", cat: "Transfert", acc: "→ Épargne", amt: -100000, when: "26 mai" },
    { name: "Course Yango", cat: "Transport", acc: "Wave", amt: -6200, when: "26 mai" },
  ],
  pret: { name: "Prêt auto", reste: 3200000, mensualite: 145000, echeance: "15 juin", progress: 36, capital: 5000000, taux: 9.5, restant: 22, total: 36 },
  notifs: [
    { t: "Budget Transport dépassé", s: "108 % — +4 000 FCFA", tone: "over" },
    { t: "Échéance prêt dans 5 jours", s: "145 000 FCFA le 15 juin", tone: "warn" },
    { t: "Objectif Voyage : +50 000", s: "Contribution reçue", tone: "ok" },
  ],

  // ---- extended data for module screens ----
  txnsFull: [
    { name: "Marché de Cocody", cat: "Alimentation", acc: "Orange Money", amt: -25000, when: "31 mai", type: "Dépense" },
    { name: "Salaire", cat: "Revenu", acc: "Compte courant", amt: 850000, when: "28 mai", type: "Revenu" },
    { name: "SODECI — eau", cat: "Factures", acc: "Compte courant", amt: -18500, when: "27 mai", type: "Dépense" },
    { name: "Transfert épargne", cat: "Transfert", acc: "→ Épargne", amt: -100000, when: "26 mai", type: "Transfert" },
    { name: "Course Yango", cat: "Transport", acc: "Wave", amt: -6200, when: "26 mai", type: "Dépense" },
    { name: "Abonnement Canal+", cat: "Loisirs", acc: "Compte courant", amt: -15000, when: "25 mai", type: "Récurrente" },
    { name: "Pharmacie Plateau", cat: "Santé", acc: "Wave", amt: -8400, when: "24 mai", type: "Dépense" },
    { name: "Freelance design", cat: "Revenu", acc: "Wave", amt: 120000, when: "23 mai", type: "Revenu" },
    { name: "CIE — électricité", cat: "Factures", acc: "Compte courant", amt: -22000, when: "22 mai", type: "Récurrente" },
    { name: "Supermarché Prosuma", cat: "Alimentation", acc: "Orange Money", amt: -34500, when: "21 mai", type: "Dépense" },
  ],
  txnTabs: ["Tous", "Revenus", "Dépenses", "Transferts", "Récurrentes"],
  budgetsFull: [
    { name: "Transport", spent: 54000, cap: 50000, pct: 108, tone: "over", txns: 12 },
    { name: "Alimentation", spent: 185000, cap: 200000, pct: 92, tone: "warn", txns: 24 },
    { name: "Factures", spent: 58500, cap: 90000, pct: 65, tone: "ok", txns: 6 },
    { name: "Loisirs", spent: 38000, cap: 50000, pct: 76, tone: "ok", txns: 9 },
    { name: "Santé", spent: 8400, cap: 40000, pct: 21, tone: "ok", txns: 3 },
    { name: "Logement", spent: 135000, cap: 135000, pct: 100, tone: "warn", txns: 1 },
  ],
  budgetTxns: [
    { name: "Course Yango", acc: "Wave", amt: -6200, when: "26 mai" },
    { name: "Carburant Total", acc: "Compte courant", amt: -25000, when: "20 mai" },
    { name: "Course Yango", acc: "Orange Money", amt: -4800, when: "18 mai" },
    { name: "Gbaka + bus", acc: "Orange Money", amt: -3000, when: "15 mai" },
    { name: "Carburant Total", acc: "Compte courant", amt: -15000, when: "8 mai" },
  ],
  contributions: [
    { amt: 50000, acc: "Compte courant", when: "28 mai" },
    { amt: 100000, acc: "→ Épargne", when: "30 avr." },
    { amt: 75000, acc: "Wave", when: "2 avr." },
    { amt: 95000, acc: "Compte courant", when: "29 mars" },
  ],
  comptesFull: [
    { name: "Compte courant", bank: "NSIA Banque", bal: 1120000, type: "Trésorerie", num: "•• 4821" },
    { name: "Épargne", bank: "Ecobank", bal: 980000, type: "Épargne", num: "•• 7390" },
    { name: "Orange Money", bank: "Mobile money", bal: 245000, type: "Mobile money", num: "07 •• 12" },
    { name: "Wave", bank: "Mobile money", bal: 135000, type: "Mobile money", num: "05 •• 88", blocked: true },
    { name: "Espèces", bank: "Enveloppe · mode allégé", bal: 38000, type: "Espèces", num: "réconcilié 24 mai" },
  ],
  compteOps: [
    { name: "Salaire", cat: "Revenu", amt: 850000, when: "28 mai" },
    { name: "SODECI — eau", cat: "Factures", amt: -18500, when: "27 mai" },
    { name: "Transfert épargne", cat: "Transfert", amt: -100000, when: "26 mai" },
    { name: "CIE — électricité", cat: "Factures", amt: -22000, when: "22 mai" },
    { name: "Retrait DAB", cat: "Retrait", amt: -50000, when: "19 mai" },
  ],
  catAnalytics: [
    { name: "Alimentation", v: 28, amt: 171000, color: "#3a3a3e", trend: "+6%" },
    { name: "Logement", v: 22, amt: 135000, color: "#9a9aa1", trend: "0%" },
    { name: "Transport", v: 19, amt: 116000, color: "#6f6f76", trend: "+14%" },
    { name: "Factures", v: 14, amt: 86000, color: "#c1c1c6", trend: "-3%" },
    { name: "Loisirs", v: 9, amt: 55000, color: "#b9c4d4", trend: "+2%" },
    { name: "Santé", v: 8, amt: 49000, color: "#cdd6e2", trend: "+9%" },
  ],
  amortissement: [
    { n: "Juin 2026", cap: 117500, int: 27500, reste: 3082500 },
    { n: "Juil. 2026", cap: 118400, int: 26600, reste: 2964100 },
    { n: "Août 2026", cap: 119300, int: 25700, reste: 2844800 },
    { n: "Sept. 2026", cap: 120200, int: 24800, reste: 2724600 },
    { n: "Oct. 2026", cap: 121100, int: 23900, reste: 2603500 },
  ],
  amortFull: [
    { n: "Juin 2026", cap: 117500, int: 27500, reste: 3082500 },
    { n: "Juil. 2026", cap: 118400, int: 26600, reste: 2964100 },
    { n: "Août 2026", cap: 119300, int: 25700, reste: 2844800 },
    { n: "Sept. 2026", cap: 120200, int: 24800, reste: 2724600 },
    { n: "Oct. 2026", cap: 121100, int: 23900, reste: 2603500 },
    { n: "Nov. 2026", cap: 122000, int: 23000, reste: 2481500 },
    { n: "Déc. 2026", cap: 122900, int: 22100, reste: 2358600 },
    { n: "Janv. 2027", cap: 123900, int: 21100, reste: 2234700 },
    { n: "Févr. 2027", cap: 124900, int: 20100, reste: 2109800 },
    { n: "Mars 2027", cap: 125900, int: 19100, reste: 1983900 },
    { n: "Avr. 2027", cap: 126900, int: 18100, reste: 1857000 },
    { n: "Mai 2027", cap: 127900, int: 17100, reste: 1729100 },
  ],
  paiements: [
    { n: "Juin 2026", amt: 145000, when: "15 juin 2026", status: "À venir" },
    { n: "Mai 2026", amt: 145000, when: "15 mai 2026", status: "Payé" },
    { n: "Avril 2026", amt: 145000, when: "15 avr. 2026", status: "Payé" },
    { n: "Mars 2026", amt: 145000, when: "15 mars 2026", status: "Payé" },
    { n: "Février 2026", amt: 145000, when: "15 févr. 2026", status: "Payé" },
    { n: "Janvier 2026", amt: 145000, when: "15 janv. 2026", status: "Payé" },
    { n: "Décembre 2025", amt: 145000, when: "15 déc. 2025", status: "Payé" },
  ],
  trend: [
    { m: "Déc", rev: 780, dep: 640, epa: 140 },
    { m: "Janv", rev: 810, dep: 590, epa: 220 },
    { m: "Févr", rev: 760, dep: 700, epa: 60 },
    { m: "Mars", rev: 830, dep: 620, epa: 210 },
    { m: "Avr", rev: 820, dep: 580, epa: 240 },
    { m: "Mai", rev: 850, dep: 612, epa: 238 },
  ],
  notifsFull: [
    { t: "Budget Transport dépassé", s: "Vous avez dépassé le plafond de 4 000 FCFA.", tone: "over", when: "Il y a 2 h", read: false, ic: "gauge" },
    { t: "Échéance prêt dans 5 jours", s: "145 000 FCFA seront prélevés le 15 juin.", tone: "warn", when: "Il y a 5 h", read: false, ic: "bank" },
    { t: "Objectif Voyage : +50 000 reçus", s: "Vous êtes à 40 % de votre objectif.", tone: "ok", when: "Hier", read: false, ic: "target" },
    { t: "Salaire reçu", s: "+850 000 FCFA crédités sur Compte courant.", tone: "ok", when: "28 mai", read: true, ic: "up" },
    { t: "Compte Wave bloqué", s: "Le blocage a été activé depuis votre appareil.", tone: "", when: "27 mai", read: true, ic: "lock" },
    { t: "Facture SODECI à venir", s: "18 500 FCFA prévus le 2 juin.", tone: "warn", when: "26 mai", read: true, ic: "calendar" },
    { t: "Rapport mensuel disponible", s: "Votre bilan financier de mai est prêt.", tone: "", when: "25 mai", read: true, ic: "analytics" },
  ],

  // ---- IA layer ----
  insights: [
    { tag: "Prévision", tone: "warn", ic: "gauge", text: "À ce rythme, votre budget Alimentation sera dépassé dans 6 jours.", cta: "Voir le budget" },
    { tag: "Anomalie", tone: "over", ic: "alert", text: "Dépense de 85\u202f000 FCFA chez Orca Déco, inhabituelle par rapport à vos habitudes.", cta: "Examiner" },
    { tag: "Tendance", tone: "", ic: "trendUp", text: "Vos dépenses Transport sont 28 % plus élevées que le mois dernier.", cta: "Analyser" },
    { tag: "Conseil", tone: "ok", ic: "target", text: "En versant 40\u202f000 FCFA/mois, vous atteignez « Fonds d'urgence » avec 2 mois d'avance.", cta: "Ajuster l'objectif" },
    { tag: "Récurrence", tone: "", ic: "repeat", text: "3 nouveaux paiements récurrents détectés : Canal+, CIE, Spotify.", cta: "Gérer les abonnements" },
  ],
  prevision: { now: 1120000, j7: 1180000, j15: 920000, fin: 1240000 },
  prevSeries: { labels: ["Auj.", "+7 j", "+15 j", "+21 j", "Fin mai"], vals: [1120, 1180, 1010, 920, 1240] },
  anomalies: [
    { name: "Orca Déco", cat: "Maison", amt: -85000, when: "29 mai", reason: "Montant 3× supérieur à vos dépenses Maison habituelles.", niveau: "Élevé" },
    { name: "Retrait DAB", cat: "Retrait", amt: -150000, when: "24 mai", reason: "Retrait inhabituel un week-end.", niveau: "Moyen" },
    { name: "Glovo (x4)", cat: "Alimentation", amt: -32000, when: "23 mai", reason: "4 commandes de livraison en 2 jours.", niveau: "Moyen" },
  ],
  recurrences: [
    { name: "Loyer", amt: -135000, freq: "Mensuel", next: "1 juin", known: true },
    { name: "Canal+", amt: -15000, freq: "Mensuel", next: "5 juin", known: false },
    { name: "CIE — électricité", amt: -22000, freq: "Mensuel", next: "22 juin", known: true },
    { name: "Spotify", amt: -3500, freq: "Mensuel", next: "12 juin", known: false },
  ],
  chat: [
    { role: "ai", text: "Bonjour Aïcha. Vos revenus couvrent vos dépenses ce mois-ci, mais le budget Transport est déjà dépassé. Que souhaitez-vous savoir ?" },
    { role: "user", text: "Où part mon argent ce mois-ci ?" },
    { role: "ai", text: "Vos trois principaux postes en mai :", bars: [{ l: "Alimentation", v: 171, p: 28 }, { l: "Logement", v: 135, p: 22 }, { l: "Transport", v: 116, p: 19 }] },
    { role: "user", text: "Si j'augmente mon épargne de 25\u202f000 FCFA, où j'arrive dans 6 mois ?" },
    { role: "ai", text: "En passant de 25\u202f000 à 50\u202f000 FCFA/mois, votre épargne atteindrait environ 1,55 M FCFA d'ici novembre, soit 300\u202f000 FCFA de plus qu'au rythme actuel." },
  ],
  suggestions: [
    "Où part mon argent ce mois-ci ?",
    "Vais-je dépasser un budget ?",
    "Quel sera mon solde en fin de mois ?",
    "Comment atteindre mon objectif plus vite ?",
    "Quelles dépenses sont inhabituelles ?",
  ],

  // ---- couche de capture multi-canal ----
  canaux: [
    { id: "wave", l: "Wave", sub: "Mobile money", ic: "card" },
    { id: "om", l: "Orange Money", sub: "Mobile money", ic: "card" },
    { id: "cash", l: "Cash", sub: "Espèces", ic: "cash" },
    { id: "banque", l: "Banque", sub: "NSIA / Ecobank", ic: "bank" },
  ],
  captureModes: [
    { id: "voice", ic: "mic", l: "Note vocale", sub: "Dictez, l'app structure" },
    { id: "chat", ic: "message", l: "Langage naturel", sub: "« Wave 3500 déjeuner »" },
    { id: "quick", ic: "bolt", l: "Saisie rapide", sub: "Formulaire ultra-court" },
    { id: "sms", ic: "phone", l: "SMS auto (Android)", sub: "Complémentaire" },
  ],
  voiceDraft: {
    transcript: "Wave 3 500 pour le déjeuner",
    fields: [
      { k: "Montant", v: "3 500 FCFA", conf: "high" },
      { k: "Type", v: "Dépense", conf: "high" },
      { k: "Canal", v: "Wave", conf: "high" },
      { k: "Catégorie", v: "Alimentation", conf: "med" },
      { k: "Compte", v: "Wave", conf: "high" },
      { k: "Date", v: "Aujourd'hui · 13:24", conf: "high" },
    ],
  },
  smsInbox: [
    { from: "Wave", raw: "Paiement de 3 500 FCFA chez RESTO BELLEVILLE. Solde : 131 500 FCFA.", amt: -3500, cat: "Alimentation", when: "13:24", conf: "high" },
    { from: "Orange Money", raw: "Transfert reçu de 150 000 FCFA. Nouveau solde 395 000 FCFA.", amt: 150000, cat: "Revenu", when: "Hier", conf: "high" },
    { from: "NSIA", raw: "Achat 12 800 FCFA TOTAL ENERGIES par carte ****4821.", amt: -12800, cat: "Transport", when: "Hier", conf: "med" },
  ],
  reconcile: [
    { name: "SMS Wave non rattaché", sub: "3 500 FCFA · RESTO BELLEVILLE", kind: "sms" },
    { name: "Retrait DAB à catégoriser", sub: "50 000 FCFA · 19 mai", kind: "cat" },
    { name: "Doublon possible", sub: "Yango 6 200 FCFA × 2 le 26 mai", kind: "dup" },
  ],
  cashEnvelope: { cap: 100000, spent: 62000, left: 38000, lastReconcile: "24 mai" },

  // ---- coach : transparence & gouvernance ----
  completeness: {
    score: 78,
    items: [
      { l: "Comptes connectés", v: "4 / 4", ok: true },
      { l: "Transactions du mois", v: "Suivi régulier", ok: true },
      { l: "Charges fixes déclarées", v: "5 / 6", ok: true },
      { l: "Cash réconcilié", v: "Il y a 8 jours", ok: false },
    ],
  },
  coachMaturity: { level: 2, labels: ["Débutant", "En apprentissage", "Fiable"] },
  coachAdvice: {
    niveau: "Recommandation",
    tone: "warn",
    question: "Est-ce que je peux m'offrir un téléphone à 250 000 FCFA ce mois-ci ?",
    observe: "Solde courant 1 120 000 · 2 échéances à venir (loyer 135 000, prêt 145 000) · épargne du mois 238 000.",
    analyse: "Après charges fixes et plafonds de budgets, votre marge disponible d'ici fin de mois est d'environ 92 000 FCFA.",
    confiance: 82,
    reco: "Cet achat dépasse votre marge du mois. Le repousser de 3 semaines (après le salaire) évite de puiser dans le fonds d'urgence.",
    options: ["Reporter au 28 (après salaire)", "Étaler sur l'épargne Ordinateur", "Ajuster le budget Loisirs"],
  },
  interventionLevels: [
    { l: "Observation", sub: "Information factuelle, sans recommandation.", tone: "", ic: "eye" },
    { l: "Alerte douce", sub: "Signal faible ou dérive naissante.", tone: "warn", ic: "bell" },
    { l: "Recommandation", sub: "Arbitrage conseillé, avec justification.", tone: "ok", ic: "target" },
    { l: "Opposition explicite", sub: "Rare · fort enjeu · confiance élevée.", tone: "over", ic: "alert" },
  ],

  // ---- gestion des catégories ----
  categoriesDep: [
    { name: "Alimentation", ic: "wallet", color: "#3a3a3e", budget: "200 000", n: 24 },
    { name: "Transport", ic: "exchange", color: "#6f6f76", budget: "50 000", n: 12 },
    { name: "Logement", ic: "bank", color: "#9a9aa1", budget: "—", n: 1 },
    { name: "Factures", ic: "card", color: "#c1c1c6", budget: "60 000", n: 6 },
    { name: "Loisirs", ic: "target", color: "#b58a4a", budget: "50 000", n: 9 },
    { name: "Santé", ic: "shield", color: "#8a6f9a", budget: "—", n: 3 },
  ],
  categoriesRev: [
    { name: "Salaire", ic: "up", color: "#2f7d57", budget: "—", n: 1 },
    { name: "Transferts reçus", ic: "exchange", color: "#3f8f6a", budget: "—", n: 4 },
    { name: "Autres revenus", ic: "wallet", color: "#5aa183", budget: "—", n: 2 },
  ],

  // ---- import / export ----
  importFormats: [
    { l: "Relevé CSV", sub: "Banque, mobile money", ic: "folder" },
    { l: "Fichier Excel", sub: ".xlsx, .xls", ic: "book" },
    { l: "Format OFX / QIF", sub: "Standard bancaire", ic: "bank" },
  ],
  exportFormats: ["PDF", "CSV", "Excel"],

  // ---- sauvegarde ----
  backups: [
    { when: "Aujourd'hui · 08:12", size: "2,4 Mo", auto: true },
    { when: "Hier · 08:05", size: "2,4 Mo", auto: true },
    { when: "29 mai · 08:09", size: "2,3 Mo", auto: true },
    { when: "24 mai · 21:40", size: "2,3 Mo", auto: false },
  ],

  // ---- centre d'aide ----
  faq: [
    { q: "Comment ajouter une transaction en espèces ?", c: "Capture" },
    { q: "Pourquoi un budget passe-t-il en rouge ?", c: "Budgets" },
    { q: "Comment fonctionne la lecture des SMS ?", c: "Capture" },
    { q: "Le coach peut-il se tromper ?", c: "Coach IA" },
    { q: "Mes données sont-elles partagées ?", c: "Confidentialité" },
    { q: "Comment bloquer un compte ?", c: "Comptes" },
  ],
  helpGuides: [
    { l: "Bien démarrer", sub: "5 min · prise en main", ic: "flag" },
    { l: "Maîtriser les budgets", sub: "Plafonds & alertes", ic: "gauge" },
    { l: "Le coach en 4 couches", sub: "Comprendre ses avis", ic: "layers" },
  ],

  // ---- préférences push ----
  pushCats: [
    { l: "Dépassement de budget", sub: "Quand un plafond est atteint", on: true, ic: "gauge" },
    { l: "Échéances de prêt", sub: "Rappel avant prélèvement", on: true, ic: "bank" },
    { l: "Objectifs", sub: "Progrès et contributions", on: true, ic: "target" },
    { l: "Anomalies détectées", sub: "Dépenses inhabituelles", on: true, ic: "alert" },
    { l: "Résumé hebdomadaire", sub: "Bilan chaque lundi", on: false, ic: "analytics" },
    { l: "Conseils du coach", sub: "Recommandations clés", on: false, ic: "sliders" },
  ],
};

window.WF = { Icon, Donut, Gauge, Bars, Spark, Progress, money, data };
