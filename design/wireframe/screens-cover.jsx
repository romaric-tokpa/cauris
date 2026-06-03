// screens-cover.jsx — Sommaire & légende (orientation du dossier de wireframes)
function Cover() {
  const { Icon } = window.WF;

  const modules = [
    { ic: "lock", l: "Authentification" },
    { ic: "flag", l: "Onboarding" },
    { ic: "grid", l: "Dashboard" },
    { ic: "exchange", l: "Transactions" },
    { ic: "gauge", l: "Budgets" },
    { ic: "target", l: "Objectifs" },
    { ic: "analytics", l: "Analytics" },
    { ic: "wallet", l: "Comptes" },
    { ic: "bank", l: "Prêt / Dette" },
    { ic: "bell", l: "Notifications" },
    { ic: "gear", l: "Paramètres" },
  ];

  const couches = [
    { ic: "mic", l: "Capture multi-canal", sub: "Vocal · langage naturel · SMS · cash allégé" },
    { ic: "layers", l: "Coach IA transparent", sub: "Observé · analyse · confiance · recommandation" },
  ];

  const parcours = [
    "Première prise en main (onboarding)",
    "Ajouter une transaction (multi-canal)",
    "Comprendre un dépassement budgétaire",
    "Suivre un objectif d'épargne",
    "Consulter un compte et ses opérations",
    "Suivre le prêt et simuler un remboursement",
    "Analyser une catégorie de dépense",
    "Traiter une notification",
  ];

  const stats = [
    { v: "13", l: "modules" },
    { v: "57", l: "écrans" },
    { v: "2", l: "plateformes" },
    { v: "8", l: "parcours" },
  ];

  const signaux = [
    { c: "var(--pos)", w: "var(--pos-wash)", l: "Positif / entrée", s: "revenus, épargne, progrès" },
    { c: "var(--neg)", w: "var(--neg-wash)", l: "Dépassement", s: "budget dépassé, sortie" },
    { c: "var(--warn)", w: "var(--warn-wash)", l: "Alerte douce", s: "échéance, dérive naissante" },
    { c: "var(--accent)", w: "var(--accent-wash)", l: "Accent / action", s: "liens, sélection, IA" },
  ];

  return (
    <div className="wf" style={{ background: "var(--bg)", padding: "44px 48px", overflow: "hidden" }}>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 22 }}>
        {/* header */}
        <div className="r between" style={{ alignItems: "flex-start" }}>
          <div>
            <div className="logo" style={{ marginBottom: 18 }}><div className="logo-mark" style={{ width: 34, height: 34, fontSize: 17 }}>C</div><div className="logo-name" style={{ fontSize: 19 }}>Cauris</div></div>
            <div className="t-eyebrow">Wireframes mid-fi · finances personnelles · Afrique francophone</div>
            <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-.025em", marginTop: 10, lineHeight: 1.05, maxWidth: 760 }}>Cockpit de pilotage des finances personnelles</div>
            <div className="t-muted" style={{ fontSize: 15, marginTop: 12, maxWidth: 680, lineHeight: 1.5 }}>Un socle de suivi fiable — comptes, transactions, budgets, objectifs, dette — augmenté d'une couche de capture multi-canal et d'un coach IA transparent. Le tracking reste prioritaire ; l'IA accompagne sans jamais se substituer à l'utilisateur.</div>
          </div>
          <div className="wf-card wf-pad" style={{ minWidth: 230 }}>
            <div className="t-eyebrow" style={{ marginBottom: 12 }}>Lecture du dossier</div>
            <div className="c" style={{ gap: 10 }}>
              <div className="r" style={{ gap: 10, fontSize: 12.5 }}><Icon name="grid" size={15} className="t-faint" /> Faites défiler / zoomez la toile</div>
              <div className="r" style={{ gap: 10, fontSize: 12.5 }}><Icon name="up" size={15} className="t-faint" /> Ouvrez un écran en plein écran</div>
              <div className="r" style={{ gap: 10, fontSize: 12.5 }}><Icon name="sliders" size={15} className="t-faint" /> Tweaks : thème, verre, accent</div>
            </div>
          </div>
        </div>

        {/* stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
          {stats.map((s) => (
            <div className="wf-card wf-pad" key={s.l}>
              <div className="kpi-val" style={{ fontSize: 34, lineHeight: 1 }}>{s.v}</div>
              <div className="t-muted" style={{ fontSize: 12.5, marginTop: 7, fontWeight: 600 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* 3 columns: modules / couches+parcours / légende */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.15fr 1fr", gap: 14, flex: 1, minHeight: 0 }}>
          {/* modules */}
          <div className="wf-card wf-pad">
            <div className="card-title" style={{ marginBottom: 14 }}>Modules</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
              {modules.map((m) => (
                <div className="r" key={m.l} style={{ gap: 9 }}>
                  <div className="row-ico" style={{ width: 30, height: 30 }}><Icon name={m.ic} size={15} /></div>
                  <span style={{ fontSize: 12.5, fontWeight: 600 }}>{m.l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* couches IA + parcours */}
          <div className="c" style={{ gap: 14, minHeight: 0 }}>
            <div className="wf-card wf-pad">
              <div className="card-title" style={{ marginBottom: 12 }}>Couches transverses</div>
              <div className="c" style={{ gap: 10 }}>
                {couches.map((c) => (
                  <div className="r" key={c.l} style={{ gap: 11 }}>
                    <div className="row-ico" style={{ width: 34, height: 34, background: "var(--accent-wash)", color: "var(--accent)" }}><Icon name={c.ic} size={17} /></div>
                    <div><div style={{ fontWeight: 700, fontSize: 13 }}>{c.l}</div><div className="t-faint" style={{ fontSize: 11 }}>{c.sub}</div></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="wf-card wf-pad" style={{ flex: 1, minHeight: 0 }}>
              <div className="card-title" style={{ marginBottom: 12 }}>Parcours utilisateur</div>
              <div className="c" style={{ gap: 0 }}>
                {parcours.map((p, i) => (
                  <div className="r" key={p} style={{ gap: 11, padding: "7px 0", borderTop: i === 0 ? "none" : "1px solid var(--line-soft)" }}>
                    <span className="t-mono" style={{ fontSize: 11.5, fontWeight: 700, color: "var(--accent)", width: 16 }}>{i + 1}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 500 }}>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* légende */}
          <div className="c" style={{ gap: 14, minHeight: 0 }}>
            <div className="wf-card wf-pad">
              <div className="card-title" style={{ marginBottom: 14 }}>Signaux couleur</div>
              <div className="c" style={{ gap: 12 }}>
                {signaux.map((s) => (
                  <div className="r" key={s.l} style={{ gap: 11 }}>
                    <span style={{ width: 18, height: 18, borderRadius: 6, background: s.w, border: "1px solid " + s.c, flex: "none" }} />
                    <div><div style={{ fontWeight: 700, fontSize: 12.5 }}>{s.l}</div><div className="t-faint" style={{ fontSize: 11 }}>{s.s}</div></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="wf-card wf-pad" style={{ flex: 1, minHeight: 0 }}>
              <div className="card-title" style={{ marginBottom: 14 }}>Confiance IA</div>
              <div className="c" style={{ gap: 11 }}>
                <div className="r between"><span className="conf high"><span className="conf-dot" /> Sûr</span><span className="t-faint" style={{ fontSize: 11 }}>donnée fiable</span></div>
                <div className="r between"><span className="conf med"><span className="conf-dot" /> À vérifier</span><span className="t-faint" style={{ fontSize: 11 }}>à confirmer</span></div>
                <div className="r between"><span className="conf low"><span className="conf-dot" /> Incertain</span><span className="t-faint" style={{ fontSize: 11 }}>donnée manquante</span></div>
              </div>
              <div className="wf-hr" style={{ margin: "16px 0" }} />
              <div className="r" style={{ gap: 10, alignItems: "flex-start" }}>
                <div className="row-ico" style={{ width: 30, height: 30, background: "var(--pos-wash)", color: "var(--pos)", flex: "none" }}><Icon name="shield" size={15} /></div>
                <div className="t-muted" style={{ fontSize: 11.5, lineHeight: 1.5 }}>Analyse sur l'appareil. Ton non moralisateur, opposition rare et calibrée sur la confiance.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
window.Cover = Cover;
