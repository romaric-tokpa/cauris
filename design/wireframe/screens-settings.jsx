// screens-settings.jsx — Paramètres (desktop + mobile)
function Switch({ on }) {
  return <div className={"switch" + (on ? " on" : "")}><i /></div>;
}

const SET_NAV = [
  { ic: "user", l: "Profil" },
  { ic: "gear", l: "Préférences" },
  { ic: "sliders", l: "Coach IA & capture" },
  { ic: "shield", l: "Sécurité" },
  { ic: "tag", l: "Catégories" },
  { ic: "download", l: "Import / Export" },
  { ic: "card", l: "Sauvegarde" },
  { ic: "help", l: "Centre d'aide" },
];

function ParamsDesk() {
  const { Icon } = window.WF;
  return (
    <DeskShell active="Paramètres" eyebrow="Compte personnel" title="Paramètres">
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 18, alignItems: "start" }}>
        {/* left sub-nav */}
        <div className="wf-card wf-pad-sm set-nav">
          {SET_NAV.map((s, i) => (
            <div key={s.l} className={"si2" + (i === 1 ? " on" : "")}><Icon name={s.ic} size={17} /> {s.l}</div>
          ))}
        </div>

        {/* right content */}
        <div className="c" style={{ gap: 14, maxWidth: 640 }}>
          {/* profil */}
          <div className="wf-card wf-pad r between">
            <div className="r" style={{ gap: 14 }}>
              <div className="avatar" style={{ width: 52, height: 52, fontSize: 19 }}>A</div>
              <div><div style={{ fontWeight: 700, fontSize: 16 }}>Aïcha Koné</div><div className="t-faint" style={{ fontSize: 12.5, marginTop: 2 }}>aicha.kone@email.ci · +225 07 •• •• 12</div></div>
            </div>
            <button className="btn"><Icon name="edit" size={15} /> Modifier</button>
          </div>

          {/* préférences */}
          <div className="wf-card wf-pad">
            <div className="card-title" style={{ marginBottom: 6 }}>Préférences</div>
            <div className="set-row"><div className="set-ico"><Icon name="wallet" size={18} /></div><div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13.5 }}>Devise</div><div className="t-faint" style={{ fontSize: 11.5 }}>Affichage des montants</div></div><span className="inp" style={{ padding: "8px 12px" }}>FCFA (XOF) <Icon name="chevron" size={14} className="t-faint" /></span></div>
            <div className="set-row"><div className="set-ico"><Icon name="globe" size={18} /></div><div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13.5 }}>Langue</div><div className="t-faint" style={{ fontSize: 11.5 }}>Langue de l'application</div></div><span className="inp" style={{ padding: "8px 12px" }}>Français <Icon name="chevron" size={14} className="t-faint" /></span></div>
            <div className="set-row"><div className="set-ico"><Icon name="moon" size={18} /></div><div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13.5 }}>Mode sombre</div><div className="t-faint" style={{ fontSize: 11.5 }}>Thème de l'interface</div></div><Switch on={false} /></div>
            <div className="set-row"><div className="set-ico"><Icon name="bell" size={18} /></div><div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13.5 }}>Notifications push</div><div className="t-faint" style={{ fontSize: 11.5 }}>Alertes budgets, échéances, objectifs</div></div><Switch on={true} /></div>
          </div>

          {/* coach IA & capture */}
          <div className="wf-card wf-pad">
            <div className="card-title" style={{ marginBottom: 6 }}>Coach IA & capture</div>
            <div className="set-row"><div className="set-ico"><Icon name="sliders" size={18} /></div><div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13.5 }}>Ton & niveau d'intervention</div><div className="t-faint" style={{ fontSize: 11.5 }}>Recommandation · synthèse</div></div><span className="card-link">Configurer <Icon name="chevron" size={13} /></span></div>
            <div className="set-row"><div className="set-ico"><Icon name="layers" size={18} /></div><div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13.5 }}>Mémoire comportementale</div><div className="t-faint" style={{ fontSize: 11.5 }}>Habitudes, objectifs, préférences</div></div><Switch on={true} /></div>
            <div className="set-row"><div className="set-ico"><Icon name="phone" size={18} /></div><div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13.5 }}>Lecture des SMS (Android)</div><div className="t-faint" style={{ fontSize: 11.5 }}>Capture complémentaire · chaque opération validée</div></div><Switch on={true} /></div>
            <div className="set-row"><div className="set-ico"><Icon name="cash" size={18} /></div><div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13.5 }}>Suivi du cash</div><div className="t-faint" style={{ fontSize: 11.5 }}>Mode enveloppe (allégé)</div></div><span className="inp" style={{ padding: "8px 12px" }}>Enveloppe <Icon name="chevron" size={14} className="t-faint" /></span></div>
          </div>

          {/* sécurité */}
          <div className="wf-card wf-pad">
            <div className="card-title" style={{ marginBottom: 6 }}>Sécurité</div>
            <div className="set-row"><div className="set-ico"><Icon name="lock" size={18} /></div><div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13.5 }}>Code PIN</div><div className="t-faint" style={{ fontSize: 11.5 }}>Modifié il y a 2 mois</div></div><button className="btn">Modifier</button></div>
            <div className="set-row"><div className="set-ico"><Icon name="shield" size={18} /></div><div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13.5 }}>Authentification biométrique</div><div className="t-faint" style={{ fontSize: 11.5 }}>Empreinte / Face ID</div></div><Switch on={true} /></div>
            <div className="set-row"><div className="set-ico" style={{ background: "var(--neg-wash)", color: "var(--neg)" }}><Icon name="lock" size={18} /></div><div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13.5 }}>Comptes bloqués</div><div className="t-faint" style={{ fontSize: 11.5 }}>1 compte (Wave)</div></div><span className="card-link">Gérer <Icon name="chevron" size={13} /></span></div>
            <div className="set-row"><div className="set-ico"><Icon name="logout" size={18} /></div><div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13.5 }}>Déconnexion</div></div><button className="btn" style={{ color: "var(--neg)", borderColor: "var(--neg)" }}>Se déconnecter</button></div>
          </div>
        </div>
      </div>
    </DeskShell>
  );
}
window.ParamsDesk = ParamsDesk;

