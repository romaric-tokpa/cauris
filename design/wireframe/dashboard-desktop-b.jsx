// dashboard-desktop-b.jsx — Variante B: nav horizontale + "signal d'abord"
const DeskB = () => {
  const { Icon, Donut, Bars, Spark, Progress, money, data: D } = window.WF;

  const top = ["Dashboard", "Transactions", "Budgets", "Objectifs", "Analytics", "Comptes", "Prêt"];

  const actions = [
    { ic: "plus", l: "Ajouter une transaction", accent: true },
    { ic: "target", l: "Nouvelle contribution" },
    { ic: "exchange", l: "Transfert interne" },
    { ic: "gauge", l: "Créer un budget" },
  ];

  return (
    <div className="wf" style={{ background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      {/* ---------------- TOP NAV ---------------- */}
      <header className="r between" style={{ padding: "0 30px", height: 62, background: "var(--paper)", borderBottom: "1px solid var(--line)", flex: "none" }}>
        <div className="r" style={{ gap: 30 }}>
          <div className="logo"><div className="logo-mark">C</div><div className="logo-name">Cauris</div></div>
          <nav className="r" style={{ gap: 22 }}>
            {top.map((t, i) => <span key={t} className={"topnav-link" + (i === 0 ? " on" : "")}>{t}</span>)}
          </nav>
        </div>
        <div className="r" style={{ gap: 12 }}>
          <div className="icon-btn"><Icon name="search" size={18} /></div>
          <div className="icon-btn"><Icon name="bell" size={18} /><span className="dot" /></div>
          <div className="avatar">A</div>
        </div>
      </header>

      <div style={{ padding: "22px 30px", display: "flex", flexDirection: "column", gap: 18, overflow: "hidden" }}>
        {/* ---------------- HERO STRIP ---------------- */}
        <div className="wf-card wf-pad" style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr 1fr 1fr", gap: 0, alignItems: "center" }}>
          <div style={{ paddingRight: 24 }}>
            <div className="t-eyebrow">Solde net consolidé · {D.period}</div>
            <div className="r" style={{ gap: 12, alignItems: "flex-end", marginTop: 8 }}>
              <div className="kpi-val" style={{ fontSize: 34, lineHeight: 1 }}>{money(D.total)}</div>
              <span className="kpi-cur" style={{ fontSize: 16, paddingBottom: 3 }}>FCFA</span>
            </div>
            <div className="r" style={{ gap: 10, marginTop: 10 }}>
              <span className="delta t-pos"><Icon name="up" size={13} /> +3,2 %</span>
              <span className="t-faint" style={{ fontSize: 12 }}>vs avril</span>
              <div style={{ marginLeft: 6 }}><Spark pts={D.spark} w={120} h={36} /></div>
            </div>
          </div>
          {[
            { l: "Revenus", v: D.revenus, ic: "up", tone: "pos" },
            { l: "Dépenses", v: D.depenses, ic: "down", tone: "neg" },
            { l: "Épargne", v: D.epargne, ic: "target", tone: "" },
          ].map((k) => (
            <div key={k.l} style={{ paddingLeft: 22, borderLeft: "1px solid var(--line-soft)" }}>
              <div className="kpi-label" style={{ color: k.tone === "pos" ? "var(--pos)" : k.tone === "neg" ? "var(--neg)" : "var(--ink-soft)" }}>
                <Icon name={k.ic} size={15} /> {k.l}
              </div>
              <div className="kpi-val" style={{ fontSize: 21, marginTop: 9 }}>{money(k.v)}</div>
              <div className="t-faint" style={{ fontSize: 11, marginTop: 3 }}>FCFA · ce mois</div>
            </div>
          ))}
        </div>

        {/* ---------------- MAIN GRID: feed (8) + rail (4) ---------------- */}
        <div style={{ display: "grid", gridTemplateColumns: "1.9fr 1fr", gap: 18, alignItems: "start" }}>
          {/* LEFT — priority feed first */}
          <div className="c" style={{ gap: 16 }}>
            <div className="wf-card wf-pad" style={{ background: "var(--panel)" }}>
              <div className="card-head">
                <div className="r" style={{ gap: 9 }}><Icon name="flag" size={18} /><span className="card-title">À surveiller</span><span className="badge over">3</span></div>
                <span className="card-link">Tout traiter <Icon name="chevron" size={13} /></span>
              </div>
              <div className="c" style={{ gap: 10 }}>
                <div className="alert over">
                  <i className="swatch" />
                  <div className="row-ico" style={{ background: "var(--neg-wash)", color: "var(--neg)" }}><Icon name="gauge" size={18} /></div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>Budget Transport dépassé</div>
                    <div className="t-muted" style={{ fontSize: 12 }}>108 % · +4 000 FCFA au-dessus du plafond</div>
                  </div>
                  <button className="btn" style={{ marginLeft: "auto" }}>Voir les transactions</button>
                </div>
                <div className="alert warn">
                  <i className="swatch" />
                  <div className="row-ico" style={{ background: "var(--warn-wash)", color: "var(--warn)" }}><Icon name="bank" size={18} /></div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>Échéance prêt dans 5 jours</div>
                    <div className="t-muted" style={{ fontSize: 12 }}>145 000 FCFA · prélèvement le 15 juin</div>
                  </div>
                  <button className="btn" style={{ marginLeft: "auto" }}>Préparer</button>
                </div>
                <div className="alert ok">
                  <i className="swatch" />
                  <div className="row-ico" style={{ background: "var(--pos-wash)", color: "var(--pos)" }}><Icon name="target" size={18} /></div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>Objectif Voyage : +50 000 reçus</div>
                    <div className="t-muted" style={{ fontSize: 12 }}>40 % atteint · plus que 480 000 FCFA</div>
                  </div>
                  <button className="btn" style={{ marginLeft: "auto" }}>Voir l'objectif</button>
                </div>
              </div>
            </div>

            {/* cashflow */}
            <div className="wf-card wf-pad">
              <div className="card-head">
                <div><div className="card-title">Flux de trésorerie</div><div className="t-faint" style={{ fontSize: 11.5, marginTop: 2 }}>Revenus vs dépenses — 6 mois</div></div>
                <div className="seg"><button>6M</button><button className="on">1A</button><button>Tout</button></div>
              </div>
              <Bars data={D.cashflow} height={160} />
            </div>

            {/* repartition wide */}
            <div className="wf-card wf-pad">
              <div className="card-head"><div className="card-title">Répartition des dépenses</div><span className="card-link">Ouvrir Analytics <Icon name="chevron" size={13} /></span></div>
              <div className="r" style={{ gap: 26 }}>
                <Donut size={120} segments={D.repartition} label="612 k" sub="ce mois" />
                <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 24px" }}>
                  {D.repartition.map((s) => (
                    <div key={s.name}>
                      <div className="r between" style={{ fontSize: 12.5, marginBottom: 5 }}>
                        <span className="r" style={{ gap: 8 }}><i style={{ width: 9, height: 9, borderRadius: 3, background: s.color }} /> {s.name}</span>
                        <span className="t-mono t-muted" style={{ fontWeight: 600 }}>{s.v}%</span>
                      </div>
                      <Progress pct={s.v * 2.6} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT RAIL */}
          <div className="c" style={{ gap: 16 }}>
            <div className="wf-card wf-pad">
              <div className="card-title" style={{ marginBottom: 12 }}>Actions rapides</div>
              <div className="c" style={{ gap: 9 }}>
                {actions.map((a) => (
                  <button key={a.l} className={"btn block " + (a.accent ? "accent" : "")} style={{ justifyContent: "flex-start" }}>
                    <Icon name={a.ic} size={16} /> {a.l}
                  </button>
                ))}
              </div>
            </div>

            <div className="wf-card wf-pad">
              <div className="card-head"><div className="card-title">Objectifs</div><span className="card-link">Tout voir <Icon name="chevron" size={13} /></span></div>
              <div className="c" style={{ gap: 13 }}>
                {D.objectifs.map((o) => (
                  <div key={o.name}>
                    <div className="r between" style={{ marginBottom: 7 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{o.name}</span>
                      <span className="t-mono t-muted" style={{ fontSize: 11.5, fontWeight: 600 }}>{o.pct}%</span>
                    </div>
                    <Progress pct={o.pct} tone="ok" />
                    <div className="t-faint t-mono" style={{ fontSize: 10.5, marginTop: 5 }}>{money(o.at)} / {money(o.goal)} FCFA</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="wf-card wf-pad">
              <div className="card-head"><div className="card-title">Comptes</div><span className="t-mono t-faint" style={{ fontSize: 11 }}>4 actifs</span></div>
              <div>
                {D.comptes.map((c) => (
                  <div className="row-line" key={c.name} style={{ padding: "9px 0" }}>
                    <div className="row-ico" style={{ width: 32, height: 32 }}><Icon name="wallet" size={15} /></div>
                    <div style={{ lineHeight: 1.25 }}>
                      <div style={{ fontWeight: 600, fontSize: 12.5 }}>{c.name}</div>
                      <div className="t-faint" style={{ fontSize: 10.5 }}>{c.bank}</div>
                    </div>
                    <span className="row-amt" style={{ fontSize: 12.5 }}>{money(c.bal)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
window.DeskB = DeskB;
