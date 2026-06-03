// screens-coach.jsx — Coach IA : transparence (4 couches) & gouvernance
const cTone = (t) => t === "over" ? "var(--neg)" : t === "warn" ? "var(--warn)" : t === "ok" ? "var(--pos)" : "var(--accent)";
const cWash = (t) => t === "over" ? "var(--neg-wash)" : t === "warn" ? "var(--warn-wash)" : t === "ok" ? "var(--pos-wash)" : "var(--accent-wash)";

// Completeness score donut + checklist (reused widget)
function CompletenessCard({ compact }) {
  const { Icon, Donut, data: D } = window.WF;
  const C = D.completeness;
  return (
    <div className="wf-card wf-pad">
      <div className="card-head"><div className="card-title" style={{ fontSize: compact ? 13.5 : 14.5 }}>Complétude des données</div><span className="t-faint" style={{ fontSize: 11 }}>requis avant conseil</span></div>
      <div className="r" style={{ gap: 16 }}>
        <Donut size={compact ? 92 : 104} segments={[{ v: C.score, color: "var(--pos)" }]} label={C.score + "%"} sub="complet" valSize={compact ? 16 : 18} />
        <div className="c" style={{ gap: 8, flex: 1 }}>
          {C.items.map((it) => (
            <div className="r between" key={it.l} style={{ fontSize: 12 }}>
              <span className="r" style={{ gap: 8 }}><span style={{ width: 16, height: 16, borderRadius: 999, background: it.ok ? "var(--pos-wash)" : "var(--warn-wash)", color: it.ok ? "var(--pos)" : "var(--warn)", display: "grid", placeItems: "center", flex: "none" }}><Icon name={it.ok ? "check" : "alert"} size={10} /></span><span style={{ fontWeight: 500 }}>{it.l}</span></span>
              <span className="t-mono t-faint" style={{ fontSize: 11 }}>{it.v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
window.CompletenessCard = CompletenessCard;

// Maturity strip
function MaturityCard() {
  const { data: D } = window.WF;
  const M = D.coachMaturity;
  return (
    <div className="wf-card wf-pad">
      <div className="card-title" style={{ fontSize: 14.5, marginBottom: 4 }}>Maturité du coach</div>
      <div className="t-faint" style={{ fontSize: 11.5, marginBottom: 12 }}>Sa fiabilité augmente avec vos données.</div>
      <div className="mat" style={{ marginBottom: 10 }}>{M.labels.map((_, i) => <i key={i} className={i < M.level ? "on" : ""} />)}</div>
      <div className="r between">
        {M.labels.map((l, i) => <span key={l} style={{ fontSize: 11, fontWeight: i === M.level - 1 ? 700 : 500, color: i === M.level - 1 ? "var(--pos)" : "var(--ink-faint)" }}>{l}</span>)}
      </div>
    </div>
  );
}
window.MaturityCard = MaturityCard;

// 4-layer answer block (shared)
function LayerStack() {
  const { Icon, data: D } = window.WF;
  const A = D.coachAdvice;
  const rows = [
    { n: "1", k: "Données observées", v: A.observe, ic: "eye" },
    { n: "2", k: "Analyse calculée", v: A.analyse, ic: "analytics" },
  ];
  return (
    <div className="c" style={{ gap: 0 }}>
      {rows.map((r) => (
        <div className="layer" key={r.n}>
          <div className="ln">{r.n}</div>
          <div style={{ flex: 1 }}>
            <div className="layer-k">{r.k}</div>
            <div style={{ fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>{r.v}</div>
          </div>
        </div>
      ))}
      {/* confidence layer */}
      <div className="layer">
        <div className="ln">3</div>
        <div style={{ flex: 1 }}>
          <div className="layer-k">Niveau de confiance</div>
          <div className="r" style={{ gap: 10, marginTop: 7 }}>
            <div className="confbar" style={{ flex: 1 }}><i style={{ width: A.confiance + "%", background: cTone(A.tone) }} /></div>
            <span className="t-mono" style={{ fontWeight: 600, fontSize: 13, color: cTone(A.tone) }}>{A.confiance}%</span>
          </div>
          <div className="t-faint" style={{ fontSize: 11, marginTop: 5 }}>Confiance élevée — données suffisantes pour recommander.</div>
        </div>
      </div>
      {/* recommendation layer */}
      <div className="layer">
        <div className="ln" style={{ background: cWash(A.tone), color: cTone(A.tone) }}><Icon name="target" size={15} /></div>
        <div style={{ flex: 1 }}>
          <div className="r between"><div className="layer-k" style={{ color: cTone(A.tone) }}>Recommandation</div><span className={"badge " + (A.tone === "warn" ? "warn" : "ok")}>{A.niveau}</span></div>
          <div style={{ fontSize: 13, marginTop: 5, lineHeight: 1.5, fontWeight: 500 }}>{A.reco}</div>
        </div>
      </div>
    </div>
  );
}

// ---------- Coach — réponse transparente (desktop) ----------
function CoachAdviceDesk() {
  const { Icon, data: D } = window.WF;
  const A = D.coachAdvice;
  return (
    <DeskShell active="Assistant" eyebrow="IA · analyse transparente" title="Avis du coach"
      actions={[{ l: "Méthode & règles", ic: "help" }]}>
      <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 14, alignItems: "start" }}>
        <div className="c" style={{ gap: 14 }}>
          {/* the question */}
          <div className="wf-card wf-pad r" style={{ gap: 12, alignItems: "flex-start" }}>
            <div className="avatar sm">A</div>
            <div style={{ flex: 1 }}><div className="t-faint" style={{ fontSize: 11 }}>Votre question</div><div style={{ fontSize: 15, fontWeight: 700, marginTop: 3 }}>{A.question}</div></div>
          </div>
          {/* 4 layers */}
          <div className="wf-card wf-pad">
            <div className="r between" style={{ marginBottom: 4 }}>
              <div className="r" style={{ gap: 10 }}><div className="ai-av">C</div><div><div style={{ fontWeight: 700, fontSize: 14 }}>Réponse en 4 couches</div><div className="t-faint" style={{ fontSize: 11 }}>Calcul déterministe · reformulé en langage clair</div></div></div>
              <span className="r" style={{ gap: 6 }}><Icon name="layers" size={15} className="t-faint" /><span className="t-faint" style={{ fontSize: 11.5 }}>Transparence</span></span>
            </div>
            <LayerStack />
            {/* options */}
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line-soft)" }}>
              <div className="layer-k" style={{ marginBottom: 9 }}>Options proposées</div>
              <div className="r" style={{ gap: 8, flexWrap: "wrap" }}>
                {A.options.map((o, i) => <span key={o} className={"chip" + (i === 0 ? " on" : "")} style={{ fontSize: 12 }}>{o}</span>)}
              </div>
            </div>
          </div>
        </div>

        {/* right rail: governance */}
        <div className="c" style={{ gap: 14 }}>
          <CompletenessCard compact />
          <div className="wf-card wf-pad">
            <div className="card-title" style={{ fontSize: 14.5, marginBottom: 4 }}>Niveau d'intervention</div>
            <div className="t-faint" style={{ fontSize: 11.5, marginBottom: 12 }}>La contradiction forte reste rare et calibrée.</div>
            <div className="c" style={{ gap: 8 }}>
              {D.interventionLevels.map((lv, i) => (
                <div className="r" key={lv.l} style={{ gap: 11, opacity: i === 2 ? 1 : .5 }}>
                  <div className="row-ico" style={{ width: 30, height: 30, background: cWash(lv.tone), color: cTone(lv.tone) }}><Icon name={lv.ic} size={15} /></div>
                  <div style={{ flex: 1 }}><div style={{ fontWeight: i === 2 ? 700 : 600, fontSize: 12.5 }}>{lv.l}</div><div className="t-faint" style={{ fontSize: 10.5 }}>{lv.sub}</div></div>
                  {i === 2 && <span className="badge ok">Actuel</span>}
                </div>
              ))}
            </div>
          </div>
          <div className="wf-card wf-pad r" style={{ gap: 12, alignItems: "flex-start" }}>
            <div className="row-ico" style={{ background: "var(--pos-wash)", color: "var(--pos)", flex: "none" }}><Icon name="shield" size={18} /></div>
            <div><div style={{ fontWeight: 700, fontSize: 13 }}>Ton non moralisateur</div><div className="t-muted" style={{ fontSize: 12, marginTop: 3, lineHeight: 1.5 }}>Le coach explique l'impact et propose des arbitrages — il ne culpabilise pas et ne ressort pas vos choix passés.</div></div>
          </div>
        </div>
      </div>
    </DeskShell>
  );
}
window.CoachAdviceDesk = CoachAdviceDesk;

// ---------- Coach — réponse transparente (mobile) ----------
function CoachAdviceMob() {
  const { Icon, data: D } = window.WF;
  const A = D.coachAdvice;
  return (
    <MobShell active="Assistant" tab="more" title="Avis du coach" sub="Analyse transparente">
      <div className="wf-card wf-pad-sm r" style={{ gap: 11, alignItems: "flex-start" }}>
        <div className="avatar sm" style={{ width: 28, height: 28, fontSize: 12 }}>A</div>
        <div style={{ flex: 1 }}><div className="t-faint" style={{ fontSize: 10.5 }}>Votre question</div><div style={{ fontSize: 13.5, fontWeight: 700, marginTop: 2 }}>{A.question}</div></div>
      </div>
      <div className="wf-card wf-pad">
        <div className="r" style={{ gap: 10, marginBottom: 6 }}><div className="ai-av" style={{ width: 28, height: 28, fontSize: 12 }}>C</div><div style={{ fontWeight: 700, fontSize: 13.5 }}>Réponse en 4 couches</div></div>
        <LayerStack />
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line-soft)" }}>
          <div className="layer-k" style={{ marginBottom: 8 }}>Options</div>
          <div className="c" style={{ gap: 7 }}>
            {A.options.map((o, i) => (
              <div key={o} className={"choice" + (i === 0 ? " on" : "")} style={{ padding: "10px 12px" }}>
                <div className={"radio-c" + (i === 0 ? " on" : "")}>{i === 0 && <span style={{ width: 9, height: 9, borderRadius: 999, background: "var(--accent)" }} />}</div>
                <span style={{ fontWeight: 600, fontSize: 12.5, flex: 1 }}>{o}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MobShell>
  );
}
window.CoachAdviceMob = CoachAdviceMob;

// ---------- Dégradation gracieuse (données insuffisantes) ----------
function CoachDegradedMob() {
  const { Icon, Donut, data: D } = window.WF;
  return (
    <MobShell active="Assistant" tab="more" title="Avis du coach" sub="Confiance limitée">
      <div className="wf-card wf-pad-sm r" style={{ gap: 11, alignItems: "flex-start" }}>
        <div className="avatar sm" style={{ width: 28, height: 28, fontSize: 12 }}>A</div>
        <div style={{ flex: 1 }}><div className="t-faint" style={{ fontSize: 10.5 }}>Votre question</div><div style={{ fontSize: 13.5, fontWeight: 700, marginTop: 2 }}>Est-ce que je tiens jusqu'à la fin du mois ?</div></div>
      </div>

      <div className="wf-card wf-pad" style={{ borderColor: "var(--warn)" }}>
        <div className="r" style={{ gap: 11, marginBottom: 12 }}>
          <div className="row-ico" style={{ width: 34, height: 34, background: "var(--warn-wash)", color: "var(--warn)" }}><Icon name="alert" size={17} /></div>
          <div><div style={{ fontWeight: 700, fontSize: 13.5 }}>Analyse partielle</div><div className="t-faint" style={{ fontSize: 11.5 }}>Certaines données manquent</div></div>
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.55 }}>Je ne peux pas conclure solidement : votre <b>cash n'est pas réconcilié depuis 8 jours</b> et 1 charge fixe n'est pas déclarée. Voici une <b>estimation indicative</b>, à confiance modérée.</div>
        <div className="r" style={{ gap: 10, marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line-soft)" }}>
          <div style={{ flex: 1 }}>
            <div className="t-faint" style={{ fontSize: 10.5, fontWeight: 600 }}>Solde estimé fin de mois</div>
            <div className="kpi-val" style={{ fontSize: 19, marginTop: 3 }}>~ 120 000 <span className="kpi-cur">FCFA</span></div>
          </div>
          <span className="conf med"><span className="conf-dot" /> Confiance modérée</span>
        </div>
      </div>

      <div className="t-eyebrow" style={{ margin: "2px 2px 0" }}>Pour fiabiliser l'analyse</div>
      <div className="c" style={{ gap: 9 }}>
        <div className="cap-tile" style={{ padding: 12 }}><div className="ti" style={{ width: 36, height: 36, background: "var(--warn-wash)", color: "var(--warn)" }}><Icon name="cash" size={17} /></div><div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 13 }}>Réconcilier le cash</div><div className="t-faint" style={{ fontSize: 11 }}>Dernière fois il y a 8 jours</div></div><Icon name="chevron" size={15} className="t-faint" /></div>
        <div className="cap-tile" style={{ padding: 12 }}><div className="ti" style={{ width: 36, height: 36 }}><Icon name="repeat" size={17} /></div><div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 13 }}>Déclarer 1 charge fixe</div><div className="t-faint" style={{ fontSize: 11 }}>Abonnement détecté non confirmé</div></div><Icon name="chevron" size={15} className="t-faint" /></div>
      </div>
    </MobShell>
  );
}
window.CoachDegradedMob = CoachDegradedMob;

// ---------- Réglages du coach (gouvernance) ----------
function CoachSettingsMob() {
  const { Icon, data: D } = window.WF;
  const M = D.coachMaturity;
  const SwRow = ({ ic, l, sub, on }) => (
    <div className="set-row" style={{ padding: "12px 0" }}>
      <div className="set-ico" style={{ width: 34, height: 34 }}><Icon name={ic} size={16} /></div>
      <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 13 }}>{l}</div>{sub && <div className="t-faint" style={{ fontSize: 11 }}>{sub}</div>}</div>
      <div className={"switch" + (on ? " on" : "")}><i /></div>
    </div>
  );
  return (
    <MobShell active="Paramètres" tab="more" title="Coach IA" sub="Ton & gouvernance">
      {/* maturity */}
      <div className="wf-card wf-pad">
        <div className="r between" style={{ marginBottom: 12 }}><div style={{ fontWeight: 700, fontSize: 13.5 }}>Maturité du coach</div><span className="badge ok">{M.labels[M.level - 1]}</span></div>
        <div className="mat" style={{ marginBottom: 9 }}>{M.labels.map((_, i) => <i key={i} className={i < M.level ? "on" : ""} />)}</div>
        <div className="t-faint" style={{ fontSize: 11.5, lineHeight: 1.45 }}>Le coach devient plus fiable à mesure que vos données se complètent.</div>
      </div>

      {/* tone */}
      <div>
        <div className="t-eyebrow" style={{ margin: "2px 2px 7px" }}>Niveau d'intervention</div>
        <div className="wf-card wf-pad-sm">
          <div className="scale">
            <div className="lv">Observation</div>
            <div className="lv">Alerte douce</div>
            <div className="lv on">Recomm.</div>
            <div className="lv">Opposition</div>
          </div>
          <div className="t-faint" style={{ fontSize: 11.5, marginTop: 10, lineHeight: 1.45 }}>Jusqu'où le coach peut aller. L'opposition explicite reste rare et réservée aux enjeux importants.</div>
        </div>
      </div>

      {/* frequency */}
      <div>
        <div className="t-eyebrow" style={{ margin: "2px 2px 7px" }}>Fréquence des alertes</div>
        <div className="wf-card wf-pad-sm">
          <div className="seg-full"><button>Temps réel</button><button className="on">Synthèse</button><button>Hebdo</button></div>
          <div className="t-faint" style={{ fontSize: 11.5, marginTop: 9, lineHeight: 1.45 }}>Les alertes faibles sont regroupées en synthèse ; seules les alertes importantes interrompent.</div>
        </div>
      </div>

      {/* behavioral memory */}
      <div>
        <div className="t-eyebrow" style={{ margin: "2px 2px 4px" }}>Mémoire comportementale</div>
        <div className="wf-card wf-pad-sm c" style={{ gap: 0 }}>
          <SwRow ic="repeat" l="Habitudes & récurrences" sub="Charges fixes, postes récurrents" on />
          <SwRow ic="target" l="Objectifs & projets actifs" on />
          <SwRow ic="sliders" l="Préférences de ton & rythme" on />
          <SwRow ic="trash" l="Rappeler les conseils ignorés" sub="Désactivé — évite tout reproche" />
        </div>
      </div>
      <button className="btn block" style={{ padding: 12 }}><Icon name="refresh" size={15} /> Réinitialiser la mémoire</button>
    </MobShell>
  );
}
window.CoachSettingsMob = CoachSettingsMob;
