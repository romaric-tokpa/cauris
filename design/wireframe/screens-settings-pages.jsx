// screens-settings-pages.jsx — Paramètres sous-pages (Catégories, Import/Export,
// Sauvegarde, Centre d'aide, Préférences push) + Biométrie (mobile)

const SET_NAV2 = [
  { ic: "user", l: "Profil" },
  { ic: "gear", l: "Préférences" },
  { ic: "sliders", l: "Coach IA & capture" },
  { ic: "shield", l: "Sécurité" },
  { ic: "tag", l: "Catégories" },
  { ic: "download", l: "Import / Export" },
  { ic: "card", l: "Sauvegarde" },
  { ic: "help", l: "Centre d'aide" },
];

// shared two-column settings shell
function SettingsPage({ activeIdx, eyebrow, title, actions, children }) {
  const { Icon } = window.WF;
  return (
    <DeskShell active="Paramètres" eyebrow={eyebrow} title={title} actions={actions}>
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 18, alignItems: "start" }}>
        <div className="wf-card wf-pad-sm set-nav">
          {SET_NAV2.map((s, i) => <div key={s.l} className={"si2" + (i === activeIdx ? " on" : "")}><Icon name={s.ic} size={17} /> {s.l}</div>)}
        </div>
        <div className="c" style={{ gap: 14, maxWidth: 720 }}>{children}</div>
      </div>
    </DeskShell>
  );
}

// ---------- Catégories ----------
function CatRow({ c, rev }) {
  const { Icon } = window.WF;
  return (
    <div className="set-row">
      <div className="set-ico" style={{ background: c.color + "1f", color: c.color }}><Icon name={c.ic} size={17} /></div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{c.name}</div>
        <div className="t-faint" style={{ fontSize: 11.5 }}>{c.n} opération{c.n > 1 ? "s" : ""} ce mois{!rev && c.budget !== "—" ? " · budget " + c.budget : ""}</div>
      </div>
      {!rev && c.budget !== "—" && <span className="badge ok" style={{ background: "var(--panel-2)", color: "var(--ink-soft)" }}>Budget lié</span>}
      <div className="icon-btn" style={{ width: 32, height: 32 }}><Icon name="edit" size={15} /></div>
    </div>
  );
}
function ParamsCategoriesDesk() {
  const { Icon, data: D } = window.WF;
  return (
    <SettingsPage activeIdx={4} eyebrow="Compte personnel" title="Catégories"
      actions={[{ l: "Nouvelle catégorie", ic: "plus", primary: true }]}>
      <div className="wf-card wf-pad-sm r between">
        <div className="r" style={{ gap: 8 }}>
          <span className="chip on" style={{ fontSize: 12 }}>Toutes</span>
          <span className="chip" style={{ fontSize: 12 }}>Dépenses</span>
          <span className="chip" style={{ fontSize: 12 }}>Revenus</span>
        </div>
        <span className="t-faint" style={{ fontSize: 12 }}>{D.categoriesDep.length + D.categoriesRev.length} catégories</span>
      </div>
      <div className="wf-card wf-pad">
        <div className="card-title" style={{ marginBottom: 4 }}>Dépenses</div>
        {D.categoriesDep.map((c) => <CatRow key={c.name} c={c} />)}
      </div>
      <div className="wf-card wf-pad">
        <div className="card-title" style={{ marginBottom: 4 }}>Revenus</div>
        {D.categoriesRev.map((c) => <CatRow key={c.name} c={c} rev />)}
      </div>
      <div className="wf-card soft wf-pad r" style={{ gap: 12, alignItems: "flex-start" }}>
        <div className="row-ico" style={{ background: "var(--accent-wash)", color: "var(--accent)", flex: "none" }}><Icon name="layers" size={18} /></div>
        <div><div style={{ fontWeight: 700, fontSize: 13 }}>Catégorisation automatique</div><div className="t-muted" style={{ fontSize: 12, marginTop: 3, lineHeight: 1.5 }}>Les nouvelles opérations sont classées par l'IA selon vos règles. Vous pouvez corriger à tout moment.</div></div>
        <div className="switch on" style={{ flex: "none" }}><i /></div>
      </div>
    </SettingsPage>
  );
}
window.ParamsCategoriesDesk = ParamsCategoriesDesk;

