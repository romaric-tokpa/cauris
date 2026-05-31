// screens-onboarding.jsx — Onboarding 5 étapes (mobile) — parcours 1
function OnbStep({ step, title, sub, children, cta = "Continuer", skip = true }) {
  const { Icon } = window.WF;
  return (
    <PhoneFrame>
      <div className="r between" style={{ marginBottom: 16, paddingTop: 4 }}>
        <div className="icon-btn" style={{ width: 34, height: 34 }}><Icon name="chevron" size={16} style={{ transform: "rotate(180deg)" }} /></div>
        <span className="t-faint" style={{ fontSize: 12, fontWeight: 600 }}>Étape {step} sur 5</span>
        {skip ? <span className="card-link" style={{ fontSize: 12.5 }}>Passer</span> : <span style={{ width: 34 }} />}
      </div>
      <div className="steps" style={{ marginBottom: 22 }}>{[1, 2, 3, 4, 5].map((i) => <i key={i} className={i <= step ? "on" : ""} />)}</div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-.02em" }}>{title}</div>
        {sub && <div className="t-faint" style={{ fontSize: 13, marginTop: 5, lineHeight: 1.4 }}>{sub}</div>}
      </div>
      <div className="c" style={{ gap: 13, flex: 1 }}>{children}</div>
      <button className="btn primary block" style={{ padding: 14, fontSize: 14 }}>{cta}</button>
    </PhoneFrame>
  );
}

const Choice = ({ ic, l, sub, on }) => {
  const { Icon } = window.WF;
  return (
    <div className={"choice" + (on ? " on" : "")}>
      <div className="set-ico" style={{ background: on ? "var(--paper)" : "var(--panel-2)", color: on ? "var(--accent)" : "var(--ink-soft)" }}><Icon name={ic} size={18} /></div>
      <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13.5 }}>{l}</div>{sub && <div className="t-faint" style={{ fontSize: 11.5 }}>{sub}</div>}</div>
      <div className={"checkbox" + (on ? " on" : "")}>{on && <Icon name="check" size={14} />}</div>
    </div>
  );
};

function OnbProfil() {
  const { Icon } = window.WF;
  return (
    <OnbStep step={1} title="Bienvenue, parlons de vous" sub="Ces infos personnalisent votre tableau de bord." skip={false}>
      <div className="c" style={{ alignItems: "center", marginBottom: 6 }}>
        <div style={{ position: "relative" }}>
          <div className="avatar" style={{ width: 76, height: 76, fontSize: 28 }}>A</div>
          <div className="icon-btn" style={{ width: 30, height: 30, position: "absolute", right: -4, bottom: -4, background: "var(--solid)", color: "var(--on-solid)", border: "none" }}><Icon name="edit" size={14} /></div>
        </div>
      </div>
      <div><span className="lbl">Prénom</span><div className="inp"><span>Aïcha</span></div></div>
      <div><span className="lbl">Pays</span><div className="inp"><span>Côte d'Ivoire</span><Icon name="chevron" size={15} className="t-faint" /></div></div>
      <div><span className="lbl">Devise</span><div className="inp"><span>FCFA (XOF)</span><Icon name="chevron" size={15} className="t-faint" /></div></div>
    </OnbStep>
  );
}
window.OnbProfil = OnbProfil;

function OnbPrefs() {
  return (
    <OnbStep step={2} title="Quels sont vos objectifs ?" sub="Sélectionnez tout ce qui vous correspond.">
      <Choice ic="target" l="Épargner régulièrement" on />
      <Choice ic="gauge" l="Suivre mes budgets" on />
      <Choice ic="bank" l="Rembourser une dette" />
      <Choice ic="analytics" l="Mieux comprendre mes dépenses" on />
    </OnbStep>
  );
}
window.OnbPrefs = OnbPrefs;

function OnbRevenus() {
  const { Icon } = window.WF;
  return (
    <OnbStep step={3} title="Vos revenus et dépenses" sub="Une estimation suffit — vous pourrez l'affiner plus tard.">
      <div><span className="lbl">Revenu mensuel net</span><div className="inp big"><span>850 000</span><span className="kpi-cur">FCFA</span></div></div>
      <div><span className="lbl">Dépenses mensuelles estimées</span><div className="inp big"><span>600 000</span><span className="kpi-cur">FCFA</span></div></div>
      <div className="wf-card soft wf-pad-sm r" style={{ gap: 11, marginTop: 4 }}>
        <Icon name="target" size={18} className="t-pos" />
        <span style={{ fontSize: 12.5 }}>Capacité d'épargne estimée : <b className="t-mono">~250 000 FCFA</b> / mois.</span>
      </div>
    </OnbStep>
  );
}
window.OnbRevenus = OnbRevenus;

function OnbObjectif() {
  const { Icon } = window.WF;
  return (
    <OnbStep step={4} title="Votre premier objectif" sub="Donnez-vous une cible pour rester motivée.">
      <div className="r" style={{ gap: 10 }}>
        <div className="choice on" style={{ flex: 1, flexDirection: "column", alignItems: "flex-start", gap: 8 }}><Icon name="shield" size={20} className="t-accent" style={{ color: "var(--accent)" }} /><span style={{ fontWeight: 600, fontSize: 12.5 }}>Fonds d'urgence</span></div>
        <div className="choice" style={{ flex: 1, flexDirection: "column", alignItems: "flex-start", gap: 8 }}><Icon name="target" size={20} className="t-faint" /><span style={{ fontWeight: 600, fontSize: 12.5 }}>Voyage</span></div>
      </div>
      <div><span className="lbl">Montant cible</span><div className="inp big"><span>2 000 000</span><span className="kpi-cur">FCFA</span></div></div>
      <div><span className="lbl">Date cible</span><div className="inp"><span>Décembre 2026</span><Icon name="calendar" size={15} className="t-faint" /></div></div>
    </OnbStep>
  );
}
window.OnbObjectif = OnbObjectif;

function OnbComptes() {
  const { Icon } = window.WF;
  const accts = [
    { ic: "wallet", l: "Compte courant", sub: "NSIA Banque", on: true },
    { ic: "target", l: "Épargne", sub: "Ecobank", on: true },
    { ic: "card", l: "Orange Money", sub: "Mobile money", on: true },
    { ic: "card", l: "Wave", sub: "Mobile money", on: false },
  ];
  return (
    <OnbStep step={5} title="Ajoutez vos comptes" sub="Suivez tout au même endroit. Vous pourrez en ajouter d'autres." cta="Terminer">
      {accts.map((a) => <Choice key={a.l} ic={a.ic} l={a.l} sub={a.sub} on={a.on} />)}
      <button className="btn block" style={{ padding: 12, marginTop: 2 }}><Icon name="plus" size={15} /> Ajouter manuellement</button>
    </OnbStep>
  );
}
window.OnbComptes = OnbComptes;
