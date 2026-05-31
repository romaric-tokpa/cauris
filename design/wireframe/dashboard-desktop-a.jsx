// dashboard-desktop-a.jsx — Variante A: cockpit classique, sidebar gauche
const DeskA = () => {
  const { Icon, Donut, Bars, Spark, Progress, money, data: D } = window.WF;

  const nav = [
    { ic: "grid", l: "Dashboard", on: true },
    { ic: "exchange", l: "Transactions" },
    { ic: "gauge", l: "Budgets" },
    { ic: "target", l: "Objectifs" },
    { ic: "analytics", l: "Analytics" },
    { ic: "message", l: "Assistant" },
    { ic: "wallet", l: "Comptes" },
    { ic: "bank", l: "Prêt / Dette" },
  ];

  const kpis = [
    { l: "Solde total", v: D.total, ic: "wallet", tone: "", delta: "+3,2 %", dpos: true },
    { l: "Revenus — mai", v: D.revenus, ic: "up", tone: "pos" },
    { l: "Dépenses — mai", v: D.depenses, ic: "down", tone: "neg" },
    { l: "Épargne du mois", v: D.epargne, ic: "target", tone: "" },
  ];

  return (
    <div className="wf" style={{ display: "grid", gridTemplateColumns: "240px 1fr", background: "var(--bg)" }}>
      {/* ---------------- SIDEBAR ---------------- */}
      <aside style={{ background: "var(--paper)", borderRight: "1px solid var(--line)", padding: "22px 16px", display: "flex", flexDirection: "column" }}>
        <div className="logo" style={{ padding: "0 6px 4px" }}>
          <div className="logo-mark">C</div>
          <div className="logo-name">Cauris</div>
        </div>
        <div className="nav-group">Pilotage</div>
        {nav.map((n) => (
          <div className={"nav-item" + (n.on ? " on" : "")} key={n.l}>
            <Icon name={n.ic} size={19} /> {n.l}
          </div>
        ))}
        <div className="nav-group">Compte</div>
        {[{ ic: "bell", l: "Notifications" }, { ic: "gear", l: "Paramètres" }].map((n) => (
          <div className="nav-item" key={n.l}><Icon name={n.ic} size={19} /> {n.l}</div>
        ))}
        <div style={{ marginTop: "auto" }} className="wf-card soft wf-pad-sm r" >
          <div className="avatar sm">A</div>
          <div style={{ marginLeft: 10, lineHeight: 1.25 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>Aïcha K.</div>
            <div className="t-faint" style={{ fontSize: 11 }}>Compte personnel</div>
          </div>
        </div>
      </aside>

      {/* ---------------- MAIN ---------------- */}
      <main style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* header */}
        <header className="r between" style={{ padding: "16px 28px", background: "var(--paper)", borderBottom: "1px solid var(--line)" }}>
          <div className="field" style={{ width: 320 }}>
            <Icon name="search" size={17} /><input placeholder="Rechercher une transaction, un compte…" readOnly />
          </div>
          <div className="r" style={{ gap: 12 }}>
            <div className="seg">
              <button>Jour</button><button>Semaine</button><button className="on">Mois</button><button>Année</button>
            </div>
            <div className="icon-btn"><Icon name="bell" size={19} /><span className="dot" /></div>
            <div className="avatar">A</div>
          </div>
        </header>

        <div style={{ padding: "24px 28px", overflow: "hidden", display: "flex", flexDirection: "column", gap: 18 }}>
          {/* title row */}
          <div className="r between">
            <div>
              <div className="t-eyebrow">{D.period}</div>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-.02em", marginTop: 3 }}>Bonjour, {D.user}</div>
            </div>
            <div className="r" style={{ gap: 10 }}>
              <button className="btn"><Icon name="filter" size={16} /> Filtres</button>
              <button className="btn primary"><Icon name="plus" size={16} /> Ajouter une transaction</button>
            </div>
          </div>

          {/* KPI row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
            {kpis.map((k) => (
              <div className="wf-card wf-pad" key={k.l}>
                <div className="r between">
                  <div className="kpi-label">{k.l}</div>
                  <div className="kpi-icon" style={{ background: k.tone === "pos" ? "var(--pos-wash)" : k.tone === "neg" ? "var(--neg-wash)" : "var(--panel-2)", color: k.tone === "pos" ? "var(--pos)" : k.tone === "neg" ? "var(--neg)" : "var(--ink-soft)" }}>
                    <Icon name={k.ic} size={18} />
                  </div>
                </div>
                <div className="kpi-val" style={{ fontSize: 23, marginTop: 14 }}>
                  {money(k.v)} <span className="kpi-cur">FCFA</span>
                </div>
                {k.delta && <div className={"delta " + (k.dpos ? "t-pos" : "t-neg")} style={{ marginTop: 4 }}><Icon name="up" size={13} /> {k.delta} vs avril</div>}
                {!k.delta && <div className="t-faint" style={{ fontSize: 11.5, marginTop: 4 }}>Mis à jour aujourd'hui</div>}
              </div>
            ))}
          </div>

          {/* Insights IA */}
          <div className="wf-card wf-pad">
            <div className="card-head"><div className="r" style={{ gap: 9 }}><div className="ai-av" style={{ width: 26, height: 26, fontSize: 11, borderRadius: 8 }}>C</div><div className="card-title">Insights</div></div><span className="card-link">Ouvrir l'assistant <Icon name="chevron" size={13} /></span></div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
              {D.insights.slice(0, 3).map((n, i) => {
                const c = n.tone === "over" ? "var(--neg)" : n.tone === "warn" ? "var(--warn)" : n.tone === "ok" ? "var(--pos)" : "var(--accent)";
                const w = n.tone === "over" ? "var(--neg-wash)" : n.tone === "warn" ? "var(--warn-wash)" : n.tone === "ok" ? "var(--pos-wash)" : "var(--accent-wash)";
                return (
                  <div key={i} className="r" style={{ gap: 11, alignItems: "flex-start" }}>
                    <div className="row-ico" style={{ width: 32, height: 32, background: w, color: c, flex: "none" }}><Icon name={n.ic} size={16} /></div>
                    <div>
                      <span className="insight-tag" style={{ color: c, background: w }}>{n.tag}</span>
                      <div style={{ fontSize: 12.5, lineHeight: 1.45, marginTop: 6 }}>{n.text}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* cashflow + repartition */}
          <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 14 }}>
            <div className="wf-card wf-pad">
              <div className="card-head">
                <div>
                  <div className="card-title">Flux de trésorerie</div>
                  <div className="t-faint" style={{ fontSize: 11.5, marginTop: 2 }}>Revenus vs dépenses — 6 mois</div>
                </div>
                <div className="r" style={{ gap: 14, fontSize: 11.5, fontWeight: 600 }}>
                  <span className="r" style={{ gap: 6 }}><i style={{ width: 10, height: 10, borderRadius: 3, background: "var(--ink)" }} /> Revenus</span>
                  <span className="r" style={{ gap: 6 }}><i style={{ width: 10, height: 10, borderRadius: 3, background: "var(--line)" }} /> Dépenses</span>
                </div>
              </div>
              <Bars data={D.cashflow} height={170} />
            </div>
            <div className="wf-card wf-pad">
              <div className="card-head"><div className="card-title">Répartition des dépenses</div></div>
              <div className="r" style={{ gap: 18 }}>
                <Donut size={132} segments={D.repartition} label="612 k" sub="ce mois" />
                <div className="c" style={{ gap: 9, flex: 1 }}>
                  {D.repartition.map((s) => (
                    <div className="r between" key={s.name} style={{ fontSize: 12.5 }}>
                      <span className="r" style={{ gap: 8 }}><i style={{ width: 9, height: 9, borderRadius: 3, background: s.color }} /> {s.name}</span>
                      <span className="t-mono t-muted" style={{ fontWeight: 600 }}>{s.v}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 3-col: budgets / objectifs / transactions */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr", gap: 14 }}>
            {/* budgets en alerte */}
            <div className="wf-card wf-pad">
              <div className="card-head"><div className="card-title">Budgets en alerte</div><span className="card-link">Tout voir <Icon name="chevron" size={13} /></span></div>
              <div className="c" style={{ gap: 12 }}>
                {D.budgets.map((b) => (
                  <div key={b.name}>
                    <div className="r between" style={{ marginBottom: 7 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{b.name}</span>
                      <span className={"badge " + b.tone}>{b.pct}%</span>
                    </div>
                    <Progress pct={b.pct} tone={b.tone} />
                    <div className="t-faint t-mono" style={{ fontSize: 11, marginTop: 6 }}>{money(b.spent)} / {money(b.cap)} FCFA</div>
                  </div>
                ))}
              </div>
            </div>

            {/* objectifs */}
            <div className="wf-card wf-pad">
              <div className="card-head"><div className="card-title">Objectifs en cours</div><span className="card-link">Tout voir <Icon name="chevron" size={13} /></span></div>
              <div className="c" style={{ gap: 12 }}>
                {D.objectifs.map((o) => (
                  <div key={o.name}>
                    <div className="r between" style={{ marginBottom: 7 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{o.name}</span>
                      <span className="t-mono t-muted" style={{ fontSize: 11.5, fontWeight: 600 }}>{o.pct}%</span>
                    </div>
                    <Progress pct={o.pct} tone="ok" />
                    <div className="t-faint t-mono" style={{ fontSize: 11, marginTop: 6 }}>{money(o.at)} / {money(o.goal)} FCFA</div>
                  </div>
                ))}
              </div>
            </div>

            {/* transactions */}
            <div className="wf-card wf-pad">
              <div className="card-head"><div className="card-title">Transactions récentes</div><span className="card-link">Tout voir <Icon name="chevron" size={13} /></span></div>
              <div>
                {D.txns.slice(0, 5).map((t) => (
                  <div className="row-line" key={t.name}>
                    <div className="row-ico"><Icon name={t.amt > 0 ? "up" : "down"} size={17} /></div>
                    <div style={{ lineHeight: 1.3, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</div>
                      <div className="t-faint" style={{ fontSize: 11 }}>{t.cat} · {t.acc}</div>
                    </div>
                    <div className="c" style={{ alignItems: "flex-end", marginLeft: "auto" }}>
                      <span className={"row-amt " + (t.amt > 0 ? "t-pos" : "")} style={{ margin: 0 }}>{t.amt > 0 ? "+" : ""}{money(t.amt)}</span>
                      <span className="t-faint" style={{ fontSize: 10.5 }}>{t.when}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* bottom: comptes + prêt */}
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 14 }}>
            <div className="wf-card wf-pad">
              <div className="card-head"><div className="card-title">Mes comptes</div><span className="card-link">Gérer <Icon name="chevron" size={13} /></span></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {D.comptes.map((c) => (
                  <div className="r between wf-card soft wf-pad-sm" key={c.name}>
                    <div className="r" style={{ gap: 10 }}>
                      <div className="row-ico" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}><Icon name="wallet" size={16} /></div>
                      <div style={{ lineHeight: 1.25 }}>
                        <div style={{ fontWeight: 600, fontSize: 12.5 }}>{c.name}</div>
                        <div className="t-faint" style={{ fontSize: 10.5 }}>{c.bank}</div>
                      </div>
                    </div>
                    <div className="t-mono" style={{ fontWeight: 600, fontSize: 12.5 }}>{money(c.bal)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="wf-card wf-pad">
              <div className="card-head"><div className="card-title">Prêt auto</div><span className="badge warn">Échéance {D.pret.echeance}</span></div>
              <div className="r between" style={{ alignItems: "flex-end", marginBottom: 12 }}>
                <div>
                  <div className="t-faint" style={{ fontSize: 11.5 }}>Capital restant</div>
                  <div className="kpi-val" style={{ fontSize: 21, marginTop: 3 }}>{money(D.pret.reste)} <span className="kpi-cur">FCFA</span></div>
                </div>
                <div className="c" style={{ alignItems: "flex-end" }}>
                  <div className="t-faint" style={{ fontSize: 11.5 }}>Mensualité</div>
                  <div className="t-mono" style={{ fontWeight: 600, fontSize: 14 }}>{money(D.pret.mensualite)}</div>
                </div>
              </div>
              <Progress pct={D.pret.progress} tone="" />
              <div className="r between t-faint" style={{ fontSize: 11, marginTop: 7 }}>
                <span>{D.pret.progress}% remboursé</span><span className="card-link">Simuler <Icon name="chevron" size={12} /></span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
window.DeskA = DeskA;