// ---------- Import / Export ----------
function ParamsImportExportDesk() {
  const { Icon, data: D } = window.WF;
  return (
    <SettingsPage activeIdx={5} eyebrow="Données" title="Import / Export">
      {/* import */}
      <div className="wf-card wf-pad">
        <div className="card-title" style={{ marginBottom: 14 }}>Importer des opérations</div>
        <div className="dropzone">
          <div className="row-ico" style={{ width: 46, height: 46, margin: "0 auto 12px", background: "var(--accent-wash)", color: "var(--accent)" }}><Icon name="upload" size={22} /></div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Glissez un fichier ici</div>
          <div className="t-faint" style={{ fontSize: 12, marginTop: 4 }}>ou parcourez votre appareil — 10 Mo max</div>
          <button className="btn" style={{ margin: "14px auto 0" }}><Icon name="folder" size={15} /> Choisir un fichier</button>
        </div>
        <div className="r" style={{ gap: 10, marginTop: 14 }}>
          {D.importFormats.map((f) => (
            <div className="wf-card soft wf-pad-sm r" key={f.l} style={{ gap: 10, flex: 1 }}>
              <div className="set-ico" style={{ width: 32, height: 32 }}><Icon name={f.ic} size={16} /></div>
              <div><div style={{ fontWeight: 600, fontSize: 12.5 }}>{f.l}</div><div className="t-faint" style={{ fontSize: 10.5 }}>{f.sub}</div></div>
            </div>
          ))}
        </div>
      </div>
      {/* export */}
      <div className="wf-card wf-pad">
        <div className="card-title" style={{ marginBottom: 14 }}>Exporter mes données</div>
        <div className="set-row" style={{ borderTop: "none", paddingTop: 4 }}>
          <div className="set-ico"><Icon name="calendar" size={18} /></div>
          <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13.5 }}>Période</div><div className="t-faint" style={{ fontSize: 11.5 }}>Plage des données exportées</div></div>
          <span className="inp" style={{ padding: "8px 12px" }}>Tout l'historique <Icon name="chevron" size={14} className="t-faint" /></span>
        </div>
        <div className="set-row">
          <div className="set-ico"><Icon name="download" size={18} /></div>
          <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13.5 }}>Format</div><div className="t-faint" style={{ fontSize: 11.5 }}>Type de fichier généré</div></div>
          <div className="seg"><button className="on">CSV</button><button>Excel</button><button>PDF</button></div>
        </div>
        <button className="btn primary block" style={{ marginTop: 14, padding: 12 }}><Icon name="download" size={16} /> Exporter (CSV)</button>
      </div>
    </SettingsPage>
  );
}
window.ParamsImportExportDesk = ParamsImportExportDesk;

// ---------- Sauvegarde / restauration ----------
function ParamsBackupDesk() {
  const { Icon, data: D } = window.WF;
  return (
    <SettingsPage activeIdx={6} eyebrow="Données" title="Sauvegarde & restauration"
      actions={[{ l: "Sauvegarder maintenant", ic: "cloud", primary: true }]}>
      {/* status */}
      <div className="wf-card wf-pad r between">
        <div className="r" style={{ gap: 14 }}>
          <div className="row-ico" style={{ width: 46, height: 46, background: "var(--pos-wash)", color: "var(--pos)" }}><Icon name="check" size={22} /></div>
          <div><div style={{ fontWeight: 700, fontSize: 15 }}>À jour</div><div className="t-faint" style={{ fontSize: 12.5, marginTop: 2 }}>Dernière sauvegarde aujourd'hui à 08:12 · 2,4 Mo</div></div>
        </div>
        <span className="badge ok">Chiffré</span>
      </div>
      {/* auto backup */}
      <div className="wf-card wf-pad">
        <div className="card-title" style={{ marginBottom: 6 }}>Sauvegarde automatique</div>
        <div className="set-row" style={{ borderTop: "none", paddingTop: 6 }}>
          <div className="set-ico"><Icon name="cloud" size={18} /></div>
          <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13.5 }}>Sauvegarde dans le cloud</div><div className="t-faint" style={{ fontSize: 11.5 }}>Chiffrée de bout en bout</div></div>
          <div className="switch on"><i /></div>
        </div>
        <div className="set-row">
          <div className="set-ico"><Icon name="clock" size={18} /></div>
          <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13.5 }}>Fréquence</div><div className="t-faint" style={{ fontSize: 11.5 }}>Quand sauvegarder</div></div>
          <div className="seg"><button>Manuel</button><button className="on">Quotidien</button><button>Hebdo</button></div>
        </div>
      </div>
      {/* history */}
      <div className="wf-card wf-pad">
        <div className="card-head"><div className="card-title">Restaurer une sauvegarde</div><span className="t-faint" style={{ fontSize: 11.5 }}>{D.backups.length} disponibles</span></div>
        <div className="c" style={{ gap: 0 }}>
          {D.backups.map((b, i) => (
            <div className="row-line" key={i}>
              <div className="row-ico" style={{ width: 34, height: 34 }}><Icon name="folder" size={16} /></div>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 13 }}>{b.when}</div><div className="t-faint" style={{ fontSize: 11 }}>{b.size} · {b.auto ? "automatique" : "manuelle"}</div></div>
              <button className="btn" style={{ padding: "6px 12px", fontSize: 12 }}>Restaurer</button>
            </div>
          ))}
        </div>
      </div>
      <div className="r" style={{ gap: 10 }}>
        <button className="btn block"><Icon name="download" size={15} /> Exporter le fichier chiffré</button>
        <button className="btn block" style={{ color: "var(--neg)", borderColor: "var(--neg)" }}><Icon name="trash" size={15} /> Effacer les données locales</button>
      </div>
    </SettingsPage>
  );
}
window.ParamsBackupDesk = ParamsBackupDesk;

