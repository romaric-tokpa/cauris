// screens-analytics.jsx — Analytics module
function AnalyticsDesk() {
  const { Icon, Bars, Donut, Progress, money, data: D } = window.WF;
  return (
    <DeskShell active="Analytics" eyebrow="Mai 2026" title="Analytics"
      actions={[{ l: "Période", ic: "calendar" }, { l: "Exporter le rapport", ic: "down", primary: true }]}>
      <div className="subnav">
        {["Overview", "Catégories", "Tendances", "Budget vs réel"].map((t, i) => <span key={t} className={"si" + (i === 0 ? " on" : "")}>{t}</span>)}
      </div>
      {/* top stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {[
          { l: "Dépenses totales", v: 612000, d: "+4,1 %", pos: false },
          { l: "Revenus totaux", v: 970000, d: "+9,0 %", pos: true },
          { l: "Taux d'épargne", v: null, t: "28 %", d: "+3 pts", pos: true },
        ].map((k) => (
          <div className="wf-card wf-pad" key={k.l}>
            <div className="kpi-label">{k.l}</div>
            <div className="kpi-val" style={{ fontSize: 23, marginTop: 12 }}>{k.t ? k.t : <>{money(k.v)} <span className="kpi-cur">FCFA</span></>}</div>
            <div className={"delta " + (k.pos ? "t-pos" : "t-neg")} style={{ marginTop: 5 }}><Icon name={k.pos ? "up" : "down"} size={13} /> {k.d} vs avril</div>
          </div>
        ))}
      </div>
      {/* charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 14 }}>
        <div className="wf-card wf-pad">
          <div className="card-head"><div><div className="card-title">Revenus vs dépenses</div><div className="t-faint" style={{ fontSize: 11.5, marginTop: 2 }}>Tendance · 6 derniers mois</div></div>
            <div className="r" style={{ gap: 14, fontSize: 11.5, fontWeight: 600 }}><span className="r" style={{ gap: 6 }}><i style={{ width: 10, height: 10, borderRadius: 3, background: "var(--ink)" }} /> Revenus</span><span className="r" style={{ gap: 6 }}><i style={{ width: 10, height: 10, borderRadius: 3, background: "var(--line)" }} /> Dépenses</span></div>
          </div>
          <Bars data={D.cashflow} height={180} />
        </div>
        <div className="wf-card wf-pad">
          <div className="card-head"><div className="card-title">Répartition</div></div>
          <div className="c" style={{ alignItems: "center", gap: 16 }}>
            <Donut size={150} segments={D.catAnalytics.slice(0, 4)} label="612 k" sub="dépenses" />
            <div className="c" style={{ gap: 8, width: "100%" }}>
              {D.catAnalytics.slice(0, 4).map((s) => (
                <div className="r between" key={s.name} style={{ fontSize: 12.5 }}><span className="r" style={{ gap: 8 }}><i style={{ width: 9, height: 9, borderRadius: 3, background: s.color }} /> {s.name}</span><span className="t-mono t-muted" style={{ fontWeight: 600 }}>{s.v}%</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* categories table — drill to transactions */}
      <div className="wf-card wf-pad">
        <div className="card-head"><div className="card-title">Dépenses par catégorie</div><span className="t-faint" style={{ fontSize: 11.5 }}>Cliquez une catégorie → transactions filtrées</span></div>
        <div className="c" style={{ gap: 2 }}>
          {D.catAnalytics.map((c) => (
            <div className="row-line" key={c.name} style={{ gap: 16 }}>
              <span style={{ fontWeight: 600, fontSize: 13, width: 120 }}>{c.name}</span>
              <div style={{ flex: 1 }}><Progress pct={c.v * 3.4} /></div>
              <span className="t-mono t-faint" style={{ fontSize: 12, width: 42, textAlign: "right" }}>{c.v}%</span>
              <span className={"delta " + (c.trend.startsWith("-") ? "t-pos" : c.trend === "0%" ? "t-faint" : "t-neg")} style={{ width: 54, justifyContent: "flex-end" }}>{c.trend}</span>
              <span className="row-amt" style={{ width: 110, margin: 0 }}>{money(c.amt)}</span>
              <Icon name="chevron" size={15} className="t-faint" />
            </div>
          ))}
        </div>
      </div>
    </DeskShell>
  );
}
window.AnalyticsDesk = AnalyticsDesk;

function AnalyticsMob() {
  const { Icon, Donut, Progress, money, data: D } = window.WF;
  return (
    <MobShell active="Analytics" tab="more" title="Analytics" sub="Mai 2026">
      <div className="r" style={{ gap: 7 }}>
        {["Overview", "Catégories", "Tendances"].map((t, i) => <span key={t} className={"chip" + (i === 0 ? " on" : "")} style={{ fontSize: 11.5, padding: "5px 11px" }}>{t}</span>)}
      </div>
      <div className="r" style={{ gap: 12 }}>
        <div className="wf-card wf-pad-sm stat"><div className="sl">Dépenses</div><div className="sv" style={{ fontSize: 16 }}>612 000</div><div className="delta t-neg" style={{ marginTop: 3 }}><Icon name="down" size={12} /> +4,1 %</div></div>
        <div className="wf-card wf-pad-sm stat"><div className="sl">Épargne</div><div className="sv" style={{ fontSize: 16 }}>28 %</div><div className="delta t-pos" style={{ marginTop: 3 }}><Icon name="up" size={12} /> +3 pts</div></div>
      </div>
      <div className="wf-card wf-pad-sm c" style={{ alignItems: "center", gap: 14 }}>
        <div className="card-head" style={{ width: "100%", marginBottom: 0 }}><div className="card-title" style={{ fontSize: 13.5 }}>Répartition</div></div>
        <Donut size={130} segments={D.catAnalytics.slice(0, 4)} label="612 k" sub="dépenses" />
      </div>
      <div className="wf-card wf-pad-sm">
        <div className="card-title" style={{ fontSize: 13.5, marginBottom: 12 }}>Par catégorie</div>
        <div className="c" style={{ gap: 12 }}>
          {D.catAnalytics.slice(0, 5).map((c) => (
            <div key={c.name}>
              <div className="r between" style={{ marginBottom: 6 }}><span style={{ fontWeight: 600, fontSize: 12.5 }}>{c.name}</span><span className="t-mono t-faint" style={{ fontSize: 11 }}>{money(c.amt)}</span></div>
              <Progress pct={c.v * 3.4} />
            </div>
          ))}
        </div>
      </div>
    </MobShell>
  );
}
window.AnalyticsMob = AnalyticsMob;
