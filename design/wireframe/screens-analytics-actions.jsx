// screens-analytics-actions.jsx — Exporter le rapport + Période (drawers desktop)

// dimmed Analytics backdrop (reused under both drawers)
function AnaBackdrop() {
  const { Icon, Donut, money, data: D } = window.WF;
  return (
    <div style={{ pointerEvents: "none" }}>
      <div className="subnav">{["Overview", "Catégories", "Tendances", "Budget vs réel"].map((t, k) => <span key={t} className={"si" + (k === 0 ? " on" : "")}>{t}</span>)}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        {[{ l: "Revenus", v: D.revenus }, { l: "Dépenses", v: D.depenses }, { l: "Épargne", v: D.epargne }].map((k) => (
          <div className="wf-card wf-pad" key={k.l}><div className="kpi-label">{k.l}</div><div className="kpi-val" style={{ fontSize: 20, marginTop: 10 }}>{money(k.v)} <span className="kpi-cur">FCFA</span></div></div>
        ))}
      </div>
      <div className="wf-card wf-pad" style={{ marginTop: 14, display: "flex", justifyContent: "center" }}><Donut size={150} segments={D.catAnalytics} label="612 k" sub="dépenses" /></div>
    </div>
  );
}

// ---------- Exporter le rapport ----------
function AnaExportDesk() {
  const { Icon, data: D } = window.WF;
  return (
    <DeskShell active="Analytics" eyebrow="Mai 2026" title="Analytics"
      actions={[{ l: "Période", ic: "calendar" }, { l: "Exporter le rapport", ic: "download", primary: true }]}>
      <AnaBackdrop />
      <div className="scrim" />
      <aside className="drawer">
        <div className="drawer-h"><div style={{ fontWeight: 800, fontSize: 16 }}>Exporter le rapport</div><div className="icon-btn" style={{ width: 32, height: 32 }}><Icon name="plus" size={16} style={{ transform: "rotate(45deg)" }} /></div></div>
        <div className="drawer-b" style={{ overflow: "visible" }}>
          {/* format */}
          <div>
            <span className="lbl">Format du fichier</span>
            <div className="r" style={{ gap: 8 }}>
              {[{ l: "PDF", ic: "book", on: true }, { l: "CSV", ic: "folder" }, { l: "Excel", ic: "download" }].map((f) => (
                <div key={f.l} className={"choice" + (f.on ? " on" : "")} style={{ flexDirection: "column", flex: 1, padding: "13px 8px", gap: 7, alignItems: "center" }}>
                  <Icon name={f.ic} size={20} className={f.on ? "" : "t-muted"} />
                  <span style={{ fontWeight: 700, fontSize: 12.5 }}>{f.l}</span>
                </div>
              ))}
            </div>
          </div>
          {/* période */}
          <div>
            <span className="lbl">Période couverte</span>
            <div className="inp"><span className="r" style={{ gap: 8 }}><Icon name="calendar" size={15} className="t-faint" /> Mai 2026</span><Icon name="chevron" size={14} className="t-faint" /></div>
          </div>
          {/* sections */}
          <div>
            <span className="lbl">Sections à inclure</span>
            <div className="c" style={{ gap: 8 }}>
              {[{ l: "Synthèse & KPI", on: true }, { l: "Répartition par catégorie", on: true }, { l: "Tendances (6 mois)", on: true }, { l: "Budget vs réel", on: false }, { l: "Liste des transactions", on: false }].map((s) => (
                <div className="choice" key={s.l} style={{ padding: "11px 13px", gap: 11 }}>
                  <div className={"checkbox" + (s.on ? " on" : "")}>{s.on && <Icon name="check" size={13} />}</div>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{s.l}</span>
                </div>
              ))}
            </div>
          </div>
          {/* langue */}
          <div>
            <span className="lbl">Langue du rapport</span>
            <div className="seg-full"><button className="on">Français</button><button>English</button></div>
          </div>
        </div>
        <div className="drawer-f">
          <button className="btn block">Aperçu</button>
          <button className="btn primary block"><Icon name="download" size={16} /> Générer le PDF</button>
        </div>
      </aside>
    </DeskShell>
  );
}
window.AnaExportDesk = AnaExportDesk;

