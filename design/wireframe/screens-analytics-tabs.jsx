// screens-analytics-tabs.jsx — Analytics: Catégories / Tendances / Budget vs réel
const ANA_TABS = ["Overview", "Catégories", "Tendances", "Budget vs réel"];
function AnaSub({ i }) {
  return <div className="subnav">{ANA_TABS.map((t, k) => <span key={t} className={"si" + (k === i ? " on" : "")}>{t}</span>)}</div>;
}

// ---------- Catégories ----------
function AnaCategoriesDesk() {
  const { Icon, Donut, Progress, money, data: D } = window.WF;
  const counts = { Alimentation: 24, Logement: 1, Transport: 12, Factures: 6, Loisirs: 9, Santé: 3 };
  return (
    <DeskShell active="Analytics" eyebrow="Mai 2026" title="Analytics"
      actions={[{ l: "Période", ic: "calendar" }, { l: "Exporter le rapport", ic: "down", primary: true }]}>
      <AnaSub i={1} />
      <div className="r" style={{ gap: 8 }}>
        <span className="chip on"><Icon name="calendar" size={14} /> Mai 2026</span>
        <span className="chip">Toutes les dépenses <Icon name="chevron" size={13} /></span>
        <span className="chip">Trier : montant <Icon name="chevron" size={13} /></span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.7fr", gap: 14, alignItems: "start" }}>
        <div className="wf-card wf-pad c" style={{ alignItems: "center", gap: 16 }}>
          <div className="card-head" style={{ width: "100%", marginBottom: 0 }}><div className="card-title">Répartition</div></div>
          <Donut size={188} segments={D.catAnalytics} label="612 k" sub="dépenses" />
          <div className="c" style={{ gap: 9, width: "100%" }}>
            {D.catAnalytics.map((s) => (
              <div className="r between" key={s.name} style={{ fontSize: 12.5 }}><span className="r" style={{ gap: 8 }}><i style={{ width: 9, height: 9, borderRadius: 3, background: s.color }} /> {s.name}</span><span className="t-mono t-muted" style={{ fontWeight: 600 }}>{s.v}%</span></div>
            ))}
          </div>
        </div>
        <div className="wf-card wf-pad">
          <div className="card-head"><div className="card-title">Détail par catégorie</div><span className="t-faint" style={{ fontSize: 11.5 }}>Cliquez → transactions filtrées</span></div>
          <div className="c" style={{ gap: 2 }}>
            {D.catAnalytics.map((c) => (
              <div className="row-line" key={c.name} style={{ gap: 14 }}>
                <span className="r" style={{ gap: 9, width: 150 }}><i style={{ width: 10, height: 10, borderRadius: 3, background: c.color, flex: "none" }} /><span style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</span></span>
                <div style={{ flex: 1 }}><Progress pct={c.v * 3.4} /></div>
                <span className="t-mono t-faint" style={{ fontSize: 12, width: 38, textAlign: "right" }}>{c.v}%</span>
                <span className="t-faint" style={{ fontSize: 11.5, width: 64, textAlign: "right" }}>{counts[c.name]} opér.</span>
                <span className={"delta " + (c.trend.startsWith("-") ? "t-pos" : c.trend === "0%" ? "t-faint" : "t-neg")} style={{ width: 52, justifyContent: "flex-end" }}>{c.trend}</span>
                <span className="row-amt" style={{ width: 104, margin: 0 }}>{money(c.amt)}</span>
                <Icon name="chevron" size={15} className="t-faint" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </DeskShell>
  );
}
window.AnaCategoriesDesk = AnaCategoriesDesk;

// ---------- Tendances ----------
function AnaTrendsDesk() {
  const { Icon, Bars, money, data: D } = window.WF;
  const maxEpa = Math.max(...D.trend.map((t) => t.epa));
  return (
    <DeskShell active="Analytics" eyebrow="6 derniers mois" title="Analytics"
      actions={[{ l: "Période", ic: "calendar" }, { l: "Exporter le rapport", ic: "down", primary: true }]}>
      <AnaSub i={2} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        {[
          { l: "Revenu moyen / mois", v: "808 000", d: "+5,2 %", pos: true },
          { l: "Dépense moyenne / mois", v: "624 000", d: "+1,8 %", pos: false },
          { l: "Épargne moyenne / mois", v: "185 000", d: "+12 %", pos: true },
          { l: "Taux d'épargne moyen", v: "23 %", d: "+2 pts", pos: true },
        ].map((k) => (
          <div className="wf-card wf-pad" key={k.l}>
            <div className="kpi-label">{k.l}</div>
            <div className="kpi-val" style={{ fontSize: 20, marginTop: 11 }}>{k.v} <span className="kpi-cur">FCFA</span></div>
            <div className={"delta " + (k.pos ? "t-pos" : "t-neg")} style={{ marginTop: 5 }}><Icon name={k.pos ? "up" : "down"} size={13} /> {k.d}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 14 }}>
        <div className="wf-card wf-pad">
          <div className="card-head"><div className="card-title">Revenus vs dépenses</div>
            <div className="r" style={{ gap: 14, fontSize: 11.5, fontWeight: 600 }}><span className="r" style={{ gap: 6 }}><i style={{ width: 10, height: 10, borderRadius: 3, background: "var(--ink)" }} /> Revenus</span><span className="r" style={{ gap: 6 }}><i style={{ width: 10, height: 10, borderRadius: 3, background: "var(--line)" }} /> Dépenses</span></div>
          </div>
          <Bars data={D.trend} height={180} />
        </div>
        <div className="wf-card wf-pad">
          <div className="card-head"><div className="card-title">Épargne mensuelle</div></div>
          <div className="wf-bars" style={{ height: 180 }}>
            {D.trend.map((t, i) => (
              <div className="wf-bargrp" key={i}>
                <div className="wf-barpair"><span className="wf-bar" style={{ width: 18, height: `${(t.epa / maxEpa) * 100}%`, background: "var(--pos)" }} /></div>
                <span className="wf-barlbl">{t.m}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="wf-card" style={{ overflow: "hidden" }}>
        <div className="wf-pad" style={{ paddingBottom: 14 }}><div className="card-title">Détail mensuel</div></div>
        <table className="tbl">
          <thead><tr><th>Mois</th><th className="num">Revenus</th><th className="num">Dépenses</th><th className="num">Épargne</th><th className="num">Taux</th></tr></thead>
          <tbody>
            {[...D.trend].reverse().map((t, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{t.m} 2026</td>
                <td className="num t-mono t-pos">+{money(t.rev * 1000)}</td>
                <td className="num t-mono">−{money(t.dep * 1000)}</td>
                <td className="num t-mono" style={{ fontWeight: 600 }}>{money(t.epa * 1000)}</td>
                <td className="num t-mono t-muted">{Math.round((t.epa / t.rev) * 100)} %</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DeskShell>
  );
}
window.AnaTrendsDesk = AnaTrendsDesk;

// ---------- Budget vs réel ----------
function AnaBudgetDesk() {
  const { Icon, Progress, money, data: D } = window.WF;
  const cap = D.budgetsFull.reduce((s, b) => s + b.cap, 0);
  const spent = D.budgetsFull.reduce((s, b) => s + b.spent, 0);
  return (
    <DeskShell active="Analytics" eyebrow="Mai 2026" title="Analytics"
      actions={[{ l: "Période", ic: "calendar" }, { l: "Exporter le rapport", ic: "down", primary: true }]}>
      <AnaSub i={3} />
      <div className="wf-card wf-pad">
        <div className="r" style={{ gap: 0, marginBottom: 14 }}>
          <div className="stat"><div className="sl">Prévu (tous budgets)</div><div className="sv">{money(cap)}</div></div>
          <div className="stat" style={{ borderLeft: "1px solid var(--line-soft)", paddingLeft: 20 }}><div className="sl">Réalisé</div><div className="sv">{money(spent)}</div></div>
          <div className="stat" style={{ borderLeft: "1px solid var(--line-soft)", paddingLeft: 20 }}><div className="sl">Écart global</div><div className="sv t-pos">−{money(cap - spent)}</div></div>
          <div className="stat" style={{ borderLeft: "1px solid var(--line-soft)", paddingLeft: 20 }}><div className="sl">Taux de consommation</div><div className="sv">{Math.round((spent / cap) * 100)} %</div></div>
        </div>
        <Progress pct={(spent / cap) * 100} tone="warn" />
      </div>
      <div className="wf-card" style={{ overflow: "hidden" }}>
        <div className="wf-pad" style={{ paddingBottom: 14 }}><div className="card-title">Comparaison par budget</div></div>
        <table className="tbl">
          <thead><tr><th>Catégorie</th><th className="num">Prévu</th><th className="num">Réalisé</th><th className="num">Écart</th><th style={{ width: 200 }}>Consommation</th></tr></thead>
          <tbody>
            {D.budgetsFull.map((b) => {
              const ecart = b.spent - b.cap;
              return (
                <tr key={b.name}>
                  <td style={{ fontWeight: 600 }}>{b.name}</td>
                  <td className="num t-mono t-muted">{money(b.cap)}</td>
                  <td className="num t-mono">{money(b.spent)}</td>
                  <td className={"num t-mono " + (ecart > 0 ? "t-neg" : "t-pos")} style={{ fontWeight: 600 }}>{ecart > 0 ? "+" : "−"}{money(Math.abs(ecart))}</td>
                  <td>
                    <div className="r" style={{ gap: 10 }}>
                      <div style={{ flex: 1 }}><Progress pct={b.pct} tone={b.tone} /></div>
                      <span className={"badge " + b.tone} style={{ minWidth: 44, textAlign: "center" }}>{b.pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </DeskShell>
  );
}
window.AnaBudgetDesk = AnaBudgetDesk;
