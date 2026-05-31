// screens-pret-tabs.jsx — Prêt / Dette: Amortissement / Paiements
const PRET_TABS = ["Vue générale", "Amortissement", "Paiements", "Simulation"];
function PretSub({ i }) {
  return <div className="subnav">{PRET_TABS.map((t, k) => <span key={t} className={"si" + (k === i ? " on" : "")}>{t}</span>)}</div>;
}

// ---------- Amortissement ----------
function PretAmortDesk() {
  const { Icon, money, data: D } = window.WF;
  const P = D.pret;
  return (
    <DeskShell active="Prêt / Dette" eyebrow="Prêt auto · NSIA Banque" title="Tableau d'amortissement"
      actions={[{ l: "Télécharger (PDF)", ic: "download" }, { l: "Simuler un remboursement", ic: "gauge", primary: true }]}>
      <PretSub i={1} />
      <div className="wf-card wf-pad r" style={{ gap: 0 }}>
        <div className="stat"><div className="sl">Capital restant</div><div className="sv">{money(P.reste)}</div></div>
        <div className="stat" style={{ borderLeft: "1px solid var(--line-soft)", paddingLeft: 20 }}><div className="sl">Intérêts restants</div><div className="sv t-muted">318 000</div></div>
        <div className="stat" style={{ borderLeft: "1px solid var(--line-soft)", paddingLeft: 20 }}><div className="sl">Mensualité</div><div className="sv">{money(P.mensualite)}</div></div>
        <div className="stat" style={{ borderLeft: "1px solid var(--line-soft)", paddingLeft: 20 }}><div className="sl">Échéances restantes</div><div className="sv">{P.restant} / {P.total}</div></div>
      </div>
      <div className="r" style={{ gap: 8 }}>
        <span className="chip on">2026</span><span className="chip">2027</span><span className="chip">2028</span>
        <span className="chip" style={{ marginLeft: "auto" }}><Icon name="filter" size={14} /> Toutes les échéances</span>
      </div>
      <div className="wf-card" style={{ overflow: "hidden" }}>
        <table className="tbl">
          <thead><tr><th>Échéance</th><th className="num">Capital</th><th className="num">Intérêts</th><th className="num">Mensualité</th><th className="num">Capital restant</th></tr></thead>
          <tbody>
            {D.amortFull.map((a, i) => (
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
window.PretAmortDesk = PretAmortDesk;

// ---------- Paiements ----------
function PretPaiementsDesk() {
  const { Icon, money, data: D } = window.WF;
  return (
    <DeskShell active="Prêt / Dette" eyebrow="Prêt auto · NSIA Banque" title="Historique des paiements"
      actions={[{ l: "Exporter", ic: "download" }, { l: "Payer maintenant", ic: "up", primary: true }]}>
      <PretSub i={2} />
      <div className="wf-card wf-pad r" style={{ gap: 0 }}>
        <div className="stat"><div className="sl">Payé à ce jour</div><div className="sv t-pos">{money(2030000)}</div></div>
        <div className="stat" style={{ borderLeft: "1px solid var(--line-soft)", paddingLeft: 20 }}><div className="sl">Reste à payer</div><div className="sv">{money(3190000)}</div></div>
        <div className="stat" style={{ borderLeft: "1px solid var(--line-soft)", paddingLeft: 20 }}><div className="sl">Échéances payées</div><div className="sv">14 / 36</div></div>
        <div className="stat" style={{ borderLeft: "1px solid var(--line-soft)", paddingLeft: 20 }}><div className="sl">Paiement ponctuel</div><div className="sv t-pos">100 %</div></div>
      </div>
      <div className="alert warn"><i className="swatch" /><div className="row-ico" style={{ background: "var(--warn-wash)", color: "var(--warn)" }}><Icon name="calendar" size={18} /></div>
        <div><div style={{ fontWeight: 700, fontSize: 13.5 }}>Prochaine échéance : 15 juin 2026</div><div className="t-muted" style={{ fontSize: 12 }}>145 000 FCFA seront prélevés sur le Compte courant.</div></div>
        <button className="btn" style={{ marginLeft: "auto" }}>Payer en avance</button>
      </div>
      <div className="wf-card" style={{ overflow: "hidden" }}>
        <div className="wf-pad" style={{ paddingBottom: 14 }}><div className="card-title">Paiements</div></div>
        <table className="tbl">
          <thead><tr><th>Échéance</th><th>Date</th><th>Compte</th><th className="num">Montant</th><th className="num">Statut</th></tr></thead>
          <tbody>
            {D.paiements.map((p, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{p.n}</td>
                <td className="t-muted t-mono">{p.when}</td>
                <td className="t-muted">Compte courant</td>
                <td className="num t-mono" style={{ fontWeight: 600 }}>{money(p.amt)}</td>
                <td className="num"><span className={"badge " + (p.status === "Payé" ? "ok" : "warn")}>{p.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DeskShell>
  );
}
window.PretPaiementsDesk = PretPaiementsDesk;
