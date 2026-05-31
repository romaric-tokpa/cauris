// screens-ai.jsx — Module IA : Assistant, Insights, Prévisions, Anomalies
const AI_TABS = ["Assistant", "Insights", "Prévisions", "Anomalies"];
function AISub({ i }) {
  return <div className="subnav">{AI_TABS.map((t, k) => <span key={t} className={"si" + (k === i ? " on" : "")}>{t}</span>)}</div>;
}
const aiTone = (t) => t === "over" ? "var(--neg)" : t === "warn" ? "var(--warn)" : t === "ok" ? "var(--pos)" : "var(--accent)";
const aiWash = (t) => t === "over" ? "var(--neg-wash)" : t === "warn" ? "var(--warn-wash)" : t === "ok" ? "var(--pos-wash)" : "var(--accent-wash)";

function InsightCard({ n, compact }) {
  const { Icon } = window.WF;
  return (
    <div className="wf-card wf-pad" style={{ padding: compact ? 14 : 18 }}>
      <div className="r between" style={{ marginBottom: 10 }}>
        <div className="r" style={{ gap: 10 }}>
          <div className="row-ico" style={{ width: 34, height: 34, background: aiWash(n.tone), color: aiTone(n.tone) }}><Icon name={n.ic} size={17} /></div>
          <span className="insight-tag" style={{ color: aiTone(n.tone), background: aiWash(n.tone) }}>{n.tag}</span>
        </div>
      </div>
      <div style={{ fontSize: 13.5, lineHeight: 1.5, fontWeight: 500 }}>{n.text}</div>
      <div className="r between" style={{ marginTop: 12 }}>
        <span className="card-link">{n.cta} <Icon name="chevron" size={13} /></span>
        <span className="t-faint" style={{ fontSize: 11.5, cursor: "pointer" }}>Ignorer</span>
      </div>
    </div>
  );
}
window.InsightCard = InsightCard;

// Slim inline AI banner woven into module screens
function AIBanner({ text, cta, tone = "", tag }) {
  const { Icon } = window.WF;
  const c = tone === "over" ? "var(--neg)" : tone === "warn" ? "var(--warn)" : tone === "ok" ? "var(--pos)" : "var(--accent)";
  const w = tone === "over" ? "var(--neg-wash)" : tone === "warn" ? "var(--warn-wash)" : tone === "ok" ? "var(--pos-wash)" : "var(--accent-wash)";
  return (
    <div className="wf-card wf-pad-sm r" style={{ gap: 12, alignItems: "center" }}>
      <div className="ai-av" style={{ width: 30, height: 30, fontSize: 12, borderRadius: 9 }}>C</div>
      <div style={{ flex: 1, minWidth: 0, fontSize: 12.5, lineHeight: 1.45 }}>
        {tag && <span className="insight-tag" style={{ color: c, background: w, marginRight: 8 }}>{tag}</span>}
        {text}
      </div>
      {cta && <span className="card-link" style={{ whiteSpace: "nowrap" }}>{cta} <Icon name="chevron" size={13} /></span>}
    </div>
  );
}
window.AIBanner = AIBanner;