// ---------- Centre d'aide ----------
function ParamsHelpDesk() {
  const { Icon, data: D } = window.WF;
  return (
    <SettingsPage activeIdx={7} eyebrow="Assistance" title="Centre d'aide">
      <div className="field" style={{ padding: "12px 15px" }}><Icon name="search" size={17} /><input placeholder="Rechercher une question, un sujet…" readOnly /></div>
      {/* guides */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {D.helpGuides.map((g) => (
          <div className="wf-card wf-pad" key={g.l}>
            <div className="row-ico" style={{ width: 38, height: 38, background: "var(--accent-wash)", color: "var(--accent)", marginBottom: 12 }}><Icon name={g.ic} size={18} /></div>
            <div style={{ fontWeight: 700, fontSize: 13.5 }}>{g.l}</div>
            <div className="t-faint" style={{ fontSize: 11.5, marginTop: 2 }}>{g.sub}</div>
          </div>
        ))}
      </div>
      {/* faq */}
      <div className="wf-card wf-pad">
        <div className="card-title" style={{ marginBottom: 4 }}>Questions fréquentes</div>
        {D.faq.map((f, i) => (
          <div className="faq-row" key={i}>
            <Icon name="help" size={17} className="t-faint" />
            <span style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{f.q}</span>
            <span className="tag-cat">{f.c}</span>
            <Icon name="chevron" size={15} className="t-faint" />
          </div>
        ))}
      </div>
      {/* contact */}
      <div className="wf-card wf-pad">
        <div className="card-title" style={{ marginBottom: 14 }}>Nous contacter</div>
        <div className="r" style={{ gap: 12 }}>
          {[{ ic: "chat", l: "Chat en direct", sub: "Réponse ~2 min" }, { ic: "mail", l: "E-mail", sub: "aide@cauris.ci" }, { ic: "phone", l: "WhatsApp", sub: "+225 07 00 00 00" }].map((c) => (
            <div className="wf-card soft wf-pad-sm r" key={c.l} style={{ gap: 11, flex: 1 }}>
              <div className="set-ico" style={{ width: 36, height: 36 }}><Icon name={c.ic} size={17} /></div>
              <div><div style={{ fontWeight: 600, fontSize: 12.5 }}>{c.l}</div><div className="t-faint" style={{ fontSize: 10.5 }}>{c.sub}</div></div>
            </div>
          ))}
        </div>
      </div>
    </SettingsPage>
  );
}
window.ParamsHelpDesk = ParamsHelpDesk;

// ---------- Préférences push (détail) ----------
function ParamsPushDesk() {
  const { Icon, data: D } = window.WF;
  return (
    <SettingsPage activeIdx={1} eyebrow="Préférences" title="Notifications push">
      <div className="wf-card wf-pad r between">
        <div className="r" style={{ gap: 14 }}>
          <div className="row-ico" style={{ width: 44, height: 44, background: "var(--accent-wash)", color: "var(--accent)" }}><Icon name="bell" size={20} /></div>
          <div><div style={{ fontWeight: 700, fontSize: 15 }}>Notifications push</div><div className="t-faint" style={{ fontSize: 12.5, marginTop: 2 }}>Activées sur cet appareil</div></div>
        </div>
        <div className="switch on"><i /></div>
      </div>
      {/* per category */}
      <div className="wf-card wf-pad">
        <div className="card-title" style={{ marginBottom: 6 }}>Que recevoir ?</div>
        {D.pushCats.map((p) => (
          <div className="set-row" key={p.l}>
            <div className="set-ico"><Icon name={p.ic} size={18} /></div>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13.5 }}>{p.l}</div><div className="t-faint" style={{ fontSize: 11.5 }}>{p.sub}</div></div>
            <div className={"switch" + (p.on ? " on" : "")}><i /></div>
          </div>
        ))}
      </div>
      {/* channels + quiet hours */}
      <div className="wf-card wf-pad">
        <div className="card-title" style={{ marginBottom: 6 }}>Canaux & horaires</div>
        <div className="set-row" style={{ borderTop: "none", paddingTop: 6 }}>
          <div className="set-ico"><Icon name="phone" size={18} /></div>
          <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13.5 }}>Canaux</div><div className="t-faint" style={{ fontSize: 11.5 }}>Où envoyer les alertes</div></div>
          <div className="r" style={{ gap: 7 }}><span className="chip on" style={{ fontSize: 11.5 }}>Push</span><span className="chip" style={{ fontSize: 11.5 }}>E-mail</span><span className="chip" style={{ fontSize: 11.5 }}>SMS</span></div>
        </div>
        <div className="set-row">
          <div className="set-ico"><Icon name="moon" size={18} /></div>
          <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13.5 }}>Ne pas déranger</div><div className="t-faint" style={{ fontSize: 11.5 }}>22:00 → 07:00</div></div>
          <div className="switch on"><i /></div>
        </div>
      </div>
    </SettingsPage>
  );
}
window.ParamsPushDesk = ParamsPushDesk;

