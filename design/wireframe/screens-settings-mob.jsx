// screens-settings-mob.jsx — Paramètres sous-pages, versions mobile
// Catégories · Import/Export · Sauvegarde · Centre d'aide · Préférences push

function MGroup({ title, right, children }) {
  return (
    <div>
      <div className="r between" style={{ margin: "2px 2px 7px" }}>
        <div className="t-eyebrow">{title}</div>
        {right}
      </div>
      <div className="wf-card wf-pad-sm">{children}</div>
    </div>
  );
}

// ---------- Catégories (mobile) ----------
function CatRowMob({ c, rev, first }) {
  const { Icon } = window.WF;
  return (
    <div className="set-row" style={{ padding: "11px 0", borderTop: first ? "none" : undefined }}>
      <div className="set-ico" style={{ width: 34, height: 34, background: c.color + "1f", color: c.color }}><Icon name={c.ic} size={16} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
        <div className="t-faint" style={{ fontSize: 11 }}>{c.n} opér.{!rev && c.budget !== "—" ? " · budget " + c.budget : ""}</div>
      </div>
      <Icon name="edit" size={15} className="t-faint" />
    </div>
  );
}
function ParamsCategoriesMob() {
  const { Icon, data: D } = window.WF;
  return (
    <MobShell active="Paramètres" tab="more" title="Catégories" sub="Réglages" back>
      <div className="r between">
        <div className="r" style={{ gap: 7 }}>
          {["Toutes", "Dépenses", "Revenus"].map((t, i) => <span key={t} className={"chip" + (i === 0 ? " on" : "")} style={{ fontSize: 11.5, padding: "5px 11px" }}>{t}</span>)}
        </div>
        <span className="card-link" style={{ fontSize: 11.5 }}><Icon name="plus" size={13} /> Nouvelle</span>
      </div>
      <MGroup title="Dépenses">
        {D.categoriesDep.map((c, i) => <CatRowMob key={c.name} c={c} first={i === 0} />)}
      </MGroup>
      <MGroup title="Revenus">
        {D.categoriesRev.map((c, i) => <CatRowMob key={c.name} c={c} rev first={i === 0} />)}
      </MGroup>
      <div className="wf-card soft wf-pad-sm r" style={{ gap: 11, alignItems: "flex-start" }}>
        <div className="row-ico" style={{ width: 32, height: 32, background: "var(--accent-wash)", color: "var(--accent)" }}><Icon name="layers" size={16} /></div>
        <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 12.5 }}>Catégorisation auto</div><div className="t-faint" style={{ fontSize: 11, lineHeight: 1.45 }}>L'IA classe les opérations selon vos règles.</div></div>
        <div className="switch on" style={{ flex: "none" }}><i /></div>
      </div>
    </MobShell>
  );
}
window.ParamsCategoriesMob = ParamsCategoriesMob;

// ---------- Import / Export (mobile) ----------
function ParamsImportExportMob() {
  const { Icon, data: D } = window.WF;
  return (
    <MobShell active="Paramètres" tab="more" title="Import / Export" sub="Données" back>
      <div>
        <div className="t-eyebrow" style={{ margin: "2px 2px 7px" }}>Importer</div>
        <div className="dropzone" style={{ padding: 22 }}>
          <div className="row-ico" style={{ width: 42, height: 42, margin: "0 auto 10px", background: "var(--accent-wash)", color: "var(--accent)" }}><Icon name="upload" size={20} /></div>
          <div style={{ fontWeight: 700, fontSize: 13.5 }}>Choisir un fichier</div>
          <div className="t-faint" style={{ fontSize: 11.5, marginTop: 3 }}>CSV, Excel, OFX — 10 Mo max</div>
          <button className="btn" style={{ margin: "12px auto 0", padding: "8px 14px" }}><Icon name="folder" size={15} /> Parcourir</button>
        </div>
        <div className="c" style={{ gap: 8, marginTop: 10 }}>
          {D.importFormats.map((f) => (
            <div className="wf-card wf-pad-sm r" key={f.l} style={{ gap: 10 }}>
              <div className="set-ico" style={{ width: 32, height: 32 }}><Icon name={f.ic} size={16} /></div>
              <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 12.5 }}>{f.l}</div><div className="t-faint" style={{ fontSize: 10.5 }}>{f.sub}</div></div>
              <Icon name="chevron" size={15} className="t-faint" />
            </div>
          ))}
        </div>
      </div>
      <MGroup title="Exporter mes données">
        <div className="set-row" style={{ padding: "11px 0", borderTop: "none" }}><div className="set-ico" style={{ width: 34, height: 34 }}><Icon name="calendar" size={16} /></div><div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13 }}>Période</div></div><span className="t-faint" style={{ fontSize: 12 }}>Tout l'historique</span><Icon name="chevron" size={14} className="t-faint" style={{ marginLeft: 8 }} /></div>
        <div className="set-row" style={{ padding: "11px 0" }}><div className="set-ico" style={{ width: 34, height: 34 }}><Icon name="download" size={16} /></div><div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13 }}>Format</div></div><div className="seg"><button className="on">CSV</button><button>Excel</button><button>PDF</button></div></div>
      </MGroup>
      <button className="btn primary block" style={{ padding: 13 }}><Icon name="download" size={16} /> Exporter (CSV)</button>
    </MobShell>
  );
}
window.ParamsImportExportMob = ParamsImportExportMob;