// ---------- Assistant (conversationnel) ----------
function AssistantDesk() {
  const { Icon, money, data: D } = window.WF;
  return (
    <DeskShell active="Assistant" eyebrow="IA · analyse sur votre appareil" title="Assistant financier"
      actions={[{ l: "Nouvelle conversation", ic: "plus" }]}>
      <AISub i={0} />
      <div style={{ display: "grid", gridTemplateColumns: "1.9fr 1fr", gap: 14, alignItems: "start" }}>
        {/* chat column */}
        <div className="wf-card wf-pad c" style={{ gap: 16 }}>
          <div className="chat">
            {D.chat.map((m, i) => (
              <div className={"msg " + (m.role === "u" || m.role === "user" ? "u" : "ai")} key={i}>
                {m.role === "ai" && <div className="ai-av">C</div>}
                <div className="bubble">
                  {m.text}
                  {m.bars && (
                    <div className="c" style={{ gap: 8, marginTop: 11 }}>
                      {m.bars.map((b) => (
                        <div key={b.l}>
                          <div className="r between" style={{ fontSize: 11.5, marginBottom: 4 }}><span style={{ fontWeight: 600 }}>{b.l}</span><span className="t-mono t-muted">{money(b.v * 1000)} · {b.p}%</span></div>
                          <div className="wf-prog" style={{ height: 6 }}><i className="wf-prog-fill" style={{ width: b.p * 3.4 + "%" }} /></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="r" style={{ gap: 8, flexWrap: "wrap" }}>
            {D.suggestions.slice(0, 3).map((s) => <span key={s} className="chip" style={{ fontSize: 11.5 }}>{s}</span>)}
          </div>
          <div className="ask">
            <Icon name="message" size={17} />
            <span style={{ flex: 1 }}>Posez une question sur vos finances…</span>
            <div className="icon-btn" style={{ width: 34, height: 34, background: "var(--solid)", color: "var(--on-solid)", border: "none" }}><Icon name="send" size={16} /></div>
          </div>
        </div>

        {/* right rail */}
        <div className="c" style={{ gap: 14 }}>
          <div className="wf-card wf-pad">
            <div className="card-title" style={{ marginBottom: 12 }}>Questions fréquentes</div>
            <div className="c">
              {D.suggestions.map((s, i) => (
                <div className="row-line" key={i} style={{ padding: "10px 0", gap: 10 }}>
                  <Icon name="message" size={15} className="t-faint" />
                  <span style={{ fontSize: 12.5, fontWeight: 500, flex: 1 }}>{s}</span>
                  <Icon name="chevron" size={14} className="t-faint" />
                </div>
              ))}
            </div>
          </div>
          <div className="wf-card wf-pad r" style={{ gap: 12, alignItems: "flex-start" }}>
            <div className="row-ico" style={{ background: "var(--pos-wash)", color: "var(--pos)", flex: "none" }}><Icon name="shield" size={18} /></div>
            <div><div style={{ fontWeight: 700, fontSize: 13 }}>Confidentialité</div><div className="t-muted" style={{ fontSize: 12, marginTop: 3, lineHeight: 1.5 }}>L'analyse est réalisée sur votre appareil. Vos données financières ne quittent pas l'application.</div></div>
          </div>
        </div>
      </div>
    </DeskShell>
  );
}
window.AssistantDesk = AssistantDesk;

// ---------- Insights ----------
function AIInsightsDesk() {
  const { data: D } = window.WF;
  return (
    <DeskShell active="Assistant" eyebrow={D.insights.length + " observations · mai 2026"} title="Insights"
      actions={[{ l: "Actualiser", ic: "repeat" }]}>
      <AISub i={1} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {D.insights.map((n, i) => <InsightCard key={i} n={n} />)}
      </div>
    </DeskShell>
  );
}
window.AIInsightsDesk = AIInsightsDesk;

// ---------- Prévisions ----------
function PrevisionsDesk() {
  const { Icon, money, data: D } = window.WF;
  const P = D.prevision;
  const S = D.prevSeries;
  const max = Math.max(...S.vals);
  const cards = [
    { l: "Solde à 7 jours", v: P.j7, base: P.now },
    { l: "Solde à 15 jours", v: P.j15, base: P.now },
    { l: "Solde fin de mois", v: P.fin, base: P.now },
  ];
  return (
    <DeskShell active="Assistant" eyebrow="IA · prévisions" title="Prévisions"
      actions={[{ l: "Méthode", ic: "help" }]}>
      <AISub i={2} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {cards.map((k) => {
          const up = k.v >= k.base;
          return (
            <div className="wf-card wf-pad" key={k.l}>
              <div className="kpi-label">{k.l}</div>
              <div className="kpi-val" style={{ fontSize: 22, marginTop: 11 }}>{money(k.v)} <span className="kpi-cur">FCFA</span></div>
              <div className={"delta " + (up ? "t-pos" : "t-neg")} style={{ marginTop: 5 }}><Icon name={up ? "up" : "down"} size={13} /> {up ? "+" : "−"}{money(Math.abs(k.v - k.base))} vs aujourd'hui</div>
            </div>
          );
        })}
      </div>
      <div className="wf-card wf-pad">
        <div className="card-head"><div><div className="card-title">Solde projeté</div><div className="t-faint" style={{ fontSize: 11.5, marginTop: 2 }}>Estimation à partir de vos flux récurrents</div></div>
          <div className="r" style={{ gap: 14, fontSize: 11.5, fontWeight: 600 }}><span className="r" style={{ gap: 6 }}><i style={{ width: 10, height: 10, borderRadius: 3, background: "var(--ink)" }} /> Réalisé</span><span className="r" style={{ gap: 6 }}><i style={{ width: 10, height: 10, borderRadius: 3, background: "var(--accent)", opacity: .5 }} /> Prévision</span></div>
        </div>
        <div className="wf-bars" style={{ height: 170 }}>
          {S.vals.map((v, i) => (
            <div className="wf-bargrp" key={i}>
              <div className="wf-barpair"><span className="wf-bar" style={{ width: 26, height: `${(v / max) * 100}%`, background: i === 0 ? "var(--ink)" : "var(--accent)", opacity: i === 0 ? 1 : .5 }} /></div>
              <span className="wf-barlbl">{S.labels[i]}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="wf-card" style={{ overflow: "hidden" }}>
        <div className="wf-pad" style={{ paddingBottom: 14 }}><div className="card-title">Risque de dépassement par budget</div></div>
        <table className="tbl">
          <thead><tr><th>Budget</th><th className="num">Consommé</th><th className="num">Projeté fin de mois</th><th className="num">Risque</th></tr></thead>
          <tbody>
            {D.budgetsFull.slice(0, 5).map((b) => {
              const proj = Math.round(b.pct * 1.18);
              const risk = proj >= 100 ? "over" : proj >= 90 ? "warn" : "ok";
              return (
                <tr key={b.name}>
                  <td style={{ fontWeight: 600 }}>{b.name}</td>
                  <td className="num t-mono t-muted">{b.pct}%</td>
                  <td className="num t-mono" style={{ fontWeight: 600 }}>{proj}%</td>
                  <td className="num"><span className={"badge " + risk}>{risk === "over" ? "Dépassement" : risk === "warn" ? "À surveiller" : "OK"}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </DeskShell>
  );
}
window.PrevisionsDesk = PrevisionsDesk;

// ---------- Anomalies ----------
function AnomaliesDesk() {
  const { Icon, money, data: D } = window.WF;
  return (
    <DeskShell active="Assistant" eyebrow="IA · détection" title="Anomalies & alertes"
      actions={[{ l: "Tout marquer normal", ic: "check" }]}>
      <AISub i={3} />
      <div className="wf-card wf-pad">
        <div className="card-head"><div className="card-title">Dépenses inhabituelles</div><span className="t-faint" style={{ fontSize: 11.5 }}>{D.anomalies.length} détectées ce mois-ci</span></div>
        <div className="c" style={{ gap: 12 }}>
          {D.anomalies.map((a, i) => (
            <div className="alert" key={i} style={{ alignItems: "flex-start" }}>
              <i className="swatch" style={{ background: a.niveau === "Élevé" ? "var(--neg)" : "var(--warn)" }} />
              <div className="row-ico" style={{ background: a.niveau === "Élevé" ? "var(--neg-wash)" : "var(--warn-wash)", color: a.niveau === "Élevé" ? "var(--neg)" : "var(--warn)" }}><Icon name="alert" size={18} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="r" style={{ gap: 8 }}><span style={{ fontWeight: 700, fontSize: 13.5 }}>{a.name}</span><span className="tag-cat">{a.cat}</span><span className="t-faint" style={{ fontSize: 11 }}>{a.when}</span></div>
                <div className="t-muted" style={{ fontSize: 12, marginTop: 3 }}>{a.reason}</div>
              </div>
              <div className="c" style={{ alignItems: "flex-end", gap: 8 }}>
                <span className="row-amt t-neg" style={{ margin: 0 }}>{money(a.amt)}</span>
                <div className="r" style={{ gap: 7 }}><button className="btn" style={{ padding: "6px 11px", fontSize: 12 }}>Normal</button><button className="btn" style={{ padding: "6px 11px", fontSize: 12 }}>Examiner</button></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="wf-card wf-pad">
        <div className="card-head"><div className="card-title">Paiements récurrents détectés</div><span className="card-link">Créer des budgets <Icon name="chevron" size={13} /></span></div>
        <div>
          {D.recurrences.map((r, i) => (
            <div className="row-line" key={i}>
              <div className="row-ico"><Icon name="repeat" size={16} /></div>
              <div style={{ lineHeight: 1.3, minWidth: 0 }}>
                <div className="r" style={{ gap: 8 }}><span style={{ fontWeight: 600, fontSize: 13 }}>{r.name}</span>{!r.known && <span className="badge ok">Nouveau</span>}</div>
                <div className="t-faint" style={{ fontSize: 11 }}>{r.freq} · prochain {r.next}</div>
              </div>
              <span className="row-amt" style={{ marginLeft: "auto" }}>{money(r.amt)}</span>
              <Icon name="chevron" size={15} className="t-faint" style={{ marginLeft: 12 }} />
            </div>
          ))}
        </div>
      </div>
    </DeskShell>
  );
}
window.AnomaliesDesk = AnomaliesDesk;

// ---------- Assistant mobile ----------
function AssistantMob() {
  const { Icon, money, data: D } = window.WF;
  return (
    <MobShell active="Assistant" tab="more" title="Assistant" sub="IA · sur votre appareil">
      <div className="chat">
        {D.chat.map((m, i) => (
          <div className={"msg " + (m.role === "ai" ? "ai" : "u")} key={i} style={{ maxWidth: "88%" }}>
            {m.role === "ai" && <div className="ai-av" style={{ width: 26, height: 26, fontSize: 11 }}>C</div>}
            <div className="bubble" style={{ fontSize: 12.5 }}>
              {m.text}
              {m.bars && (
                <div className="c" style={{ gap: 7, marginTop: 10 }}>
                  {m.bars.map((b) => (
                    <div key={b.l}>
                      <div className="r between" style={{ fontSize: 11, marginBottom: 4 }}><span style={{ fontWeight: 600 }}>{b.l}</span><span className="t-mono t-muted">{b.p}%</span></div>
                      <div className="wf-prog" style={{ height: 5 }}><i className="wf-prog-fill" style={{ width: b.p * 3.4 + "%" }} /></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="r" style={{ gap: 7, flexWrap: "wrap" }}>
        {D.suggestions.slice(0, 2).map((s) => <span key={s} className="chip" style={{ fontSize: 11 }}>{s}</span>)}
      </div>
      <div className="ask"><Icon name="message" size={16} /><span style={{ flex: 1 }}>Posez une question…</span><div className="icon-btn" style={{ width: 30, height: 30, background: "var(--solid)", color: "var(--on-solid)", border: "none" }}><Icon name="send" size={15} /></div></div>
    </MobShell>
  );
}
window.AssistantMob = AssistantMob;
