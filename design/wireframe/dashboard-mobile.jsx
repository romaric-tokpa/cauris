// dashboard-mobile.jsx — MobileA (barre basse) + MobileB (feed priorité, pill nav)
const StatusBar = () => (
  <div className="phone-bar">
    <span>9:41</span>
    <span className="dots"><span style={{ fontWeight: 700 }}>●●●●●</span><svg width="22" height="11" viewBox="0 0 26 13" fill="none" style={{ marginLeft: 5 }}><rect x="1" y="1.5" width="20" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.3"/><rect x="3" y="3.5" width="13" height="6" rx="1" fill="currentColor"/><rect x="22.5" y="4.5" width="2.2" height="4" rx="1" fill="currentColor"/></svg></span>
  </div>
);

// ============================ VARIANTE A ============================
const MobileA = () => {
  const { Icon, Bars, Progress, money, data: D } = window.WF;
  return (
    <div className="wf" style={{ background: "var(--bg)" }}>
      <StatusBar />
      {/* app bar */}
      <div className="r between" style={{ padding: "8px 18px 14px" }}>
        <div>
          <div className="t-faint" style={{ fontSize: 11.5, fontWeight: 600 }}>{D.period}</div>
          <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-.02em" }}>Bonjour, {D.user}</div>
        </div>
        <div className="r" style={{ gap: 10 }}>
          <div className="icon-btn" style={{ width: 36, height: 36 }}><Icon name="bell" size={17} /><span className="dot" /></div>
          <div className="avatar">A</div>
        </div>
      </div>

      <div className="scrollcol" style={{ padding: "0 18px 84px" }}>
        {/* solde hero */}
        <div className="wf-card wf-pad feature-card">
          <div style={{ fontSize: 11.5, opacity: .7, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase" }}>Solde total</div>
          <div className="kpi-val" style={{ fontSize: 30, marginTop: 8 }}>{money(D.total)} <span style={{ fontSize: 14, opacity: .6 }}>FCFA</span></div>
          <div className="r" style={{ gap: 8, marginTop: 8, fontSize: 12 }}>
            <span className="r" style={{ gap: 3, color: "#9fe0bf", fontWeight: 700 }}><Icon name="up" size={13} /> +3,2 %</span>
            <span style={{ opacity: .6 }}>vs avril</span>
          </div>
        </div>

        {/* mini kpis */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[{ l: "Revenus", v: D.revenus, ic: "up", c: "var(--pos)", w: "var(--pos-wash)" }, { l: "Dépenses", v: D.depenses, ic: "down", c: "var(--neg)", w: "var(--neg-wash)" }].map((k) => (
            <div className="wf-card wf-pad-sm" key={k.l}>
              <div className="kpi-icon" style={{ background: k.w, color: k.c, width: 30, height: 30 }}><Icon name={k.ic} size={16} /></div>
              <div className="t-faint" style={{ fontSize: 11.5, marginTop: 9, fontWeight: 600 }}>{k.l}</div>
              <div className="kpi-val" style={{ fontSize: 16, marginTop: 2 }}>{money(k.v)}</div>
            </div>
          ))}
        </div>

        {/* cashflow */}
        <div className="wf-card wf-pad-sm">
          <div className="card-head" style={{ marginBottom: 10 }}><div className="card-title" style={{ fontSize: 13.5 }}>Trésorerie</div><span className="chip on" style={{ padding: "4px 10px", fontSize: 11 }}>Mois</span></div>
          <Bars data={D.cashflow} height={96} />
        </div>

        {/* budgets en alerte */}
        <div className="wf-card wf-pad-sm">
          <div className="card-head" style={{ marginBottom: 10 }}><div className="card-title" style={{ fontSize: 13.5 }}>Budgets en alerte</div><span className="card-link" style={{ fontSize: 11.5 }}>Voir</span></div>
          <div className="c" style={{ gap: 11 }}>
            {D.budgets.slice(0, 2).map((b) => (
              <div key={b.name}>
                <div className="r between" style={{ marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 12.5 }}>{b.name}</span>
                  <span className={"badge " + b.tone}>{b.pct}%</span>
                </div>
                <Progress pct={b.pct} tone={b.tone} />
              </div>
            ))}
          </div>
        </div>

        {/* objectifs */}
        <div className="wf-card wf-pad-sm">
          <div className="card-head" style={{ marginBottom: 10 }}><div className="card-title" style={{ fontSize: 13.5 }}>Objectifs</div><span className="card-link" style={{ fontSize: 11.5 }}>Voir</span></div>
          <div className="c" style={{ gap: 11 }}>
            {D.objectifs.slice(0, 2).map((o) => (
              <div key={o.name}>
                <div className="r between" style={{ marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 12.5 }}>{o.name}</span>
                  <span className="t-mono t-faint" style={{ fontSize: 11 }}>{o.pct}%</span>
                </div>
                <Progress pct={o.pct} tone="ok" />
              </div>
            ))}
          </div>
        </div>

        {/* transactions */}
        <div className="wf-card wf-pad-sm">
          <div className="card-head" style={{ marginBottom: 4 }}><div className="card-title" style={{ fontSize: 13.5 }}>Récentes</div><span className="card-link" style={{ fontSize: 11.5 }}>Tout</span></div>
          {D.txns.slice(0, 3).map((t) => (
            <div className="row-line" key={t.name} style={{ padding: "9px 0" }}>
              <div className="row-ico" style={{ width: 32, height: 32 }}><Icon name={t.amt > 0 ? "up" : "down"} size={15} /></div>
              <div style={{ lineHeight: 1.25, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 12.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</div>
                <div className="t-faint" style={{ fontSize: 10.5 }}>{t.cat}</div>
              </div>
              <span className={"row-amt " + (t.amt > 0 ? "t-pos" : "")} style={{ fontSize: 12.5 }}>{t.amt > 0 ? "+" : ""}{money(t.amt)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* tab bar */}
      <div className="tabbar">
        <div className="tab on"><Icon name="home" size={20} /> Accueil</div>
        <div className="tab"><Icon name="exchange" size={20} /> Transac.</div>
        <div className="fab"><Icon name="plus" size={22} /></div>
        <div className="tab"><Icon name="gauge" size={20} /> Budgets</div>
        <div className="tab"><Icon name="more" size={20} /> Plus</div>
      </div>
    </div>
  );
};
window.MobileA = MobileA;

// ============================ VARIANTE B ============================
const MobileB = () => {
  const { Icon, Spark, Progress, money, data: D } = window.WF;
  const alertMeta = {
    over: { ic: "gauge", c: "var(--neg)", w: "var(--neg-wash)" },
    warn: { ic: "bank", c: "var(--warn)", w: "var(--warn-wash)" },
    ok: { ic: "target", c: "var(--pos)", w: "var(--pos-wash)" },
  };
  return (
    <div className="wf" style={{ background: "var(--bg)" }}>
      <StatusBar />
      {/* app bar */}
      <div className="r between" style={{ padding: "8px 18px 12px" }}>
        <div className="r" style={{ gap: 11 }}>
          <div className="avatar">A</div>
          <div style={{ lineHeight: 1.2 }}>
            <div className="t-faint" style={{ fontSize: 11 }}>Bonjour</div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>{D.user} K.</div>
          </div>
        </div>
        <div className="icon-btn" style={{ width: 36, height: 36 }}><Icon name="bell" size={17} /><span className="dot" /></div>
      </div>

      <div className="scrollcol" style={{ padding: "0 18px 92px" }}>
        {/* À SURVEILLER first (signal-first) */}
        <div>
          <div className="r between" style={{ margin: "2px 2px 9px" }}>
            <div className="r" style={{ gap: 8 }}><Icon name="flag" size={16} /><span className="card-title" style={{ fontSize: 14 }}>À surveiller</span><span className="badge over">3</span></div>
          </div>
          <div className="c" style={{ gap: 9 }}>
            {D.notifs.map((n) => {
              const m = alertMeta[n.tone];
              return (
                <div className={"alert " + n.tone} key={n.t} style={{ padding: "11px 12px" }}>
                  <i className="swatch" />
                  <div className="row-ico" style={{ width: 32, height: 32, background: m.w, color: m.c }}><Icon name={m.ic} size={16} /></div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 12.5 }}>{n.t}</div>
                    <div className="t-muted" style={{ fontSize: 11 }}>{n.s}</div>
                  </div>
                  <Icon name="chevron" size={16} className="t-faint" style={{ marginLeft: "auto" }} />
                </div>
              );
            })}
          </div>
        </div>

        {/* solde net */}
        <div className="wf-card wf-pad">
          <div className="r between">
            <div className="t-eyebrow">Solde net</div>
            <span className="delta t-pos"><Icon name="up" size={12} /> +3,2 %</span>
          </div>
          <div className="kpi-val" style={{ fontSize: 27, marginTop: 7 }}>{money(D.total)} <span className="kpi-cur" style={{ fontSize: 13 }}>FCFA</span></div>
          <div style={{ marginTop: 8 }}><Spark pts={D.spark} w={320} h={42} /></div>
          <div className="r between" style={{ marginTop: 6 }}>
            <span className="t-faint" style={{ fontSize: 11 }}>Revenus <b className="t-mono" style={{ color: "var(--pos)" }}>+{money(D.revenus)}</b></span>
            <span className="t-faint" style={{ fontSize: 11 }}>Dépenses <b className="t-mono" style={{ color: "var(--neg)" }}>-{money(D.depenses)}</b></span>
          </div>
        </div>

        {/* objectifs row */}
        <div className="wf-card wf-pad-sm">
          <div className="card-head" style={{ marginBottom: 10 }}><div className="card-title" style={{ fontSize: 13.5 }}>Objectifs</div><span className="card-link" style={{ fontSize: 11.5 }}>+ Contribuer</span></div>
          <div className="c" style={{ gap: 11 }}>
            {D.objectifs.map((o) => (
              <div key={o.name}>
                <div className="r between" style={{ marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 12.5 }}>{o.name}</span>
                  <span className="t-mono t-faint" style={{ fontSize: 11 }}>{money(o.at)} / {money(o.goal)}</span>
                </div>
                <Progress pct={o.pct} tone="ok" />
              </div>
            ))}
          </div>
        </div>

        {/* transactions */}
        <div className="wf-card wf-pad-sm">
          <div className="card-head" style={{ marginBottom: 4 }}><div className="card-title" style={{ fontSize: 13.5 }}>Transactions récentes</div><span className="card-link" style={{ fontSize: 11.5 }}>Tout</span></div>
          {D.txns.slice(0, 3).map((t) => (
            <div className="row-line" key={t.name} style={{ padding: "9px 0" }}>
              <div className="row-ico" style={{ width: 32, height: 32 }}><Icon name={t.amt > 0 ? "up" : "down"} size={15} /></div>
              <div style={{ lineHeight: 1.25, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 12.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</div>
                <div className="t-faint" style={{ fontSize: 10.5 }}>{t.cat} · {t.acc}</div>
              </div>
              <span className={"row-amt " + (t.amt > 0 ? "t-pos" : "")} style={{ fontSize: 12.5 }}>{t.amt > 0 ? "+" : ""}{money(t.amt)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* floating pill nav */}
      <div className="pillnav">
        <div className="pt on"><Icon name="home" size={20} /></div>
        <div className="pt"><Icon name="analytics" size={20} /></div>
        <div className="pc"><Icon name="plus" size={22} /></div>
        <div className="pt"><Icon name="gauge" size={20} /></div>
        <div className="pt"><Icon name="more" size={20} /></div>
      </div>
    </div>
  );
};
window.MobileB = MobileB;
