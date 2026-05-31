// screens-comptes.jsx — Comptes module
function ComptesDesk() {
  const { Icon, Spark, money, data: D } = window.WF;
  const total = D.comptesFull.reduce((s, c) => s + c.bal, 0);
  return (
    <DeskShell active="Comptes" eyebrow="3 comptes actifs · 1 bloqué" title="Comptes"
      actions={[{ l: "Ajouter un compte", ic: "plus", primary: true }]}>
      <div className="subnav">
        {["Tous", "Trésorerie", "Épargne", "Mobile money", "Bloqués"].map((t, i) => <span key={t} className={"si" + (i === 0 ? " on" : "")}>{t}</span>)}
      </div>
      <div className="wf-card wf-pad r between">
        <div><div className="t-faint" style={{ fontSize: 12 }}>Patrimoine total</div><div className="kpi-val" style={{ fontSize: 26, marginTop: 4 }}>{money(total)} <span className="kpi-cur">FCFA</span></div></div>
        <Spark pts={D.spark} w={220} h={50} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {D.comptesFull.map((c) => (
          <div className="wf-card wf-pad" key={c.name} style={{ borderColor: c.blocked ? "var(--neg)" : undefined }}>
            <div className="r between" style={{ marginBottom: 16 }}>
              <div className="r" style={{ gap: 12, opacity: c.blocked ? 0.6 : 1 }}>
                <div className="row-ico" style={{ width: 42, height: 42, background: c.blocked ? "var(--neg-wash)" : c.type === "Mobile money" ? "var(--accent-wash)" : "var(--panel-2)", color: c.blocked ? "var(--neg)" : c.type === "Mobile money" ? "var(--accent)" : "var(--ink-soft)" }}><Icon name={c.blocked ? "lock" : c.type === "Épargne" ? "target" : "wallet"} size={20} /></div>
                <div><div style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</div><div className="t-faint" style={{ fontSize: 11.5 }}>{c.bank} · {c.num}</div></div>
              </div>
              <div className="r" style={{ gap: 8 }}>
                {c.blocked ? <span className="badge over">Bloqué</span> : <span className="tag-cat">{c.type}</span>}
                <div className="icon-btn" style={{ width: 34, height: 34 }} title={c.blocked ? "Débloquer" : "Bloquer le compte"}><Icon name={c.blocked ? "unlock" : "lock"} size={16} /></div>
              </div>
            </div>
            <div className="r between" style={{ alignItems: "flex-end", opacity: c.blocked ? 0.6 : 1 }}>
              <div><div className="t-faint" style={{ fontSize: 11 }}>Solde</div><div className="kpi-val" style={{ fontSize: 20, marginTop: 2 }}>{c.blocked ? "•••\u202f•••" : money(c.bal)} <span className="kpi-cur">FCFA</span></div></div>
              <span className="card-link">{c.blocked ? <>Débloquer <Icon name="unlock" size={13} /></> : <>Voir les opérations <Icon name="chevron" size={13} /></>}</span>
            </div>
            {c.blocked && <div className="r" style={{ gap: 7, marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line-soft)", color: "var(--neg)", fontSize: 11.5, fontWeight: 600 }}><Icon name="lock" size={13} /> Paiements et retraits suspendus</div>}
          </div>
        ))}
      </div>
    </DeskShell>
  );
}
window.ComptesDesk = ComptesDesk;

function CompteMobDetail() {
  const { Icon, Spark, money, data: D } = window.WF;
  return (
    <MobShell active="Comptes" tab="more" title="Compte courant" sub="NSIA Banque · •• 4821" back>
      <div className="wf-card wf-pad feature-card">
        <div style={{ fontSize: 11.5, opacity: .7, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase" }}>Solde disponible</div>
        <div className="kpi-val" style={{ fontSize: 28, marginTop: 8 }}>{money(1120000)} <span style={{ fontSize: 13, opacity: .6 }}>FCFA</span></div>
        <div style={{ marginTop: 10, opacity: .9 }}><Spark pts={D.spark} w={320} h={40} stroke="#9fe0bf" /></div>
      </div>
      <div className="r" style={{ gap: 10 }}>
        <button className="btn block"><Icon name="exchange" size={16} /> Transfert</button>
        <button className="btn block"><Icon name="plus" size={16} /> Opération</button>
      </div>
      <button className="btn block" style={{ padding: 12, color: "var(--neg)", borderColor: "var(--neg)" }}><Icon name="lock" size={16} /> Bloquer le compte</button>
      <div className="wf-card wf-pad-sm">
        <div className="card-head" style={{ marginBottom: 4 }}><div className="card-title" style={{ fontSize: 13.5 }}>Dernières opérations</div></div>
        {D.compteOps.map((t, i) => (
          <div className="row-line" key={i} style={{ padding: "10px 0" }}>
            <div className="row-ico" style={{ width: 32, height: 32 }}><Icon name={t.amt > 0 ? "up" : "down"} size={15} /></div>
            <div style={{ lineHeight: 1.25, minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 12.5 }}>{t.name}</div><div className="t-faint" style={{ fontSize: 10.5 }}>{t.cat} · {t.when}</div></div>
            <span className={"row-amt " + (t.amt > 0 ? "t-pos" : "")} style={{ fontSize: 12.5 }}>{t.amt > 0 ? "+" : ""}{money(t.amt)}</span>
          </div>
        ))}
      </div>
      <button className="btn primary block" style={{ padding: 13 }}>Voir toutes les opérations</button>
    </MobShell>
  );
}
window.CompteMobDetail = CompteMobDetail;