// ---------- Sauvegarde / restauration (mobile) ----------
function ParamsBackupMob() {
  const { Icon, data: D } = window.WF;
  return (
    <MobShell active="Paramètres" tab="more" title="Sauvegarde" sub="Données" back>
      <div className="wf-card wf-pad r between">
        <div className="r" style={{ gap: 12 }}>
          <div className="row-ico" style={{ width: 40, height: 40, background: "var(--pos-wash)", color: "var(--pos)" }}><Icon name="check" size={19} /></div>
          <div><div style={{ fontWeight: 700, fontSize: 14 }}>À jour</div><div className="t-faint" style={{ fontSize: 11.5, marginTop: 1 }}>Auj. 08:12 · 2,4 Mo</div></div>
        </div>
        <span className="badge ok">Chiffré</span>
      </div>
      <MGroup title="Sauvegarde automatique">
        <div className="set-row" style={{ padding: "11px 0", borderTop: "none" }}><div className="set-ico" style={{ width: 34, height: 34 }}><Icon name="cloud" size={16} /></div><div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13 }}>Cloud chiffré</div><div className="t-faint" style={{ fontSize: 11 }}>De bout en bout</div></div><div className="switch on"><i /></div></div>
        <div className="set-row" style={{ padding: "11px 0" }}><div className="set-ico" style={{ width: 34, height: 34 }}><Icon name="clock" size={16} /></div><div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13 }}>Fréquence</div></div><div className="seg"><button>Manuel</button><button className="on">Quotidien</button></div></div>
      </MGroup>
      <MGroup title="Restaurer" right={<span className="t-faint" style={{ fontSize: 11 }}>{D.backups.length} dispo.</span>}>
        {D.backups.map((b, i) => (
          <div className="set-row" key={i} style={{ padding: "11px 0", borderTop: i === 0 ? "none" : undefined }}>
            <div className="set-ico" style={{ width: 34, height: 34 }}><Icon name="folder" size={16} /></div>
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 12.5 }}>{b.when}</div><div className="t-faint" style={{ fontSize: 10.5 }}>{b.size} · {b.auto ? "auto" : "manuelle"}</div></div>
            <button className="btn" style={{ padding: "6px 11px", fontSize: 11.5 }}>Restaurer</button>
          </div>
        ))}
      </MGroup>
      <button className="btn block" style={{ padding: 12, color: "var(--neg)", borderColor: "var(--neg)" }}><Icon name="trash" size={15} /> Effacer les données locales</button>
    </MobShell>
  );
}
window.ParamsBackupMob = ParamsBackupMob;

