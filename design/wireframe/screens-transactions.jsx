// screens-transactions.jsx — Transactions module
function TxnDesk() {
  const { Icon, money, data: D } = window.WF;
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <DeskShell active="Transactions" eyebrow="Mai 2026 · 10 opérations"
        title="Transactions"
        actions={[{ l: "Exporter", ic: "down" }, { l: "Ajouter une transaction", ic: "plus", primary: true }]}>
        {/* sub-nav */}
        <div className="subnav">
          {D.txnTabs.map((t, i) => <span key={t} className={"si" + (i === 0 ? " on" : "")}>{t}</span>)}
        </div>
        {/* filters + stat strip */}
        <div className="r between wrap" style={{ gap: 12 }}>
          <div className="r" style={{ gap: 8 }}>
            <span className="chip on"><Icon name="calendar" size={14} /> Mai 2026</span>
            <span className="chip">Compte : Tous <Icon name="chevron" size={13} /></span>
            <span className="chip">Catégorie : Toutes <Icon name="chevron" size={13} /></span>
            <span className="chip"><Icon name="filter" size={14} /> Plus de filtres</span>
          </div>
        </div>
        <div className="wf-card wf-pad r" style={{ gap: 0 }}>
          <div className="stat"><div className="sl">Entrées</div><div className="sv t-pos">+970 000</div></div>
          <div className="stat" style={{ borderLeft: "1px solid var(--line-soft)", paddingLeft: 20 }}><div className="sl">Sorties</div><div className="sv t-neg">−229 600</div></div>
          <div className="stat" style={{ borderLeft: "1px solid var(--line-soft)", paddingLeft: 20 }}><div className="sl">Solde net</div><div className="sv">+740 400 <span className="kpi-cur">FCFA</span></div></div>
        </div>
        <AIBanner text="3 transactions ont été catégorisées automatiquement et 1 paiement récurrent détecté (Canal+)." cta="Vérifier" />
        {/* table */}
        <div className="wf-card" style={{ overflow: "hidden" }}>
          <table className="tbl">
            <thead><tr><th>Date</th><th>Libellé</th><th>Catégorie</th><th>Compte</th><th className="num">Montant</th></tr></thead>
            <tbody>
              {D.txnsFull.map((t, i) => (
                <tr key={i}>
                  <td className="t-faint t-mono" style={{ whiteSpace: "nowrap", width: 70 }}>{t.when}</td>
                  <td>
                    <div className="r" style={{ gap: 10 }}>
                      <div className="row-ico" style={{ width: 30, height: 30 }}><Icon name={t.amt > 0 ? "up" : t.type === "Transfert" ? "exchange" : "down"} size={15} /></div>
                      <span style={{ fontWeight: 600 }}>{t.name}</span>
                    </div>
                  </td>
                  <td><span className="tag-cat">{t.cat}</span></td>
                  <td className="t-muted">{t.acc}</td>
                  <td className={"num t-mono " + (t.amt > 0 ? "t-pos" : "")} style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{t.amt > 0 ? "+" : ""}{money(t.amt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DeskShell>

      {/* add-transaction drawer */}
      <div className="scrim" />
      <aside className="drawer">
        <div className="drawer-h">
          <div style={{ fontWeight: 800, fontSize: 16 }}>Ajouter une transaction</div>
          <div className="icon-btn" style={{ width: 32, height: 32 }}><Icon name="plus" size={16} style={{ transform: "rotate(45deg)" }} /></div>
        </div>
        <div className="drawer-b">
          <div>
            <span className="lbl">Type</span>
            <div className="seg-full"><button className="on">Dépense</button><button>Revenu</button><button>Transfert</button></div>
          </div>
          <div>
            <span className="lbl">Montant</span>
            <div className="inp big"><span>25 000</span><span className="kpi-cur">FCFA</span></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><span className="lbl">Compte</span><div className="inp"><span>Orange Money</span><Icon name="chevron" size={15} className="t-faint" /></div></div>
            <div><span className="lbl">Catégorie</span><div className="inp"><span>Alimentation</span><Icon name="chevron" size={15} className="t-faint" /></div></div>
          </div>
          <div><span className="lbl">Date</span><div className="inp"><span>31 mai 2026</span><Icon name="calendar" size={15} className="t-faint" /></div></div>
          <div><span className="lbl">Note (optionnel)</span><div className="inp"><span className="ph">Marché hebdomadaire…</span></div></div>
        </div>
        <div className="drawer-f">
          <button className="btn block">Annuler</button>
          <button className="btn primary block">Enregistrer</button>
        </div>
      </aside>
    </div>
  );
}
window.TxnDesk = TxnDesk;

function TxnMob() {
  const { Icon, money, data: D } = window.WF;
  return (
    <MobShell active="Transactions" tab="txn" title="Transactions" sub="Mai 2026">
      <div className="r" style={{ gap: 7, overflow: "hidden" }}>
        {D.txnTabs.map((t, i) => <span key={t} className={"chip" + (i === 0 ? " on" : "")} style={{ fontSize: 11.5, padding: "5px 11px", flex: "none" }}>{t}</span>)}
      </div>
      <div className="r" style={{ gap: 12 }}>
        <div className="wf-card wf-pad-sm stat"><div className="sl">Entrées</div><div className="sv t-pos" style={{ fontSize: 16 }}>+970 000</div></div>
        <div className="wf-card wf-pad-sm stat"><div className="sl">Sorties</div><div className="sv t-neg" style={{ fontSize: 16 }}>−229 600</div></div>
      </div>
      <div className="wf-card wf-pad-sm">
        <div className="t-eyebrow" style={{ marginBottom: 4 }}>Aujourd'hui · 31 mai</div>
        {D.txnsFull.slice(0, 2).map((t, i) => <TxnRow key={i} t={t} />)}
        <div className="t-eyebrow" style={{ margin: "12px 0 4px" }}>Plus tôt</div>
        {D.txnsFull.slice(2, 7).map((t, i) => <TxnRow key={i} t={t} />)}
      </div>
    </MobShell>
  );
}
function TxnRow({ t }) {
  const { Icon, money } = window.WF;
  return (
    <div className="row-line" style={{ padding: "10px 0" }}>
      <div className="row-ico" style={{ width: 34, height: 34 }}><Icon name={t.amt > 0 ? "up" : t.type === "Transfert" ? "exchange" : "down"} size={16} /></div>
      <div style={{ lineHeight: 1.25, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</div>
        <div className="t-faint" style={{ fontSize: 11 }}>{t.cat} · {t.acc}</div>
      </div>
      <span className={"row-amt " + (t.amt > 0 ? "t-pos" : "")} style={{ fontSize: 13 }}>{t.amt > 0 ? "+" : ""}{money(t.amt)}</span>
    </div>
  );
}
window.TxnMob = TxnMob;

function TxnAddMob() {
  const { Icon } = window.WF;
  return (
    <MobShell active="Transactions" tab="txn" title="Transactions" sub="Mai 2026">
      <div style={{ opacity: .4, pointerEvents: "none" }}>
        <div className="wf-card wf-pad-sm"><div className="row-line" style={{ padding: "10px 0", borderTop: "none" }}><div className="row-ico" style={{ width: 34, height: 34 }} /><div style={{ flex: 1 }}><div className="bar" /></div></div></div>
      </div>
      {/* bottom sheet */}
      <div className="sheet">
        <div className="sheet-grip" />
        <div className="r between"><div style={{ fontWeight: 800, fontSize: 17 }}>Ajouter</div><div className="icon-btn" style={{ width: 32, height: 32 }}><Icon name="plus" size={16} style={{ transform: "rotate(45deg)" }} /></div></div>
        <div className="seg-full"><button className="on">Dépense</button><button>Revenu</button><button>Transfert</button></div>
        <div><span className="lbl">Montant</span><div className="inp big"><span>25 000</span><span className="kpi-cur">FCFA</span></div></div>
        <div><span className="lbl">Compte</span><div className="inp"><span>Orange Money</span><Icon name="chevron" size={15} className="t-faint" /></div></div>
        <div><span className="lbl">Catégorie</span><div className="inp"><span>Alimentation</span><Icon name="chevron" size={15} className="t-faint" /></div></div>
        <div><span className="lbl">Date</span><div className="inp"><span>31 mai 2026</span><Icon name="calendar" size={15} className="t-faint" /></div></div>
        <button className="btn primary block" style={{ padding: "13px" }}>Enregistrer la transaction</button>
      </div>
    </MobShell>
  );
}
window.TxnAddMob = TxnAddMob;
