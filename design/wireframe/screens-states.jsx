// screens-states.jsx — états : vide, confirmation, erreur (mobile)
function EmptyState() {
  const { Icon } = window.WF;
  return (
    <MobShell active="Transactions" tab="txn" title="Transactions" sub="Mai 2026">
      <div className="r" style={{ gap: 7, opacity: .5, pointerEvents: "none" }}>
        {["Tous", "Revenus", "Dépenses", "Transferts"].map((t, i) => <span key={t} className={"chip" + (i === 0 ? " on" : "")} style={{ fontSize: 11.5, padding: "5px 11px" }}>{t}</span>)}
      </div>
      <div className="c" style={{ alignItems: "center", textAlign: "center", justifyContent: "center", flex: 1, gap: 16, padding: "60px 10px" }}>
        <div className="big-ico" style={{ background: "var(--panel-2)", color: "var(--ink-faint)" }}><Icon name="inbox" size={34} /></div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 17 }}>Aucune transaction</div>
          <div className="t-faint" style={{ fontSize: 13, marginTop: 6, lineHeight: 1.5, maxWidth: 250 }}>Vos opérations apparaîtront ici. Ajoutez la première ou importez un relevé.</div>
        </div>
        <div className="c" style={{ gap: 10, width: "100%", maxWidth: 260, marginTop: 4 }}>
          <button className="btn primary block" style={{ padding: 13 }}><Icon name="plus" size={16} /> Ajouter une transaction</button>
          <button className="btn block" style={{ padding: 12 }}><Icon name="download" size={16} /> Importer un relevé</button>
        </div>
      </div>
    </MobShell>
  );
}
window.EmptyState = EmptyState;

function SuccessState() {
  const { Icon, money } = window.WF;
  return (
    <PhoneFrame>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 22 }}>
        <div className="c" style={{ alignItems: "center", gap: 16, textAlign: "center" }}>
          <div className="big-ico" style={{ background: "var(--pos-wash)", color: "var(--pos)" }}><Icon name="check" size={36} stroke={2.4} /></div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 19 }}>Transaction enregistrée</div>
            <div className="t-faint" style={{ fontSize: 13, marginTop: 5 }}>Vos soldes et budgets ont été mis à jour.</div>
          </div>
        </div>
        <div className="wf-card wf-pad-sm">
          <div className="set-row" style={{ padding: "10px 0" }}><span className="t-faint" style={{ fontSize: 12.5, flex: 1 }}>Montant</span><span className="t-mono t-neg" style={{ fontWeight: 600 }}>−{money(25000)} FCFA</span></div>
          <div className="set-row" style={{ padding: "10px 0" }}><span className="t-faint" style={{ fontSize: 12.5, flex: 1 }}>Catégorie</span><span className="tag-cat">Alimentation</span></div>
          <div className="set-row" style={{ padding: "10px 0" }}><span className="t-faint" style={{ fontSize: 12.5, flex: 1 }}>Compte</span><span style={{ fontWeight: 600, fontSize: 12.5 }}>Orange Money</span></div>
          <div className="set-row" style={{ padding: "10px 0" }}><span className="t-faint" style={{ fontSize: 12.5, flex: 1 }}>Date</span><span style={{ fontWeight: 600, fontSize: 12.5 }}>31 mai 2026</span></div>
        </div>
      </div>
      <div className="c" style={{ gap: 10 }}>
        <button className="btn primary block" style={{ padding: 13 }}>Voir la transaction</button>
        <button className="btn block" style={{ padding: 12 }}><Icon name="plus" size={16} /> Nouvelle transaction</button>
      </div>
    </PhoneFrame>
  );
}
window.SuccessState = SuccessState;

function ErrorState() {
  const { Icon, money } = window.WF;
  return (
    <PhoneFrame>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 22 }}>
        <div className="c" style={{ alignItems: "center", gap: 16, textAlign: "center" }}>
          <div className="big-ico" style={{ background: "var(--neg-wash)", color: "var(--neg)" }}><Icon name="alert" size={34} /></div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 19 }}>Solde insuffisant</div>
            <div className="t-faint" style={{ fontSize: 13, marginTop: 6, lineHeight: 1.5, maxWidth: 260 }}>Le compte Orange Money ne dispose que de {money(245000)} FCFA pour une dépense de {money(300000)} FCFA.</div>
          </div>
        </div>
        <div className="alert over"><i className="swatch" /><div className="row-ico" style={{ width: 34, height: 34, background: "var(--neg-wash)", color: "var(--neg)" }}><Icon name="wallet" size={16} /></div>
          <div><div style={{ fontWeight: 700, fontSize: 12.5 }}>Orange Money</div><div className="t-muted" style={{ fontSize: 11 }}>Disponible : {money(245000)} FCFA</div></div>
        </div>
      </div>
      <div className="c" style={{ gap: 10 }}>
        <button className="btn primary block" style={{ padding: 13 }}>Changer de compte</button>
        <button className="btn block" style={{ padding: 12 }}>Modifier le montant</button>
      </div>
    </PhoneFrame>
  );
}
window.ErrorState = ErrorState;
