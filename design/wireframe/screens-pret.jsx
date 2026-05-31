// screens-pret.jsx — Prêt / Dette module
function PretDesk() {
  const { Icon, Progress, money, data: D } = window.WF;
  const P = D.pret;
  return (
    <DeskShell active="Prêt / Dette" eyebrow="Prêt bancaire · NSIA Banque" title="Prêt auto"
      actions={[{ l: "Historique paiements", ic: "exchange" }, { l: "Simuler un remboursement", ic: "gauge", primary: true }]}>
      <div className="subnav">
        {["Vue générale", "Amortissement", "Paiements", "Simulation"].map((t, i) => <span key={t} className={"si" + (i === 0 ? " on" : "")}>{t}</span>)}
      </div>
      {/* hero */}
      <div className="wf-card wf-pad">
        <div className="r between" style={{ alignItems: "flex-end", marginBottom: 14 }}>
          <div><div className="t-faint" style={{ fontSize: 12 }}>Capital restant dû</div><div className="kpi-val" style={{ fontSize: 28, marginTop: 4 }}>{money(P.reste)} <span className="kpi-cur">FCFA</span></div></div>
          <span className="badge warn">Prochaine échéance {P.echeance}</span>
        </div>
        <Progress pct={P.progress} tone="" />
        <div className="r between t-faint" style={{ fontSize: 11.5, marginTop: 8 }}><span>{P.progress} % remboursé · {money(P.capital - P.reste)} FCFA</span><span>{P.restant} / {P.total} échéances restantes</span></div>
      </div>
      {/* stats */}
      <div className="wf-card wf-pad r" style={{ gap: 0 }}>
        <div className="stat"><div className="sl">Capital emprunté</div><div className="sv">{money(P.capital)}</div></div>
        <div className="stat" style={{ borderLeft: "1px solid var(--line-soft)", paddingLeft: 20 }}><div className="sl">Taux annuel</div><div className="sv">{P.taux} %</div></div>
        <div className="stat" style={{ borderLeft: "1px solid var(--line-soft)", paddingLeft: 20 }}><div className="sl">Mensualité</div><div className="sv">{money(P.mensualite)}</div></div>
        <div className="stat" style={{ borderLeft: "1px solid var(--line-soft)", paddingLeft: 20 }}><div className="sl">Fin prévue</div><div className="sv">Mai 2028</div></div>
      </div>
      <AIBanner tag="Conseil" tone="ok" text="Un remboursement anticipé de 500 000 FCFA vous ferait économiser 180 000 FCFA d'intérêts et 6 mois." cta="Simuler" />
      {/* amortissement table */}
      <div className="wf-card" style={{ overflow: "hidden" }}>
        <div className="wf-pad" style={{ paddingBottom: 14 }}><div className="card-head" style={{ marginBottom: 0 }}><div className="card-title" style={{ whiteSpace: "nowrap" }}>Tableau d'amortissement</div><span className="card-link" style={{ whiteSpace: "nowrap" }}>Télécharger (PDF) <Icon name="down" size={13} /></span></div></div>
        <table className="tbl">
          <thead><tr><th>Échéance</th><th className="num">Capital</th><th className="num">Intérêts</th><th className="num">Mensualité</th><th className="num">Capital restant</th></tr></thead>
          <tbody>
            {D.amortissement.map((a, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{a.n}</td>
                <td className="num t-mono">{money(a.cap)}</td>
                <td className="num t-mono t-muted">{money(a.int)}</td>
                <td className="num t-mono">{money(a.cap + a.int)}</td>
                <td className="num t-mono" style={{ fontWeight: 600 }}>{money(a.reste)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DeskShell>
  );
}
window.PretDesk = PretDesk;

function PretSimDesk() {
  const { Icon, Progress, money, data: D } = window.WF;
  return (
    <DeskShell active="Prêt / Dette" eyebrow="Prêt auto · Simulation" title="Simuler un remboursement"
      actions={[{ l: "Réinitialiser" }, { l: "Appliquer le scénario", ic: "up", primary: true }]}>
      <div className="subnav">
        {["Vue générale", "Amortissement", "Paiements", "Simulation"].map((t, i) => <span key={t} className={"si" + (i === 3 ? " on" : "")}>{t}</span>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 14, alignItems: "start" }}>
        {/* controls */}
        <div className="wf-card wf-pad c" style={{ gap: 16 }}>
          <div className="card-title">Paramètres du scénario</div>
          <div><span className="lbl">Type de simulation</span><div className="seg-full"><button className="on">Remboursement anticipé</button><button>Mensualité ajustée</button></div></div>
          <div><span className="lbl">Montant remboursé par anticipation</span><div className="inp big"><span>500 000</span><span className="kpi-cur">FCFA</span></div></div>
          <div><span className="lbl">À partir de</span><div className="inp"><span>Juillet 2026</span><Icon name="calendar" size={15} className="t-faint" /></div></div>
          <div><span className="lbl">Conserver</span><div className="seg-full"><button className="on">La durée</button><button>La mensualité</button></div></div>
          <div className="wf-card soft wf-pad-sm r between"><span className="wf-note"><Icon name="bolt" size={14} /> Mensualité recalculée</span><span className="t-mono" style={{ fontWeight: 600, fontSize: 14 }}>122 500 FCFA</span></div>
        </div>
        {/* impact */}
        <div className="c" style={{ gap: 14 }}>
          <div className="wf-card wf-pad">
            <div className="card-title" style={{ marginBottom: 16 }}>Impact du scénario</div>
            <div className="c" style={{ gap: 14 }}>
              {[
                { l: "Durée restante", a: "22 mois", b: "16 mois", good: true },
                { l: "Intérêts restants à payer", a: "318 000 FCFA", b: "138 000 FCFA", good: true },
                { l: "Coût total restant", a: "3 518 000 FCFA", b: "3 338 000 FCFA", good: true },
              ].map((r) => (
                <div key={r.l}>
                  <div className="t-faint" style={{ fontSize: 12, marginBottom: 7, fontWeight: 600 }}>{r.l}</div>
                  <div className="r" style={{ gap: 12 }}>
                    <span className="t-mono t-faint" style={{ fontSize: 14, textDecoration: "line-through" }}>{r.a}</span>
                    <Icon name="arrowR" size={16} className="t-faint" />
                    <span className="t-mono t-pos" style={{ fontSize: 16, fontWeight: 700 }}>{r.b}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="wf-card wf-pad r between" style={{ background: "var(--pos-wash)", borderColor: "transparent" }}>
            <div><div className="t-pos" style={{ fontWeight: 700, fontSize: 14 }}>Vous économisez 180 000 FCFA</div><div className="t-muted" style={{ fontSize: 12, marginTop: 2 }}>d'intérêts · et 6 mois plus tôt.</div></div>
            <div className="row-ico" style={{ background: "#fff", color: "var(--pos)", width: 42, height: 42 }}><Icon name="up" size={20} /></div>
          </div>
        </div>
      </div>
    </DeskShell>
  );
}
window.PretSimDesk = PretSimDesk;

function PretMob() {
  const { Icon, Progress, money, data: D } = window.WF;
  const P = D.pret;
  return (
    <MobShell active="Prêt / Dette" tab="more" title="Prêt auto" sub="NSIA Banque" back>
      <div className="wf-card wf-pad feature-card">
        <div style={{ fontSize: 11.5, opacity: .7, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase" }}>Capital restant dû</div>
        <div className="kpi-val" style={{ fontSize: 27, marginTop: 8 }}>{money(P.reste)} <span style={{ fontSize: 13, opacity: .6 }}>FCFA</span></div>
        <div style={{ marginTop: 12, height: 7, background: "rgba(255,255,255,.18)", borderRadius: 999, overflow: "hidden" }}><div style={{ width: P.progress + "%", height: "100%", background: "#fff", borderRadius: 999 }} /></div>
        <div className="r between" style={{ marginTop: 8, fontSize: 11, opacity: .75 }}><span>{P.progress} % remboursé</span><span>{P.restant} / {P.total} échéances</span></div>
      </div>
      <div className="alert warn" style={{ padding: "12px 13px" }}><i className="swatch" /><div className="row-ico" style={{ width: 32, height: 32, background: "var(--warn-wash)", color: "var(--warn)" }}><Icon name="calendar" size={16} /></div><div><div style={{ fontWeight: 700, fontSize: 12.5 }}>Prochaine échéance {P.echeance}</div><div className="t-muted" style={{ fontSize: 11 }}>{money(P.mensualite)} FCFA</div></div></div>
      <div className="r" style={{ gap: 12 }}>
        <div className="wf-card wf-pad-sm stat"><div className="sl">Taux</div><div className="sv" style={{ fontSize: 16 }}>{P.taux} %</div></div>
        <div className="wf-card wf-pad-sm stat"><div className="sl">Mensualité</div><div className="sv" style={{ fontSize: 16 }}>{money(P.mensualite)}</div></div>
      </div>
      <button className="btn primary block" style={{ padding: 13 }}><Icon name="gauge" size={16} /> Simuler un remboursement</button>
      <div className="wf-card wf-pad-sm">
        <div className="card-title" style={{ fontSize: 13.5, marginBottom: 8 }}>Amortissement à venir</div>
        {D.amortissement.slice(0, 3).map((a, i) => (
          <div className="row-line" key={i} style={{ padding: "10px 0" }}>
            <div style={{ lineHeight: 1.25 }}><div style={{ fontWeight: 600, fontSize: 12.5 }}>{a.n}</div><div className="t-faint" style={{ fontSize: 10.5 }}>Capital {money(a.cap)} · Intérêts {money(a.int)}</div></div>
            <span className="row-amt" style={{ fontSize: 12.5 }}>{money(a.reste)}</span>
          </div>
        ))}
      </div>
    </MobShell>
  );
}
window.PretMob = PretMob;
