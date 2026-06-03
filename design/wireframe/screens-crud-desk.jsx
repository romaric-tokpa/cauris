// screens-crud-desk.jsx — Formulaires CRUD manquants (desktop)
// Transactions (détail, modifier, récurrentes, transfert), Budgets (créer, archivés),
// Objectifs (créer, historique), Comptes (ajouter, modifier), Profil (édition)

// ---- shared dimmed list backdrop for Transactions drawers ----
function TxnBackdrop() {
  const { Icon, money, data: D } = window.WF;
  return (
    <div style={{ pointerEvents: "none" }}>
      <div className="subnav">{D.txnTabs.map((t, k) => <span key={t} className={"si" + (k === 0 ? " on" : "")}>{t}</span>)}</div>
      <div className="wf-card" style={{ overflow: "hidden" }}>
        <table className="tbl">
          <thead><tr><th>Date</th><th>Libellé</th><th>Catégorie</th><th>Compte</th><th className="num">Montant</th></tr></thead>
          <tbody>
            {D.txnsFull.slice(0, 6).map((t, i) => (
              <tr key={i}>
                <td className="t-faint t-mono" style={{ width: 70 }}>{t.when}</td>
                <td style={{ fontWeight: 600 }}>{t.name}</td>
                <td><span className="tag-cat">{t.cat}</span></td>
                <td className="t-muted">{t.acc}</td>
                <td className={"num t-mono " + (t.amt > 0 ? "t-pos" : "")} style={{ fontWeight: 600 }}>{t.amt > 0 ? "+" : ""}{money(t.amt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------- Détail transaction (drawer) ----------
function TxnDetailDesk() {
  const { Icon, money } = window.WF;
  return (
    <DeskShell active="Transactions" eyebrow="Mai 2026" title="Transactions"
      actions={[{ l: "Filtres", ic: "filter" }, { l: "Ajouter une transaction", ic: "plus", primary: true }]}>
      <TxnBackdrop />
      <div className="scrim" />
      <aside className="drawer">
        <div className="drawer-h"><div style={{ fontWeight: 800, fontSize: 16 }}>Détail de la transaction</div><div className="icon-btn" style={{ width: 32, height: 32 }}><Icon name="plus" size={16} style={{ transform: "rotate(45deg)" }} /></div></div>
        <div className="drawer-b">
          <div className="c" style={{ alignItems: "center", gap: 6, padding: "4px 0 8px" }}>
            <div className="row-ico" style={{ width: 52, height: 52, background: "var(--neg-wash)", color: "var(--neg)" }}><Icon name="down" size={24} /></div>
            <div className="kpi-val t-neg" style={{ fontSize: 28, marginTop: 4 }}>−25 000 <span className="kpi-cur">FCFA</span></div>
            <span className="tag-cat">Alimentation</span>
          </div>
          <div className="wf-card soft wf-pad-sm c" style={{ gap: 0 }}>
            {[["Libellé", "Marché de Cocody"], ["Type", "Dépense"], ["Compte", "Orange Money"], ["Canal", "Mobile money"], ["Date", "Aujourd'hui · 13:24"], ["Statut", "Confirmée"]].map(([k, v], i) => (
              <div className="row-line" key={k} style={{ padding: "11px 0", borderTop: i === 0 ? "none" : undefined }}>
                <span className="t-faint" style={{ fontSize: 12, flex: 1 }}>{k}</span><span style={{ fontWeight: 600, fontSize: 13 }}>{v}</span>
              </div>
            ))}
          </div>
          <div><span className="lbl">Note</span><div className="wf-card soft wf-pad-sm t-muted" style={{ fontSize: 12.5, fontStyle: "italic" }}>Provisions de la semaine — légumes & poisson.</div></div>
        </div>
        <div className="drawer-f"><button className="btn block" style={{ color: "var(--neg)", borderColor: "var(--neg)" }}><Icon name="trash" size={15} /> Supprimer</button><button className="btn primary block"><Icon name="edit" size={15} /> Modifier</button></div>
      </aside>
    </DeskShell>
  );
}
window.TxnDetailDesk = TxnDetailDesk;

// ---------- Modifier transaction (drawer form) ----------
function TxnEditDesk() {
  const { Icon, data: D } = window.WF;
  return (
    <DeskShell active="Transactions" eyebrow="Mai 2026" title="Transactions"
      actions={[{ l: "Filtres", ic: "filter" }, { l: "Ajouter une transaction", ic: "plus", primary: true }]}>
      <TxnBackdrop />
      <div className="scrim" />
      <aside className="drawer">
        <div className="drawer-h"><div style={{ fontWeight: 800, fontSize: 16 }}>Modifier la transaction</div><div className="icon-btn" style={{ width: 32, height: 32 }}><Icon name="plus" size={16} style={{ transform: "rotate(45deg)" }} /></div></div>
        <div className="drawer-b">
          <div><span className="lbl">Type</span><div className="seg-full"><button className="on">Dépense</button><button>Revenu</button><button>Transfert</button></div></div>
          <div><span className="lbl">Montant</span><div className="inp big"><span>25 000</span><span className="kpi-cur">FCFA</span></div></div>
          <div><span className="lbl">Libellé</span><div className="inp"><span>Marché de Cocody</span></div></div>
          <div><span className="lbl">Canal de paiement</span><div className="r" style={{ gap: 7, flexWrap: "wrap" }}>{D.canaux.map((c, i) => <span key={c.id} className={"chip" + (i === 1 ? " on" : "")} style={{ fontSize: 12 }}><Icon name={c.ic} size={13} /> {c.l}</span>)}</div></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><span className="lbl">Compte</span><div className="inp"><span>Orange Money</span><Icon name="chevron" size={15} className="t-faint" /></div></div>
            <div><span className="lbl">Catégorie</span><div className="inp"><span>Alimentation</span><Icon name="chevron" size={15} className="t-faint" /></div></div>
          </div>
          <div><span className="lbl">Date</span><div className="inp"><span>31 mai 2026 · 13:24</span><Icon name="calendar" size={15} className="t-faint" /></div></div>
          <div><span className="lbl">Note</span><div className="inp"><span>Provisions de la semaine</span></div></div>
        </div>
        <div className="drawer-f"><button className="btn block">Annuler</button><button className="btn primary block">Enregistrer</button></div>
      </aside>
    </DeskShell>
  );
}
window.TxnEditDesk = TxnEditDesk;

// ---------- Transactions récurrentes (sous-page) ----------
function TxnRecurringDesk() {
  const { Icon, money, data: D } = window.WF;
  const total = D.recurrences.reduce((s, r) => s + Math.abs(r.amt), 0);
  return (
    <DeskShell active="Transactions" eyebrow="Mai 2026" title="Transactions"
      actions={[{ l: "Nouvelle récurrence", ic: "plus", primary: true }]}>
      <div className="subnav">{D.txnTabs.map((t, k) => <span key={t} className={"si" + (k === 4 ? " on" : "")}>{t}</span>)}</div>
      <div className="wf-card wf-pad r between">
        <div><div className="t-faint" style={{ fontSize: 12 }}>Charges récurrentes mensuelles</div><div className="kpi-val" style={{ fontSize: 22, marginTop: 3 }}>{money(total)} <span className="kpi-cur">FCFA / mois</span></div></div>
        <div className="c" style={{ alignItems: "flex-end" }}><span className="badge ok" style={{ background: "var(--panel-2)", color: "var(--ink-soft)" }}>{D.recurrences.length} actives</span><span className="t-faint" style={{ fontSize: 11.5, marginTop: 6 }}>2 détectées par l'IA</span></div>
      </div>
      <div className="wf-card" style={{ overflow: "hidden" }}>
        <table className="tbl">
          <thead><tr><th>Libellé</th><th>Fréquence</th><th>Prochaine</th><th className="num">Montant</th><th className="num">Statut</th><th style={{ width: 90 }} /></tr></thead>
          <tbody>
            {D.recurrences.map((r, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{r.name}</td>
                <td className="t-muted">{r.freq}</td>
                <td className="t-muted t-mono">{r.next}</td>
                <td className="num t-mono t-neg" style={{ fontWeight: 600 }}>{money(r.amt)}</td>
                <td className="num">{r.known ? <span className="badge ok">Confirmée</span> : <span className="badge warn">À confirmer</span>}</td>
                <td className="num"><div className="r" style={{ gap: 6, justifyContent: "flex-end" }}><div className="icon-btn" style={{ width: 30, height: 30 }}><Icon name="pause" size={14} /></div><div className="icon-btn" style={{ width: 30, height: 30 }}><Icon name="edit" size={14} /></div></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="wf-card soft wf-pad r" style={{ gap: 12, alignItems: "flex-start" }}>
        <div className="row-ico" style={{ background: "var(--accent-wash)", color: "var(--accent)", flex: "none" }}><Icon name="repeat" size={18} /></div>
        <div><div style={{ fontWeight: 700, fontSize: 13 }}>Détection automatique</div><div className="t-muted" style={{ fontSize: 12, marginTop: 3, lineHeight: 1.5 }}>L'IA repère les paiements qui reviennent (Canal+, Spotify…) et propose de les marquer comme récurrents. Vous confirmez.</div></div>
      </div>
    </DeskShell>
  );
}
window.TxnRecurringDesk = TxnRecurringDesk;

// ---------- Transfert interne (drawer) ----------
function TransferDesk() {
  const { Icon, money, data: D } = window.WF;
  return (
    <DeskShell active="Transactions" eyebrow="Mai 2026" title="Transactions"
      actions={[{ l: "Filtres", ic: "filter" }, { l: "Ajouter une transaction", ic: "plus", primary: true }]}>
      <TxnBackdrop />
      <div className="scrim" />
      <aside className="drawer">
        <div className="drawer-h"><div style={{ fontWeight: 800, fontSize: 16 }}>Transfert interne</div><div className="icon-btn" style={{ width: 32, height: 32 }}><Icon name="plus" size={16} style={{ transform: "rotate(45deg)" }} /></div></div>
        <div className="drawer-b">
          <div><span className="lbl">Montant</span><div className="inp big"><span>100 000</span><span className="kpi-cur">FCFA</span></div></div>
          {/* from → to */}
          <div className="c" style={{ gap: 9 }}>
            <div><span className="lbl">Depuis</span><div className="inp"><span className="r" style={{ gap: 9 }}><span className="row-ico" style={{ width: 28, height: 28 }}><Icon name="wallet" size={14} /></span> Compte courant · {money(1120000)}</span><Icon name="chevron" size={15} className="t-faint" /></div></div>
            <div className="r" style={{ justifyContent: "center" }}><div className="row-ico" style={{ width: 34, height: 34, background: "var(--accent-wash)", color: "var(--accent)" }}><Icon name="exchange" size={17} /></div></div>
            <div><span className="lbl">Vers</span><div className="inp"><span className="r" style={{ gap: 9 }}><span className="row-ico" style={{ width: 28, height: 28, background: "var(--pos-wash)", color: "var(--pos)" }}><Icon name="target" size={14} /></span> Épargne · {money(980000)}</span><Icon name="chevron" size={15} className="t-faint" /></div></div>
          </div>
          <div><span className="lbl">Date</span><div className="inp"><span>31 mai 2026</span><Icon name="calendar" size={15} className="t-faint" /></div></div>
          <div className="wf-card soft wf-pad-sm r between"><div><div style={{ fontWeight: 600, fontSize: 13 }}>Transfert récurrent</div><div className="t-faint" style={{ fontSize: 11 }}>Chaque mois, le 1er</div></div><div className="switch"><i /></div></div>
          <div className="wf-card soft wf-pad-sm r between"><span className="t-muted" style={{ fontSize: 12.5 }}>Soldes après transfert</span><span className="t-mono" style={{ fontSize: 12 }}>1 020 000 → 1 080 000</span></div>
        </div>
        <div className="drawer-f"><button className="btn block">Annuler</button><button className="btn primary block">Transférer</button></div>
      </aside>
    </DeskShell>
  );
}
window.TransferDesk = TransferDesk;

// ---------- Créer / Modifier un budget (drawer) ----------
function BudgetFormDesk() {
  const { Icon, Gauge, data: D } = window.WF;
  return (
    <DeskShell active="Budgets" eyebrow="Mai 2026" title="Budgets"
      actions={[{ l: "Créer un budget", ic: "plus", primary: true }]}>
      <div style={{ pointerEvents: "none" }}>
        <div className="subnav">{["Actifs", "En alerte", "Dépassés", "Archivés"].map((t, i) => <span key={t} className={"si" + (i === 0 ? " on" : "")}>{t}</span>)}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
          {D.budgetsFull.slice(0, 3).map((b) => (
            <div className="wf-card wf-pad" key={b.name}><div className="r between" style={{ marginBottom: 2 }}><span style={{ fontWeight: 700, fontSize: 14 }}>{b.name}</span></div><div style={{ display: "flex", justifyContent: "center" }}><Gauge pct={b.pct} tone={b.tone} size={150} /></div></div>
          ))}
        </div>
      </div>
      <div className="scrim" />
      <aside className="drawer">
        <div className="drawer-h"><div style={{ fontWeight: 800, fontSize: 16 }}>Nouveau budget</div><div className="icon-btn" style={{ width: 32, height: 32 }}><Icon name="plus" size={16} style={{ transform: "rotate(45deg)" }} /></div></div>
        <div className="drawer-b">
          <div><span className="lbl">Catégorie</span><div className="inp"><span className="r" style={{ gap: 9 }}><span className="row-ico" style={{ width: 28, height: 28 }}><Icon name="wallet" size={14} /></span> Alimentation</span><Icon name="chevron" size={15} className="t-faint" /></div></div>
          <div><span className="lbl">Plafond mensuel</span><div className="inp big"><span>200 000</span><span className="kpi-cur">FCFA</span></div></div>
          <div><span className="lbl">Période</span><div className="seg-full"><button className="on">Mensuel</button><button>Hebdo</button><button>Annuel</button></div></div>
          <div>
            <span className="lbl">Alerte à</span>
            <div className="r" style={{ gap: 7 }}>{["80 %", "90 %", "100 %"].map((p, i) => <span key={p} className={"chip" + (i === 1 ? " on" : "")} style={{ fontSize: 12 }}>{p}</span>)}</div>
          </div>
          <div className="wf-card soft wf-pad-sm r between"><div><div style={{ fontWeight: 600, fontSize: 13 }}>Reporter le solde non dépensé</div><div className="t-faint" style={{ fontSize: 11 }}>Sur le mois suivant</div></div><div className="switch on"><i /></div></div>
        </div>
        <div className="drawer-f"><button className="btn block">Annuler</button><button className="btn primary block">Créer le budget</button></div>
      </aside>
    </DeskShell>
  );
}
window.BudgetFormDesk = BudgetFormDesk;

// ---------- Budgets archivés (sous-page) ----------
function BudgetArchivedDesk() {
  const { Icon, money } = window.WF;
  const archived = [
    { name: "Cadeaux fêtes", period: "Déc. 2025", cap: 150000, spent: 142000 },
    { name: "Rentrée scolaire", period: "Sept. 2025", cap: 200000, spent: 187500 },
    { name: "Vacances août", period: "Août 2025", cap: 300000, spent: 312000, over: true },
    { name: "Ramadan", period: "Mars 2025", cap: 180000, spent: 165000 },
  ];
  return (
    <DeskShell active="Budgets" eyebrow="Historique" title="Budgets"
      actions={[{ l: "Créer un budget", ic: "plus", primary: true }]}>
      <div className="subnav">{["Actifs", "En alerte", "Dépassés", "Archivés"].map((t, i) => <span key={t} className={"si" + (i === 3 ? " on" : "")}>{t}</span>)}</div>
      <div className="wf-card" style={{ overflow: "hidden" }}>
        <table className="tbl">
          <thead><tr><th>Budget</th><th>Période</th><th className="num">Plafond</th><th className="num">Réalisé</th><th className="num">Résultat</th><th style={{ width: 110 }} /></tr></thead>
          <tbody>
            {archived.map((b, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{b.name}</td>
                <td className="t-muted t-mono">{b.period}</td>
                <td className="num t-mono t-muted">{money(b.cap)}</td>
                <td className="num t-mono">{money(b.spent)}</td>
                <td className="num">{b.over ? <span className="badge over">Dépassé</span> : <span className="badge ok">Tenu</span>}</td>
                <td className="num"><span className="card-link" style={{ justifyContent: "flex-end" }}>Réactiver <Icon name="refresh" size={13} /></span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DeskShell>
  );
}
window.BudgetArchivedDesk = BudgetArchivedDesk;

// ---------- Créer un objectif (drawer) ----------
function ObjCreateDesk() {
  const { Icon, Donut, money, data: D } = window.WF;
  return (
    <DeskShell active="Objectifs" eyebrow="Épargne" title="Objectifs"
      actions={[{ l: "Nouvel objectif", ic: "plus", primary: true }]}>
      <div style={{ pointerEvents: "none" }}>
        <div className="r" style={{ gap: 14, flexWrap: "wrap" }}>
          {D.objectifs.map((o) => (
            <div className="wf-card wf-pad r" key={o.name} style={{ gap: 16, width: 340 }}><Donut size={70} hole={0.56} segments={[{ v: o.pct, color: "var(--accent)" }]} label={o.pct + "%"} /><div><div style={{ fontWeight: 700, fontSize: 14 }}>{o.name}</div><div className="t-mono t-faint" style={{ fontSize: 11.5, marginTop: 4 }}>{money(o.at)} / {money(o.goal)}</div></div></div>
          ))}
        </div>
      </div>
      <div className="scrim" />
      <aside className="drawer">
        <div className="drawer-h"><div style={{ fontWeight: 800, fontSize: 16 }}>Nouvel objectif</div><div className="icon-btn" style={{ width: 32, height: 32 }}><Icon name="plus" size={16} style={{ transform: "rotate(45deg)" }} /></div></div>
        <div className="drawer-b">
          <div><span className="lbl">Nom de l'objectif</span><div className="inp"><span className="ph">Voyage à Dakar</span></div></div>
          <div><span className="lbl">Montant cible</span><div className="inp big"><span>800 000</span><span className="kpi-cur">FCFA</span></div></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><span className="lbl">Déjà épargné</span><div className="inp"><span>0</span><span className="kpi-cur">FCFA</span></div></div>
            <div><span className="lbl">Date cible</span><div className="inp"><span>Déc. 2026</span><Icon name="calendar" size={15} className="t-faint" /></div></div>
          </div>
          <div><span className="lbl">Compte dédié</span><div className="inp"><span>Épargne · Ecobank</span><Icon name="chevron" size={15} className="t-faint" /></div></div>
          <div className="wf-card soft wf-pad-sm">
            <div className="r between"><div><div style={{ fontWeight: 600, fontSize: 13 }}>Contribution automatique</div><div className="t-faint" style={{ fontSize: 11 }}>Chaque mois vers cet objectif</div></div><div className="switch on"><i /></div></div>
            <div className="inp" style={{ marginTop: 11 }}><span>67 000 FCFA / mois</span><span className="wf-note"><Icon name="up" size={12} /> à temps</span></div>
          </div>
        </div>
        <div className="drawer-f"><button className="btn block">Annuler</button><button className="btn primary block">Créer l'objectif</button></div>
      </aside>
    </DeskShell>
  );
}
window.ObjCreateDesk = ObjCreateDesk;

// ---------- Historique des contributions (page) ----------
function ObjHistoryDesk() {
  const { Icon, money, data: D } = window.WF;
  const rows = [
    ...D.contributions,
    { amt: 120000, acc: "Compte courant", when: "26 févr." },
    { amt: 75000, acc: "Orange Money", when: "30 janv." },
    { amt: 100000, acc: "→ Épargne", when: "28 déc." },
  ];
  const total = rows.reduce((s, r) => s + r.amt, 0);
  return (
    <DeskShell active="Objectifs" eyebrow="Fonds d'urgence" title="Historique des contributions"
      actions={[{ l: "Exporter", ic: "download" }, { l: "Ajouter une contribution", ic: "plus", primary: true }]}>
      <div className="wf-card wf-pad r" style={{ gap: 0 }}>
        <div className="stat"><div className="sl">Total versé</div><div className="sv t-pos">{money(total)}</div></div>
        <div className="stat" style={{ borderLeft: "1px solid var(--line-soft)", paddingLeft: 20 }}><div className="sl">Contributions</div><div className="sv">{rows.length}</div></div>
        <div className="stat" style={{ borderLeft: "1px solid var(--line-soft)", paddingLeft: 20 }}><div className="sl">Moyenne</div><div className="sv">{money(Math.round(total / rows.length))}</div></div>
        <div className="stat" style={{ borderLeft: "1px solid var(--line-soft)", paddingLeft: 20 }}><div className="sl">Progrès</div><div className="sv">60 %</div></div>
      </div>
      <div className="wf-card" style={{ overflow: "hidden" }}>
        <table className="tbl">
          <thead><tr><th>Date</th><th>Compte source</th><th>Type</th><th className="num">Montant</th><th style={{ width: 40 }} /></tr></thead>
          <tbody>
            {rows.map((c, i) => (
              <tr key={i}>
                <td className="t-faint t-mono" style={{ width: 90 }}>{c.when}</td>
                <td style={{ fontWeight: 600 }}>{c.acc}</td>
                <td><span className="tag-cat">{c.acc.startsWith("→") ? "Transfert" : "Manuelle"}</span></td>
                <td className="num t-mono t-pos" style={{ fontWeight: 600 }}>+{money(c.amt)}</td>
                <td className="num"><Icon name="chevron" size={15} className="t-faint" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DeskShell>
  );
}
window.ObjHistoryDesk = ObjHistoryDesk;

// ---------- Ajouter un compte (drawer) ----------
function AccountAddDesk() {
  const { Icon, money, data: D } = window.WF;
  const types = [{ l: "Banque", ic: "bank" }, { l: "Mobile money", ic: "card" }, { l: "Espèces", ic: "cash" }, { l: "Épargne", ic: "target" }];
  return (
    <DeskShell active="Comptes" eyebrow="4 comptes actifs · 1 bloqué" title="Comptes"
      actions={[{ l: "Ajouter un compte", ic: "plus", primary: true }]}>
      <div style={{ pointerEvents: "none" }}>
        <div className="subnav">{["Tous", "Trésorerie", "Épargne", "Mobile money", "Bloqués"].map((t, i) => <span key={t} className={"si" + (i === 0 ? " on" : "")}>{t}</span>)}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {D.comptesFull.slice(0, 2).map((c) => (
            <div className="wf-card wf-pad r between" key={c.name}><div className="r" style={{ gap: 12 }}><div className="row-ico" style={{ width: 42, height: 42 }}><Icon name="wallet" size={20} /></div><div><div style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</div><div className="t-faint" style={{ fontSize: 11.5 }}>{c.bank}</div></div></div><div className="kpi-val" style={{ fontSize: 18 }}>{money(c.bal)}</div></div>
          ))}
        </div>
      </div>
      <div className="scrim" />
      <aside className="drawer">
        <div className="drawer-h"><div style={{ fontWeight: 800, fontSize: 16 }}>Ajouter un compte</div><div className="icon-btn" style={{ width: 32, height: 32 }}><Icon name="plus" size={16} style={{ transform: "rotate(45deg)" }} /></div></div>
        <div className="drawer-b">
          <div>
            <span className="lbl">Type de compte</span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
              {types.map((t, i) => (
                <div key={t.l} className={"choice" + (i === 1 ? " on" : "")} style={{ flexDirection: "column", padding: "14px 8px", gap: 8, alignItems: "center" }}><Icon name={t.ic} size={22} className={i === 1 ? "" : "t-muted"} /><span style={{ fontWeight: 700, fontSize: 12.5 }}>{t.l}</span></div>
              ))}
            </div>
          </div>
          <div><span className="lbl">Nom du compte</span><div className="inp"><span className="ph">Wave principal</span></div></div>
          <div><span className="lbl">Établissement</span><div className="inp"><span>Wave</span><Icon name="chevron" size={15} className="t-faint" /></div></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><span className="lbl">Solde initial</span><div className="inp"><span>0</span><span className="kpi-cur">FCFA</span></div></div>
            <div><span className="lbl">N° (4 derniers)</span><div className="inp"><span className="ph">•• 88</span></div></div>
          </div>
          <div className="wf-card soft wf-pad-sm r between"><div><div style={{ fontWeight: 600, fontSize: 13 }}>Inclure dans le solde total</div></div><div className="switch on"><i /></div></div>
        </div>
        <div className="drawer-f"><button className="btn block">Annuler</button><button className="btn primary block">Ajouter</button></div>
      </aside>
    </DeskShell>
  );
}
window.AccountAddDesk = AccountAddDesk;

// ---------- Modifier un compte (drawer) ----------
function AccountEditDesk() {
  const { Icon, money, data: D } = window.WF;
  return (
    <DeskShell active="Comptes" eyebrow="Compte courant · NSIA Banque" title="Comptes"
      actions={[{ l: "Ajouter un compte", ic: "plus", primary: true }]}>
      <div style={{ pointerEvents: "none" }}>
        <div className="subnav">{["Tous", "Trésorerie", "Épargne", "Mobile money", "Bloqués"].map((t, i) => <span key={t} className={"si" + (i === 0 ? " on" : "")}>{t}</span>)}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {D.comptesFull.slice(0, 2).map((c) => (
            <div className="wf-card wf-pad r between" key={c.name}><div className="r" style={{ gap: 12 }}><div className="row-ico" style={{ width: 42, height: 42 }}><Icon name="wallet" size={20} /></div><div><div style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</div><div className="t-faint" style={{ fontSize: 11.5 }}>{c.bank}</div></div></div><div className="kpi-val" style={{ fontSize: 18 }}>{money(c.bal)}</div></div>
          ))}
        </div>
      </div>
      <div className="scrim" />
      <aside className="drawer">
        <div className="drawer-h"><div style={{ fontWeight: 800, fontSize: 16 }}>Modifier le compte</div><div className="icon-btn" style={{ width: 32, height: 32 }}><Icon name="plus" size={16} style={{ transform: "rotate(45deg)" }} /></div></div>
        <div className="drawer-b">
          <div className="c" style={{ alignItems: "center", gap: 8, padding: "2px 0 6px" }}><div className="row-ico" style={{ width: 52, height: 52 }}><Icon name="wallet" size={24} /></div><div className="t-faint" style={{ fontSize: 12 }}>Compte courant · {money(1120000)} FCFA</div></div>
          <div><span className="lbl">Nom du compte</span><div className="inp"><span>Compte courant</span></div></div>
          <div><span className="lbl">Établissement</span><div className="inp"><span>NSIA Banque</span><Icon name="chevron" size={15} className="t-faint" /></div></div>
          <div><span className="lbl">Type</span><div className="seg-full"><button className="on">Trésorerie</button><button>Épargne</button><button>Mobile</button></div></div>
          <div><span className="lbl">Solde actuel (ajustement)</span><div className="inp"><span>1 120 000</span><span className="kpi-cur">FCFA</span></div></div>
          <div className="wf-card soft wf-pad-sm r between"><div><div style={{ fontWeight: 600, fontSize: 13 }}>Inclure dans le solde total</div></div><div className="switch on"><i /></div></div>
          <button className="btn block" style={{ color: "var(--neg)", borderColor: "var(--neg)", justifyContent: "center" }}><Icon name="lock" size={15} /> Bloquer ce compte</button>
        </div>
        <div className="drawer-f"><button className="btn block">Annuler</button><button className="btn primary block">Enregistrer</button></div>
      </aside>
    </DeskShell>
  );
}
window.AccountEditDesk = AccountEditDesk;

// ---------- Profil (édition) ----------
function ProfileEditDesk() {
  const { Icon } = window.WF;
  const NAV = [
    { ic: "user", l: "Profil" }, { ic: "gear", l: "Préférences" }, { ic: "sliders", l: "Coach IA & capture" },
    { ic: "shield", l: "Sécurité" }, { ic: "tag", l: "Catégories" }, { ic: "download", l: "Import / Export" },
    { ic: "card", l: "Sauvegarde" }, { ic: "help", l: "Centre d'aide" },
  ];
  return (
    <DeskShell active="Paramètres" eyebrow="Compte personnel" title="Profil">
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 18, alignItems: "start" }}>
        <div className="wf-card wf-pad-sm set-nav">{NAV.map((s, i) => <div key={s.l} className={"si2" + (i === 0 ? " on" : "")}><Icon name={s.ic} size={17} /> {s.l}</div>)}</div>
        <div className="c" style={{ gap: 14, maxWidth: 640 }}>
          {/* avatar */}
          <div className="wf-card wf-pad r between">
            <div className="r" style={{ gap: 16 }}>
              <div className="avatar" style={{ width: 64, height: 64, fontSize: 24 }}>A</div>
              <div><div style={{ fontWeight: 700, fontSize: 16 }}>Aïcha Koné</div><div className="t-faint" style={{ fontSize: 12.5, marginTop: 2 }}>Membre depuis janvier 2025</div></div>
            </div>
            <button className="btn"><Icon name="edit" size={15} /> Changer la photo</button>
          </div>
          {/* identity form */}
          <div className="wf-card wf-pad">
            <div className="card-title" style={{ marginBottom: 14 }}>Informations personnelles</div>
            <div className="c" style={{ gap: 13 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><span className="lbl">Prénom</span><div className="inp"><span>Aïcha</span></div></div>
                <div><span className="lbl">Nom</span><div className="inp"><span>Koné</span></div></div>
              </div>
              <div><span className="lbl">Email</span><div className="inp"><span>aicha.kone@email.ci</span><span className="badge ok">Vérifié</span></div></div>
              <div><span className="lbl">Téléphone</span><div className="inp"><span>+225 07 •• •• 12</span><span className="card-link" style={{ fontSize: 12 }}>Modifier</span></div></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><span className="lbl">Pays</span><div className="inp"><span>Côte d'Ivoire</span><Icon name="chevron" size={15} className="t-faint" /></div></div>
                <div><span className="lbl">Devise</span><div className="inp"><span>FCFA (XOF)</span><Icon name="chevron" size={15} className="t-faint" /></div></div>
              </div>
            </div>
          </div>
          <div className="r" style={{ gap: 10, justifyContent: "flex-end" }}><button className="btn">Annuler</button><button className="btn primary">Enregistrer les modifications</button></div>
        </div>
      </div>
    </DeskShell>
  );
}
window.ProfileEditDesk = ProfileEditDesk;