function ParamsMob() {
  const { Icon } = window.WF;
  const Group = ({ title, children }) => (
    <div><div className="t-eyebrow" style={{ margin: "2px 2px 6px" }}>{title}</div><div className="wf-card wf-pad-sm">{children}</div></div>
  );
  const Row = ({ ic, l, sub, right, danger }) => (
    <div className="set-row" style={{ padding: "12px 0" }}>
      <div className="set-ico" style={{ width: 34, height: 34, background: danger ? "var(--neg-wash)" : "var(--panel-2)", color: danger ? "var(--neg)" : "var(--ink-soft)" }}><Icon name={ic} size={16} /></div>
      <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 13 }}>{l}</div>{sub && <div className="t-faint" style={{ fontSize: 11 }}>{sub}</div>}</div>
      {right || <Icon name="chevron" size={15} className="t-faint" />}
    </div>
  );
  return (
    <MobShell active="Paramètres" tab="more" title="Paramètres">
      <div className="wf-card wf-pad r" style={{ gap: 14 }}>
        <div className="avatar" style={{ width: 48, height: 48, fontSize: 18 }}>A</div>
        <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 15 }}>Aïcha Koné</div><div className="t-faint" style={{ fontSize: 11.5 }}>aicha.kone@email.ci</div></div>
        <Icon name="chevron" size={16} className="t-faint" />
      </div>
      <Group title="Préférences">
        <Row ic="wallet" l="Devise" sub="FCFA (XOF)" />
        <Row ic="globe" l="Langue" sub="Français" />
        <Row ic="moon" l="Mode sombre" right={<Switch on={false} />} />
        <Row ic="bell" l="Notifications push" right={<Switch on={true} />} />
      </Group>
      <Group title="Coach IA & capture">
        <Row ic="sliders" l="Ton & intervention" sub="Recommandation · synthèse" />
        <Row ic="layers" l="Mémoire comportementale" right={<Switch on={true} />} />
        <Row ic="phone" l="Lecture des SMS (Android)" right={<Switch on={true} />} />
        <Row ic="cash" l="Suivi du cash" sub="Mode enveloppe" />
      </Group>
      <Group title="Sécurité">
        <Row ic="lock" l="Code PIN" sub="Modifié il y a 2 mois" />
        <Row ic="shield" l="Biométrie" right={<Switch on={true} />} />
        <Row ic="lock" l="Comptes bloqués" sub="1 compte (Wave)" danger />
      </Group>
      <Group title="Données">
        <Row ic="download" l="Import / Export" />
        <Row ic="card" l="Sauvegarde & restauration" />
        <Row ic="help" l="Centre d'aide" />
      </Group>
      <button className="btn block" style={{ padding: 13, color: "var(--neg)", borderColor: "var(--neg)" }}><Icon name="logout" size={16} /> Se déconnecter</button>
    </MobShell>
  );
}
window.ParamsMob = ParamsMob;
