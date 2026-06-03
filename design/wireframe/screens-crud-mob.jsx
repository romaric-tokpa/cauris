// screens-crud-mob.jsx — Formulaires CRUD manquants (mobile)
// Auth : mot de passe oublié + réinitialisation · Transfert · Nouvel objectif · Ajouter compte

// ---------- Mot de passe oublié ----------
function AuthForgotMob() {
  const { Icon } = window.WF;
  return (
    <PhoneFrame>
      <div className="r" style={{ paddingTop: 4 }}><div className="icon-btn" style={{ width: 34, height: 34 }}><Icon name="chevron" size={17} style={{ transform: "rotate(180deg)" }} /></div></div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 22 }}>
        <div className="auth-logo">
          <div className="lm"><Icon name="lock" size={22} /></div>
          <div className="c" style={{ alignItems: "center", gap: 6 }}>
            <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: "-.02em" }}>Mot de passe oublié</div>
            <div className="t-faint" style={{ fontSize: 13, textAlign: "center", lineHeight: 1.5, maxWidth: 290 }}>Saisissez votre email ou téléphone : nous vous enverrons un code de vérification.</div>
          </div>
        </div>
        <div className="c" style={{ gap: 14 }}>
          <div><span className="lbl">Email ou téléphone</span><div className="inp"><span className="ph">aicha.kone@email.ci</span></div></div>
          <div className="seg-full"><button className="on"><Icon name="mail" size={14} /> Par email</button><button><Icon name="phone" size={14} /> Par SMS</button></div>
          <button className="btn primary block" style={{ padding: 14, fontSize: 14 }}>Envoyer le code</button>
        </div>
      </div>
      <div className="r" style={{ justifyContent: "center", gap: 5, fontSize: 13 }}>
        <span className="t-faint">Vous vous souvenez ?</span><span className="card-link" style={{ fontSize: 13 }}>Connexion</span>
      </div>
    </PhoneFrame>
  );
}
window.AuthForgotMob = AuthForgotMob;

// ---------- Réinitialisation du mot de passe ----------
function AuthResetMob() {
  const { Icon } = window.WF;
  const reqs = [{ l: "8 caractères minimum", ok: true }, { l: "Une majuscule", ok: true }, { l: "Un chiffre", ok: true }, { l: "Un caractère spécial", ok: false }];
  return (
    <PhoneFrame>
      <div className="r" style={{ paddingTop: 4 }}><div className="icon-btn" style={{ width: 34, height: 34 }}><Icon name="chevron" size={17} style={{ transform: "rotate(180deg)" }} /></div></div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 22 }}>
        <div className="auth-logo">
          <div className="lm"><Icon name="shield" size={22} /></div>
          <div className="c" style={{ alignItems: "center", gap: 6 }}>
            <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: "-.02em" }}>Nouveau mot de passe</div>
            <div className="t-faint" style={{ fontSize: 13, textAlign: "center" }}>Choisissez un mot de passe sécurisé.</div>
          </div>
        </div>
        <div className="c" style={{ gap: 14 }}>
          <div><span className="lbl">Nouveau mot de passe</span><div className="inp"><span>••••••••••</span><Icon name="eye" size={16} className="t-faint" /></div></div>
          <div><span className="lbl">Confirmer</span><div className="inp"><span>••••••••••</span><Icon name="eye" size={16} className="t-faint" /></div></div>
          <div className="wf-card soft wf-pad-sm c" style={{ gap: 9 }}>
            {reqs.map((r) => (
              <div className="r" key={r.l} style={{ gap: 9, fontSize: 12 }}>
                <span style={{ width: 16, height: 16, borderRadius: 999, background: r.ok ? "var(--pos-wash)" : "var(--panel-2)", color: r.ok ? "var(--pos)" : "var(--ink-faint)", display: "grid", placeItems: "center", flex: "none" }}><Icon name="check" size={10} /></span>
                <span style={{ color: r.ok ? "var(--ink)" : "var(--ink-faint)", fontWeight: 500 }}>{r.l}</span>
              </div>
            ))}
          </div>
          <button className="btn primary block" style={{ padding: 14, fontSize: 14 }}>Réinitialiser</button>
        </div>
      </div>
    </PhoneFrame>
  );
}
window.AuthResetMob = AuthResetMob;

