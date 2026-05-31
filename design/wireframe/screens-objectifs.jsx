// screens-objectifs.jsx — Objectifs module
function ObjDetailDesk() {
  const { Icon, Donut, Progress, money, data: D } = window.WF;
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <DeskShell active="Objectifs" eyebrow="Objectif · Épargne" title="Fonds d'urgence"
        actions={[{ l: "Modifier", ic: "gear" }, { l: "Ajouter une contribution", ic: "plus", primary: true }]}>
        {/* hero progress */}
        <div className="wf-card wf-pad r" style={{ gap: 28 }}>
          <Donut size={150} segments={[{ v: 60, color: "var(--accent)" }]} label="60 %" sub="atteint" />
          <div style={{ flex: 1 }}>
            <div className="r" style={{ gap: 0 }}>
              <div className="stat"><div className="sl">Épargné</div><div className="sv">{money(1200000)}</div></div>
              <div className="stat" style={{ borderLeft: "1px solid var(--line-soft)", paddingLeft: 20 }}><div className="sl">Objectif</div><div className="sv">{money(2000000)}</div></div>
              <div className="stat" style={{ borderLeft: "1px solid var(--line-soft)", paddingLeft: 20 }}><div className="sl">Reste</div><div className="sv t-warn">{money(800000)}</div></div>
            </div>
            <div style={{ marginTop: 16 }}><Progress pct={60} tone="" /></div>
            <div className="r between" style={{ marginTop: 12 }}>
              <span className="wf-note"><Icon name="calendar" size={14} /> Date cible : déc. 2026</span>
              <span className="t-faint" style={{ fontSize: 12 }}>Rythme suggéré : <b className="t-mono">115 000</b> / mois</span>
            </div>
          </div>
        </div>
        <AIBanner tag="Conseil" tone="ok" text="En passant de 25 000 à 50 000 FCFA/mois, vous atteignez cet objectif avec 2 mois d'avance." cta="Ajuster" />
        {/* 2-col */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
          <div className="wf-card wf-pad">
            <div className="card-head"><div className="card-title">Historique des contributions</div><span className="card-link">Tout voir <Icon name="chevron" size={13} /></span></div>
            <div>
              {D.contributions.map((c, i) => (
                <div className="row-line" key={i}>
                  <div className="row-ico" style={{ background: "var(--pos-wash)", color: "var(--pos)" }}><Icon name="up" size={16} /></div>
                  <div style={{ lineHeight: 1.25 }}><div style={{ fontWeight: 600, fontSize: 13 }}>Contribution</div><div className="t-faint" style={{ fontSize: 11 }}>{c.acc}</div></div>
                  <div className="c" style={{ alignItems: "flex-end", marginLeft: "auto" }}><span className="row-amt t-pos" style={{ margin: 0 }}>+{money(c.amt)}</span><span className="t-faint" style={{ fontSize: 10.5 }}>{c.when}</span></div>
                </div>
              ))}
            </div>
          </div>
          <div className="wf-card wf-pad">
            <div className="card-title" style={{ marginBottom: 14 }}>Projection</div>
            <div className="c" style={{ gap: 14 }}>
              <div className="wf-card soft wf-pad-sm"><div className="t-faint" style={{ fontSize: 11.5 }}>À ce rythme, objectif atteint</div><div className="kpi-val" style={{ fontSize: 18, marginTop: 4 }}>Novembre 2026</div><div className="wf-note" style={{ marginTop: 4 }}><Icon name="up" size={13} /> 1 mois d'avance</div></div>
              <div className="wf-card soft wf-pad-sm"><div className="t-faint" style={{ fontSize: 11.5 }}>Contribution moyenne</div><div className="kpi-val" style={{ fontSize: 18, marginTop: 4 }}>80 000 <span className="kpi-cur">/ mois</span></div></div>
            </div>
          </div>
        </div>
      </DeskShell>

      {/* contribution drawer */}
      <div className="scrim" />
      <aside className="drawer">
        <div className="drawer-h"><div style={{ fontWeight: 800, fontSize: 16 }}>Ajouter une contribution</div><div className="icon-btn" style={{ width: 32, height: 32 }}><Icon name="plus" size={16} style={{ transform: "rotate(45deg)" }} /></div></div>
        <div className="drawer-b">
          <div className="wf-card soft wf-pad-sm r between"><span style={{ fontWeight: 600, fontSize: 13 }}>Fonds d'urgence</span><span className="t-mono t-faint" style={{ fontSize: 12 }}>60 % · reste 800 000</span></div>
          <div><span className="lbl">Montant</span><div className="inp big"><span>100 000</span><span className="kpi-cur">FCFA</span></div></div>
          <div><span className="lbl">Compte source</span><div className="inp"><span>Compte courant</span><Icon name="chevron" size={15} className="t-faint" /></div></div>
          <div><span className="lbl">Date</span><div className="inp"><span>31 mai 2026</span><Icon name="calendar" size={15} className="t-faint" /></div></div>
          <div className="wf-card soft wf-pad-sm r between"><div><div style={{ fontWeight: 600, fontSize: 13 }}>Rendre récurrent</div><div className="t-faint" style={{ fontSize: 11 }}>Chaque mois, le 1er</div></div><div style={{ width: 40, height: 23, borderRadius: 999, background: "var(--accent)", position: "relative" }}><div style={{ position: "absolute", right: 2, top: 2, width: 19, height: 19, borderRadius: 999, background: "#fff" }} /></div></div>
        </div>
        <div className="drawer-f"><button className="btn block">Annuler</button><button className="btn primary block">Contribuer</button></div>
      </aside>
    </div>
  );
}
window.ObjDetailDesk = ObjDetailDesk;

function ObjMob() {
  const { Icon, Donut, Progress, money, data: D } = window.WF;
  return (
    <MobShell active="Objectifs" tab="more" title="Objectifs" sub="3 en cours">
      <div className="r" style={{ gap: 7 }}>
        {["En cours", "Atteints", "En retard"].map((t, i) => <span key={t} className={"chip" + (i === 0 ? " on" : "")} style={{ fontSize: 11.5, padding: "5px 11px" }}>{t}</span>)}
      </div>
      <div className="c" style={{ gap: 12 }}>
        {D.objectifs.map((o) => (
          <div className="wf-card wf-pad-sm r" key={o.name} style={{ gap: 14 }}>
            <Donut size={58} hole={0.56} segments={[{ v: o.pct, color: "var(--accent)" }]} label={o.pct + "%"} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="r between" style={{ marginBottom: 7 }}><span style={{ fontWeight: 700, fontSize: 13.5 }}>{o.name}</span><Icon name="chevron" size={15} className="t-faint" /></div>
              <Progress pct={o.pct} tone="ok" />
              <div className="t-mono t-faint" style={{ fontSize: 11, marginTop: 6 }}>{money(o.at)} / {money(o.goal)} FCFA</div>
            </div>
          </div>
        ))}
      </div>
      <button className="btn block" style={{ padding: 13 }}><Icon name="plus" size={16} /> Nouvel objectif</button>
    </MobShell>
  );
}
window.ObjMob = ObjMob;
