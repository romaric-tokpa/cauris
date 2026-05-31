// screens-budgets.jsx — Budgets module
function BudgetDesk() {
  const { Icon, Progress, Gauge, money, data: D } = window.WF;
  const totalCap = D.budgetsFull.reduce((s, b) => s + b.cap, 0);
  const totalSpent = D.budgetsFull.reduce((s, b) => s + b.spent, 0);
  return (
    <DeskShell active="Budgets" eyebrow="Mai 2026" title="Budgets"
      actions={[{ l: "Créer un budget", ic: "plus", primary: true }]}>
      <div className="subnav">
        {["Actifs", "En alerte", "Dépassés", "Archivés"].map((t, i) => <span key={t} className={"si" + (i === 0 ? " on" : "")}>{t}</span>)}
      </div>
      {/* summary */}
      <div className="wf-card wf-pad">
        <div className="r between" style={{ marginBottom: 12 }}>
          <div><div className="t-faint" style={{ fontSize: 12 }}>Dépensé ce mois</div><div className="kpi-val" style={{ fontSize: 22, marginTop: 3 }}>{money(totalSpent)} <span className="kpi-cur">/ {money(totalCap)} FCFA</span></div></div>
          <div className="c" style={{ alignItems: "flex-end" }}><span className="badge warn">2 en alerte</span><span className="t-faint" style={{ fontSize: 11.5, marginTop: 6 }}>Reste {money(totalCap - totalSpent)} FCFA</span></div>
        </div>
        <Progress pct={(totalSpent / totalCap) * 100} tone="warn" />
      </div>
      {/* grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {D.budgetsFull.map((b) => {
          const status = b.tone === "over" ? "Dépassé" : b.tone === "warn" ? "Alerte" : "Sur la voie";
          return (
            <div className="wf-card wf-pad" key={b.name}>
              <div className="r between" style={{ marginBottom: 2 }}>
                <div className="r" style={{ gap: 10 }}><div className="row-ico" style={{ width: 34, height: 34 }}><Icon name="gauge" size={17} /></div><span style={{ fontWeight: 700, fontSize: 14 }}>{b.name}</span></div>
                <span className={"badge " + b.tone}>{status}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "center", margin: "2px 0" }}><Gauge pct={b.pct} tone={b.tone} size={158} /></div>
              <div className="r between" style={{ marginTop: 2 }}>
                <span className="t-mono t-muted" style={{ fontSize: 12 }}>{money(b.spent)} / {money(b.cap)}</span>
                <span className="card-link">{b.txns} opér. <Icon name="chevron" size={13} /></span>
              </div>
            </div>
          );
        })}
      </div>
    </DeskShell>
  );
}
window.BudgetDesk = BudgetDesk;

function BudgetDetailDesk() {
  const { Icon, Progress, money, data: D } = window.WF;
  return (
    <DeskShell active="Budgets" eyebrow="Budget · Mai 2026" title="Transport"
      actions={[{ l: "Ajuster le plafond", ic: "gear" }, { l: "Voir les transactions liées", ic: "exchange", primary: true }]}>
      {/* alert banner */}
      <div className="alert over"><i className="swatch" /><div className="row-ico" style={{ background: "var(--neg-wash)", color: "var(--neg)" }}><Icon name="gauge" size={18} /></div>
        <div><div style={{ fontWeight: 700, fontSize: 13.5 }}>Plafond dépassé de 4 000 FCFA</div><div className="t-muted" style={{ fontSize: 12 }}>Vous êtes à 108 % du budget, il reste 0 jour de marge.</div></div>
      </div>
      <AIBanner tag="Conseil" tone="warn" text="Réduire les courses Yango de 2 par semaine ramènerait ce budget sous son plafond avant la fin du mois." cta="Voir comment" />
      {/* stats card */}
      <div className="wf-card wf-pad">
        <div className="r" style={{ gap: 0, marginBottom: 16 }}>
          <div className="stat"><div className="sl">Prévu</div><div className="sv">{money(50000)}</div></div>
          <div className="stat" style={{ borderLeft: "1px solid var(--line-soft)", paddingLeft: 20 }}><div className="sl">Réalisé</div><div className="sv">{money(54000)}</div></div>
          <div className="stat" style={{ borderLeft: "1px solid var(--line-soft)", paddingLeft: 20 }}><div className="sl">Écart</div><div className="sv t-neg">+{money(4000)}</div></div>
          <div className="stat" style={{ borderLeft: "1px solid var(--line-soft)", paddingLeft: 20 }}><div className="sl">Opérations</div><div className="sv">12</div></div>
        </div>
        <Progress pct={108} tone="over" />
        <div className="r between t-faint" style={{ fontSize: 11.5, marginTop: 7 }}><span>0 FCFA restant</span><span>108 % consommé</span></div>
      </div>
      {/* linked transactions */}
      <div className="wf-card" style={{ overflow: "hidden" }}>
        <div className="wf-pad" style={{ paddingBottom: 14 }}><div className="card-head" style={{ marginBottom: 0 }}><div className="card-title" style={{ whiteSpace: "nowrap" }}>Transactions liées · Transport</div><span className="card-link" style={{ whiteSpace: "nowrap" }}>Tout filtrer dans Transactions <Icon name="chevron" size={13} /></span></div></div>
        <table className="tbl">
          <thead><tr><th>Date</th><th>Libellé</th><th>Compte</th><th className="num">Montant</th><th style={{ width: 40 }} /></tr></thead>
          <tbody>
            {D.budgetTxns.map((t, i) => (
              <tr key={i}>
                <td className="t-faint t-mono" style={{ width: 70 }}>{t.when}</td>
                <td style={{ fontWeight: 600 }}>{t.name}</td>
                <td className="t-muted">{t.acc}</td>
                <td className="num t-mono t-neg" style={{ fontWeight: 600 }}>{money(t.amt)}</td>
                <td className="num"><Icon name="chevron" size={15} className="t-faint" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DeskShell>
  );
}
window.BudgetDetailDesk = BudgetDetailDesk;

function BudgetMob() {
  const { Icon, Progress, money, data: D } = window.WF;
  return (
    <MobShell active="Budgets" tab="budget" title="Budgets" sub="Mai 2026">
      <div className="r" style={{ gap: 7 }}>
        {["Actifs", "En alerte", "Dépassés"].map((t, i) => <span key={t} className={"chip" + (i === 0 ? " on" : "")} style={{ fontSize: 11.5, padding: "5px 11px" }}>{t}</span>)}
      </div>
      <div className="wf-card wf-pad-sm">
        <div className="r between" style={{ marginBottom: 9 }}><span className="t-faint" style={{ fontSize: 12 }}>Dépensé ce mois</span><span className="badge warn">2 en alerte</span></div>
        <div className="kpi-val" style={{ fontSize: 18, marginBottom: 9 }}>478 900 <span className="kpi-cur">/ 565 000</span></div>
        <Progress pct={85} tone="warn" />
      </div>
      <div className="c" style={{ gap: 12 }}>
        {D.budgetsFull.map((b) => (
          <div className="wf-card wf-pad-sm" key={b.name}>
            <div className="r between" style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 13.5 }}>{b.name}</span>
              <span className={"badge " + b.tone}>{b.pct}%</span>
            </div>
            <Progress pct={b.pct} tone={b.tone} />
            <div className="t-mono t-faint" style={{ fontSize: 11, marginTop: 7 }}>{money(b.spent)} / {money(b.cap)} FCFA</div>
          </div>
        ))}
      </div>
    </MobShell>
  );
}
window.BudgetMob = BudgetMob;