// ---------- Biométrie (setup mobile) ----------
function BiometricMob() {
  const { Icon } = window.WF;
  return (
    <MobShell active="Paramètres" tab="more" title="Biométrie" sub="Sécurité" back>
      <div className="c" style={{ alignItems: "center", textAlign: "center", gap: 6, padding: "10px 0 4px" }}>
        <div style={{ width: 96, height: 96, borderRadius: 999, background: "var(--accent-wash)", color: "var(--accent)", display: "grid", placeItems: "center", marginBottom: 6 }}><Icon name="finger" size={48} stroke={1.5} /></div>
        <div style={{ fontSize: 18, fontWeight: 800 }}>Déverrouillage biométrique</div>
        <div className="t-muted" style={{ fontSize: 13, lineHeight: 1.5, maxWidth: 280 }}>Utilisez votre empreinte ou Face ID pour ouvrir l'application et valider les opérations sensibles.</div>
      </div>

      <div className="wf-card wf-pad-sm c" style={{ gap: 0 }}>
        <div className="set-row" style={{ padding: "13px 0", borderTop: "none" }}>
          <div className="set-ico" style={{ width: 34, height: 34 }}><Icon name="finger" size={17} /></div>
          <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13 }}>Empreinte digitale</div><div className="t-faint" style={{ fontSize: 11 }}>Configurée</div></div>
          <span className="badge ok">Active</span>
        </div>
        <div className="set-row" style={{ padding: "13px 0" }}>
          <div className="set-ico" style={{ width: 34, height: 34 }}><Icon name="user" size={17} /></div>
          <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13 }}>Reconnaissance faciale</div><div className="t-faint" style={{ fontSize: 11 }}>Non configurée</div></div>
          <span className="card-link" style={{ fontSize: 12 }}>Activer</span>
        </div>
      </div>

      <div>
        <div className="t-eyebrow" style={{ margin: "2px 2px 7px" }}>Exiger la biométrie pour</div>
        <div className="wf-card wf-pad-sm c" style={{ gap: 0 }}>
          <div className="set-row" style={{ padding: "12px 0", borderTop: "none" }}><div className="set-ico" style={{ width: 34, height: 34 }}><Icon name="lock" size={16} /></div><div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13 }}>Ouvrir l'application</div></div><div className="switch on"><i /></div></div>
          <div className="set-row" style={{ padding: "12px 0" }}><div className="set-ico" style={{ width: 34, height: 34 }}><Icon name="exchange" size={16} /></div><div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13 }}>Valider un transfert</div></div><div className="switch on"><i /></div></div>
          <div className="set-row" style={{ padding: "12px 0" }}><div className="set-ico" style={{ width: 34, height: 34 }}><Icon name="eye" size={16} /></div><div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13 }}>Afficher les soldes</div></div><div className="switch"><i /></div></div>
        </div>
      </div>

      <button className="btn primary block" style={{ padding: 14, marginTop: 2 }}><Icon name="finger" size={16} /> Tester le déverrouillage</button>
      <div className="t-faint" style={{ fontSize: 11, textAlign: "center", lineHeight: 1.5 }}>Vos données biométriques restent sur l'appareil et ne sont jamais transmises.</div>
    </MobShell>
  );
}
window.BiometricMob = BiometricMob;
