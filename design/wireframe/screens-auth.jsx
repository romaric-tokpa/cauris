// screens-auth.jsx — Connexion / Inscription (mobile)
function AuthLogin() {
  const { Icon } = window.WF;
  return (
    <PhoneFrame>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 22 }}>
        <div className="auth-logo">
          <div className="lm">C</div>
          <div className="c" style={{ alignItems: "center", gap: 4 }}>
            <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: "-.02em" }}>Bon retour</div>
            <div className="t-faint" style={{ fontSize: 13 }}>Connectez-vous pour continuer</div>
          </div>
        </div>
        <div className="c" style={{ gap: 14 }}>
          <div><span className="lbl">Email ou téléphone</span><div className="inp"><span>aicha.kone@email.ci</span></div></div>
          <div><span className="lbl">Mot de passe</span><div className="inp"><span>••••••••••</span><Icon name="eye" size={16} className="t-faint" /></div></div>
          <div className="r" style={{ justifyContent: "flex-end" }}><span className="card-link" style={{ fontSize: 12.5 }}>Mot de passe oublié ?</span></div>
          <button className="btn primary block" style={{ padding: 14, fontSize: 14 }}>Se connecter</button>
        </div>
        <div className="r" style={{ gap: 12, color: "var(--ink-faint)", fontSize: 11.5 }}>
          <div style={{ flex: 1, height: 1, background: "var(--line)" }} /> ou <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
        </div>
        <button className="btn block" style={{ padding: 13 }}><Icon name="shield" size={17} /> Connexion biométrique</button>
      </div>
      <div className="r" style={{ justifyContent: "center", gap: 5, fontSize: 13 }}>
        <span className="t-faint">Pas encore de compte ?</span><span className="card-link" style={{ fontSize: 13 }}>Inscription</span>
      </div>
    </PhoneFrame>
  );
}
window.AuthLogin = AuthLogin;

function AuthSignup() {
  const { Icon } = window.WF;
  return (
    <PhoneFrame>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 20 }}>
        <div className="auth-logo">
          <div className="lm">C</div>
          <div className="c" style={{ alignItems: "center", gap: 4 }}>
            <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: "-.02em" }}>Créer un compte</div>
            <div className="t-faint" style={{ fontSize: 13 }}>Quelques infos pour démarrer</div>
          </div>
        </div>
        <div className="c" style={{ gap: 13 }}>
          <div><span className="lbl">Nom complet</span><div className="inp"><span className="ph">Aïcha Koné</span></div></div>
          <div><span className="lbl">Email</span><div className="inp"><span className="ph">vous@email.ci</span></div></div>
          <div><span className="lbl">Téléphone</span><div className="inp"><span className="ph">+225 07 •• •• ••</span></div></div>
          <div><span className="lbl">Mot de passe</span><div className="inp"><span className="ph">8 caractères minimum</span><Icon name="eye" size={16} className="t-faint" /></div></div>
          <div className="r" style={{ gap: 11, marginTop: 2 }}>
            <div className="checkbox on"><Icon name="check" size={14} /></div>
            <span style={{ fontSize: 12, lineHeight: 1.4 }}>J'accepte les <span style={{ color: "var(--accent)", fontWeight: 600 }}>conditions d'utilisation</span> et la politique de confidentialité.</span>
          </div>
          <button className="btn primary block" style={{ padding: 14, fontSize: 14, marginTop: 4 }}>Créer mon compte</button>
        </div>
      </div>
      <div className="r" style={{ justifyContent: "center", gap: 5, fontSize: 13 }}>
        <span className="t-faint">Déjà un compte ?</span><span className="card-link" style={{ fontSize: 13 }}>Connexion</span>
      </div>
    </PhoneFrame>
  );
}
window.AuthSignup = AuthSignup;