// ---------- Période ----------
function AnaPeriodDesk() {
  const { Icon } = window.WF;
  const days = ["L", "M", "M", "J", "V", "S", "D"];
  // May 2026 starts on Friday (index 4). 31 days.
  const lead = 4;
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push({ d: 27 + i, dim: true });
  for (let d = 1; d <= 31; d++) cells.push({ d, dim: false });
  while (cells.length % 7 !== 0) cells.push({ d: cells.length - lead - 31 + 1, dim: true });
  const inRange = (d) => d >= 1 && d <= 18;
  return (
    <DeskShell active="Analytics" eyebrow="Mai 2026" title="Analytics"
      actions={[{ l: "Période", ic: "calendar", primary: true }, { l: "Exporter le rapport", ic: "download" }]}>
      <AnaBackdrop />
      <div className="scrim" />
      <aside className="drawer">
        <div className="drawer-h"><div style={{ fontWeight: 800, fontSize: 16 }}>Choisir une période</div><div className="icon-btn" style={{ width: 32, height: 32 }}><Icon name="plus" size={16} style={{ transform: "rotate(45deg)" }} /></div></div>
        <div className="drawer-b" style={{ overflow: "visible" }}>
          {/* presets */}
          <div>
            <span className="lbl">Périodes rapides</span>
            <div className="r" style={{ gap: 7, flexWrap: "wrap" }}>
              {["Aujourd'hui", "7 jours", "Ce mois", "Trimestre", "Année", "Personnalisé"].map((p, i) => (
                <span key={p} className={"chip" + (i === 5 ? " on" : "")} style={{ fontSize: 12 }}>{p}</span>
              ))}
            </div>
          </div>
          {/* custom range */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div><span className="lbl">Du</span><div className="inp"><span>1 mai 2026</span><Icon name="calendar" size={14} className="t-faint" /></div></div>
            <div><span className="lbl">Au</span><div className="inp"><span>18 mai 2026</span><Icon name="calendar" size={14} className="t-faint" /></div></div>
          </div>
          {/* mini calendar */}
          <div className="wf-card soft wf-pad-sm">
            <div className="r between" style={{ marginBottom: 12 }}>
              <div className="icon-btn" style={{ width: 28, height: 28 }}><Icon name="chevron" size={14} style={{ transform: "rotate(180deg)" }} /></div>
              <span style={{ fontWeight: 700, fontSize: 13 }}>Mai 2026</span>
              <div className="icon-btn" style={{ width: 28, height: 28 }}><Icon name="chevron" size={14} /></div>
            </div>
            <div className="cal">
              {days.map((d, i) => <div key={"h" + i} className="cd hd">{d}</div>)}
              {cells.map((c, i) => {
                let cls = "cd" + (c.dim ? " dim" : "");
                if (!c.dim && c.d === 1) cls += " e1";
                else if (!c.dim && c.d === 18) cls += " e2";
                else if (!c.dim && inRange(c.d)) cls += " rng";
                return <div key={i} className={cls}>{c.d}</div>;
              })}
            </div>
          </div>
          <div className="wf-card soft wf-pad-sm r between"><span className="t-muted" style={{ fontSize: 12.5 }}>Durée sélectionnée</span><span className="t-mono" style={{ fontWeight: 600, fontSize: 13 }}>18 jours</span></div>
        </div>
        <div className="drawer-f">
          <button className="btn block">Réinitialiser</button>
          <button className="btn primary block">Appliquer</button>
        </div>
      </aside>
    </DeskShell>
  );
}
window.AnaPeriodDesk = AnaPeriodDesk;