// ---------- Transfert interne (mobile, bottom sheet) ----------
function TransferMob() {
  const { Icon, money } = window.WF;
  return (
    <div className="wf" style={{ background: "var(--bg)" }}>
      <div className="phone-bar"><span>9:41</span><span className="dots"><span style={{ fontWeight: 700 }}>●●●●●</span><svg width="22" height="11" viewBox="0 0 26 13" fill="none" style={{ marginLeft: 5 }}><rect x="1" y="1.5" width="20" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.3"/><rect x="3" y="3.5" width="13" height="6" rx="1" fill="currentColor"/><rect x="22.5" y="4.5" width="2.2" height="4" rx="1" fill="currentColor"/></svg></span></div>
      <div style={{ opacity: .35, pointerEvents: "none", padding: "0 18px" }}>
        <div className="r between" style={{ padding: "8px 0 14px" }}><div style={{ fontSize: 19, fontWeight: 800 }}>Transactions</div><div className="avatar" /></div>
        <div className="wf-card wf-pad" style={{ height: 90 }} />
      </div>
      <div className="sheet" style={{ padding: "8px 18px 26px" }}>
        <div className="sheet-grip" />
        <div className="r between" style={{ margin: "4px 0 16px" }}><div style={{ fontWeight: 800, fontSize: 18 }}>Transfert interne</div><div className="icon-btn" style={{ width: 32, height: 32 }}><Icon name="plus" size={16} style={{ transform: "rotate(45deg)" }} /></div></div>
        <div className="c" style={{ gap: 13 }}>
          <div className="c" style={{ alignItems: "center", gap: 2 }}><span className="t-eyebrow">Montant</span><div className="t-mono" style={{ fontSize: 34, fontWeight: 600 }}>100 000 <span style={{ fontSize: 15, color: "var(--ink-faint)" }}>FCFA</span></div></div>
          <div><span className="lbl">Depuis</span><div className="inp"><span className="r" style={{ gap: 9 }}><span className="row-ico" style={{ width: 28, height: 28 }}><Icon name="wallet" size={14} /></span> Compte courant</span><span className="t-mono t-faint" style={{ fontSize: 11.5 }}>{money(1120000)}</span></div></div>
          <div className="r" style={{ justifyContent: "center" }}><div className="row-ico" style={{ width: 32, height: 32, background: "var(--accent-wash)", color: "var(--accent)" }}><Icon name="exchange" size={16} /></div></div>
          <div><span className="lbl">Vers</span><div className="inp"><span className="r" style={{ gap: 9 }}><span className="row-ico" style={{ width: 28, height: 28, background: "var(--pos-wash)", color: "var(--pos)" }}><Icon name="target" size={14} /></span> Épargne</span><span className="t-mono t-faint" style={{ fontSize: 11.5 }}>{money(980000)}</span></div></div>
        </div>
        <button className="btn primary block" style={{ padding: 14, fontSize: 14, marginTop: 16 }}>Confirmer le transfert</button>
      </div>
    </div>
  );
}
window.TransferMob = TransferMob;

// ---------- Nouvel objectif (mobile) ----------
function ObjCreateMob() {
  const { Icon } = window.WF;
  const presets = [{ l: "Voyage", ic: "flag" }, { l: "Urgence", ic: "shield" }, { l: "Matériel", ic: "card" }, { l: "Projet", ic: "target" }];
  return (
    <MobShell active="Objectifs" tab="more" title="Nouvel objectif" sub="Épargne" back>
      <div>
        <span className="lbl">Type d'objectif</span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
          {presets.map((p, i) => (
            <div key={p.l} className="c" style={{ alignItems: "center", gap: 6, padding: "11px 4px", borderRadius: 12, border: "1.5px solid " + (i === 0 ? "var(--accent)" : "var(--line)"), background: i === 0 ? "var(--accent-wash)" : "var(--paper)" }}>
              <Icon name={p.ic} size={19} className={i === 0 ? "" : "t-muted"} /><span style={{ fontSize: 10.5, fontWeight: 600 }}>{p.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div><span className="lbl">Nom</span><div className="inp"><span className="ph">Voyage à Dakar</span></div></div>
      <div className="c" style={{ alignItems: "center", gap: 2, margin: "4px 0" }}><span className="t-eyebrow">Montant cible</span><div className="t-mono" style={{ fontSize: 32, fontWeight: 600 }}>800 000 <span style={{ fontSize: 14, color: "var(--ink-faint)" }}>FCFA</span></div></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div><span className="lbl">Date cible</span><div className="inp"><span>Déc. 2026</span><Icon name="calendar" size={14} className="t-faint" /></div></div>
        <div><span className="lbl">Compte</span><div className="inp"><span>Épargne</span><Icon name="chevron" size={14} className="t-faint" /></div></div>
      </div>
      <div className="wf-card soft wf-pad-sm r between"><div><div style={{ fontWeight: 600, fontSize: 13 }}>Contribution auto</div><div className="t-faint" style={{ fontSize: 11 }}>67 000 FCFA / mois</div></div><div className="switch on"><i /></div></div>
      <button className="btn primary block" style={{ padding: 14, fontSize: 14, marginTop: 2 }}>Créer l'objectif</button>
    </MobShell>
  );
}
window.ObjCreateMob = ObjCreateMob;

// ---------- Ajouter un compte (mobile) ----------
function AccountAddMob() {
  const { Icon } = window.WF;
  const types = [{ l: "Banque", ic: "bank" }, { l: "Mobile money", ic: "card" }, { l: "Espèces", ic: "cash" }, { l: "Épargne", ic: "target" }];
  return (
    <MobShell active="Comptes" tab="more" title="Ajouter un compte" sub="Comptes" back>
      <div>
        <span className="lbl">Type de compte</span>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
          {types.map((t, i) => (
            <div key={t.l} className="r" style={{ gap: 10, padding: "13px 13px", borderRadius: 12, border: "1.5px solid " + (i === 1 ? "var(--accent)" : "var(--line)"), background: i === 1 ? "var(--accent-wash)" : "var(--paper)" }}>
              <Icon name={t.ic} size={19} className={i === 1 ? "" : "t-muted"} /><span style={{ fontWeight: 700, fontSize: 13 }}>{t.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div><span className="lbl">Nom du compte</span><div className="inp"><span className="ph">Wave principal</span></div></div>
      <div><span className="lbl">Établissement</span><div className="inp"><span>Wave</span><Icon name="chevron" size={15} className="t-faint" /></div></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div><span className="lbl">Solde initial</span><div className="inp"><span>0</span><span className="kpi-cur">FCFA</span></div></div>
        <div><span className="lbl">N° (4 derniers)</span><div className="inp"><span className="ph">•• 88</span></div></div>
      </div>
      <div className="wf-card soft wf-pad-sm r between"><div style={{ fontWeight: 600, fontSize: 13 }}>Inclure dans le solde total</div><div className="switch on"><i /></div></div>
      <button className="btn primary block" style={{ padding: 14, fontSize: 14, marginTop: 2 }}>Ajouter le compte</button>
    </MobShell>
  );
}
window.AccountAddMob = AccountAddMob;