// ---------- Centre d'aide (mobile) ----------
function ParamsHelpMob() {
  const { Icon, data: D } = window.WF;
  return (
    <MobShell active="Paramètres" tab="more" title="Centre d'aide" sub="Assistance" back>
      <div className="field" style={{ padding: "11px 14px" }}><Icon name="search" size={16} /><input placeholder="Rechercher…" readOnly /></div>
      <div className="r" style={{ gap: 9 }}>
        {D.helpGuides.slice(0, 2).map((g) => (
          <div className="wf-card wf-pad-sm" key={g.l} style={{ flex: 1 }}>
            <div className="row-ico" style={{ width: 34, height: 34, background: "var(--accent-wash)", color: "var(--accent)", marginBottom: 9 }}><Icon name={g.ic} size={16} /></div>
            <div style={{ fontWeight: 700, fontSize: 12.5 }}>{g.l}</div>
            <div className="t-faint" style={{ fontSize: 10.5, marginTop: 1 }}>{g.sub}</div>
          </div>
        ))}
      </div>
      <MGroup title="Questions fréquentes">
        {D.faq.map((f, i) => (
          <div className="faq-row" key={i} style={{ padding: "12px 0" }}>
            <Icon name="help" size={16} className="t-faint" />
            <span style={{ flex: 1, fontWeight: 600, fontSize: 12.5 }}>{f.q}</span>
            <Icon name="chevron" size={15} className="t-faint" />
          </div>
        ))}
      </MGroup>
      <MGroup title="Nous contacter">
        {[{ ic: "chat", l: "Chat en direct", sub: "Réponse ~2 min" }, { ic: "mail", l: "E-mail", sub: "aide@cauris.ci" }, { ic: "phone", l: "WhatsApp", sub: "+225 07 00 00 00" }].map((c, i) => (
          <div className="set-row" key={c.l} style={{ padding: "12px 0", borderTop: i === 0 ? "none" : undefined }}>
            <div className="set-ico" style={{ width: 34, height: 34 }}><Icon name={c.ic} size={16} /></div>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13 }}>{c.l}</div><div className="t-faint" style={{ fontSize: 11 }}>{c.sub}</div></div>
            <Icon name="chevron" size={15} className="t-faint" />
          </div>
        ))}
      </MGroup>
    </MobShell>
  );
}
window.ParamsHelpMob = ParamsHelpMob;

// ---------- Préférences push (mobile) ----------
function ParamsPushMob() {
  const { Icon, data: D } = window.WF;
  return (
    <MobShell active="Paramètres" tab="more" title="Notifications" sub="Préférences" back>
      <div className="wf-card wf-pad r between">
        <div className="r" style={{ gap: 12 }}>
          <div className="row-ico" style={{ width: 40, height: 40, background: "var(--accent-wash)", color: "var(--accent)" }}><Icon name="bell" size={19} /></div>
          <div><div style={{ fontWeight: 700, fontSize: 14 }}>Push activées</div><div className="t-faint" style={{ fontSize: 11.5 }}>Sur cet appareil</div></div>
        </div>
        <div className="switch on"><i /></div>
      </div>
      <MGroup title="Que recevoir ?">
        {D.pushCats.map((p, i) => (
          <div className="set-row" key={p.l} style={{ padding: "11px 0", borderTop: i === 0 ? "none" : undefined }}>
            <div className="set-ico" style={{ width: 34, height: 34 }}><Icon name={p.ic} size={16} /></div>
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 13 }}>{p.l}</div><div className="t-faint" style={{ fontSize: 11 }}>{p.sub}</div></div>
            <div className={"switch" + (p.on ? " on" : "")}><i /></div>
          </div>
        ))}
      </MGroup>
      <MGroup title="Canaux & horaires">
        <div className="set-row" style={{ padding: "11px 0", borderTop: "none" }}><div className="set-ico" style={{ width: 34, height: 34 }}><Icon name="phone" size={16} /></div><div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13 }}>Canaux</div></div><div className="r" style={{ gap: 6 }}><span className="chip on" style={{ fontSize: 11 }}>Push</span><span className="chip" style={{ fontSize: 11 }}>SMS</span></div></div>
        <div className="set-row" style={{ padding: "11px 0" }}><div className="set-ico" style={{ width: 34, height: 34 }}><Icon name="moon" size={16} /></div><div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13 }}>Ne pas déranger</div><div className="t-faint" style={{ fontSize: 11 }}>22:00 → 07:00</div></div><div className="switch on"><i /></div></div>
      </MGroup>
    </MobShell>
  );
}
window.ParamsPushMob = ParamsPushMob;
